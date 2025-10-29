import InterviewQuestion from "../models/interviewQuestions.model.js";

export async function getQuestionsByDiscipline(req, res) {
  const { discipline } = req.params;

  try {
    const data = await InterviewQuestion.findOne({ discipline });

    if (!data) {
      return res.status(404).json({ message: "No questions found for this discipline" });
    }

    res.json({
      discipline: data.discipline,
      questions: data.questions,
      timeLimit: data.timeLimit,
    });
  } catch (error) {
    console.error("Error fetching interview questions:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
