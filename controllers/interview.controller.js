import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getQuestionsByDiscipline(req, res) {
  const { discipline } = req.params;

  try {
   
    if (!discipline || discipline.trim().length === 0) {
      return res.status(400).json({ message: "Discipline is required" });
    }


    const prompt = `Generate exactly 10 common interview questions for ${discipline} discipline/field. 
    
Requirements:
- Questions should be general and commonly asked in interviews for ${discipline} positions
- Include a mix of technical knowledge, practical experience, and behavioral questions
- Questions should be relevant to entry to mid-level professionals
- Return ONLY a JSON array of question strings, no additional text or explanation
- Format: ["question 1", "question 2", ..., "question 10"]

Example format:
["What is your experience with [relevant skill]?", "Describe a project where you...", ...]`;

   
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert HR interviewer who generates relevant interview questions for different disciplines. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    
    const responseText = completion.choices[0].message.content.trim();
    
    
    let cleanedResponse = responseText;
    if (responseText.startsWith("```json")) {
      cleanedResponse = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (responseText.startsWith("```")) {
      cleanedResponse = responseText.replace(/```\n?/g, "");
    }

    const questions = JSON.parse(cleanedResponse);

  
    if (!Array.isArray(questions) || questions.length !== 10) {
      console.error("Invalid response from OpenAI:", questions);
      return res.status(500).json({ 
        message: "Failed to generate questions in correct format" 
      });
    }

    res.json({
      discipline: discipline,
      questions: questions,
      timeLimit: 30, 
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error generating interview questions:", error);
    
    
    if (error instanceof SyntaxError) {
      return res.status(500).json({ 
        message: "Failed to parse generated questions",
        error: error.message 
      });
    }

    res.status(500).json({ 
      message: "Failed to generate interview questions", 
      error: error.message 
    });
  }
}
