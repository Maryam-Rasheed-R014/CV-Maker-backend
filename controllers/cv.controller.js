import fs from "fs";
import OpenAI from "openai";
import { PDFParse } from "pdf-parse";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function extractCVData(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

  
  

  const pdfBuffer = fs.readFileSync(req.file.path);
  // pdf-parse v2 exposes the PDFParse class — instantiate and call getText()
  const parser = new PDFParse({ data: pdfBuffer });
  const pdfData = await parser.getText();
  const cvText = pdfData.text;

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
          - Skills
          - Education
          - Experience summary
          CV Text:\n${cvText}`,
        },
      ],
    });

    const aiExtractedData = response.choices[0].message.content;

    res.json({
      message: "CV processed successfully",
      data: aiExtractedData,
    });

  if (typeof parser?.destroy === "function") await parser.destroy();
  fs.unlinkSync(req.file.path);
  } catch (error) {
    console.error("Error processing CV:", error);
    res.status(500).json({ message: "Failed to process CV" });
  }
}
