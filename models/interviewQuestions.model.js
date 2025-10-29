import mongoose from "mongoose";

const interviewQuestionSchema = new mongoose.Schema({
  discipline: {
    type: String,
    required: true,
    unique: true, // so each discipline has one set of questions
  },
  questions: [
    {
      type: String,
      required: true,
    },
  ],
  timeLimit: {
    type: Number,
    required: true,
   
  },
});

const InterviewQuestion = mongoose.model("InterviewQuestion", interviewQuestionSchema);

export default InterviewQuestion;
