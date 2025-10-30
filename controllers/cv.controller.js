import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function extractCVData(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

  
    const { default: pdfParse } = await import("pdf-parse");

    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);
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

    fs.unlinkSync(req.file.path);
  } catch (error) {
    console.error("Error processing CV:", error);
    res.status(500).json({ message: "Failed to process CV" });
  }
}
