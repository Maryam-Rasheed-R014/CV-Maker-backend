import fs from "fs";
import OpenAI from "openai";
import { PDFParse } from "pdf-parse";
import jwt from "jsonwebtoken";
import CvData from "../models/cvData.model.js"; // <-- Import your model
import { calculateATS } from "../service/atsCalculation.service.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export  async function extractCVData(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

       const { jobDescription } = req.body;
    if (!jobDescription) return res.status(400).json({ message: "Job description is required" });


    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId, email } = decoded;

    // Read file and extract text
    const pdfBuffer = fs.readFileSync(req.file.path);
    const parser = new PDFParse({ data: pdfBuffer });
    const pdfData = await parser.getText();
    const cvText = pdfData.text;

    //  OpenAI API call
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an assistant that extracts structured resume data from raw text.",
        },
        {
          role: "user",
          content: `Extract the following from this CV text: 
            - Full name
            - Email
            - Skills (as an array)
            - Education
            - Experience summary
            Return a valid JSON object only.
            CV Text:\n${cvText}`,
        },
      ],
    });



let raw = response.choices[0].message.content.trim();

// Remove markdown formatting (```json ... ```)
raw = raw.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();

let aiExtractedData;
try {
  aiExtractedData = JSON.parse(raw);
} catch (err) {
  console.error("Error parsing AI JSON:", err, "Raw response:", raw);
  return res.status(500).json({
    message: "Failed to process CV (invalid JSON format from AI)",
    error: err.message,
  });
}
       const atsResult = calculateATS(aiExtractedData, jobDescription);

    //  Save to DB
  //   const newCvRecord = new CvData({
  //     userId,
  //     email,
  //     ...aiExtractedData,
  //    extractedData: aiExtractedData,
  //     atsScore: atsResult.ATS_Score
  //   });

  
  // await newCvRecord.save();
   const updatedCvRecord = await CvData.findOneAndUpdate(
      { userId }, // condition
      {
        userId,
        email,
        ...aiExtractedData,
        extractedData: aiExtractedData,
        atsScore: atsResult.ATS_Score,
       
      },
      { new: true, upsert: true, setDefaultsOnInsert: true } // create if not exist
    );
   res.status(200).json({
      message: "CV processed and ATS calculated successfully",
      data: updatedCvRecord,
       ats: atsResult
    });

   
    
    if (typeof parser?.destroy === "function") await parser.destroy();
    fs.unlinkSync(req.file.path);
   
  } catch (error) {
    console.error("Error processing CV:", error);
    res.status(500).json({ message: "Failed to process CV", error: error.message });
  }
}
