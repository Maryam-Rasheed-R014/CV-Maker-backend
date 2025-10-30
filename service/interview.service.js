import mongoose from "mongoose";
import dotenv from "dotenv";
import InterviewQuestion from "../models/interviewQuestions.model.js";

dotenv.config();

export async function seedInterviewQuestions() {
  const data = [
    {
      discipline: "BSCS",
      questions: [
        "Explain the concept of OOP and its four main principles.",
        "What is the difference between a stack and a queue?",
        "How does a REST API work?",
        "Explain normalization in databases.",
        "What is the difference between synchronous and asynchronous programming?"
      ],
      timeLimit: 3*60
    },
    {
      discipline: "BBA",
      questions: [
        "What are the four Ps of marketing?",
        "Explain the concept of SWOT analysis.",
        "What is the role of leadership in business management?",
        "How do financial statements help in decision making?",
        "What is brand positioning?"
      ],
      timeLimit: 3*60
    },
    {
      discipline: "Finance",
      questions: [
        "Define risk management in finance.",
        "What is the difference between assets and liabilities?",
        "Explain the time value of money.",
        "What is diversification in investment?",
        "Describe the purpose of financial ratios."
      ],
      timeLimit: 3*60
    },
    {
      discipline: "BSSE",
      questions: [
  "Explain the Software Development Life Cycle (SDLC) and describe the key phases involved.",
  "What is the difference between functional and non-functional requirements? Provide examples of each.",
  "How do you ensure software quality and maintainability during the development process?",
  "Describe how version control systems like Git work, and explain the purpose of branching and merging.",
  "What is the difference between unit testing, integration testing, and system testing? When should each be applied?"
],

      timeLimit: 3*60
    }
  ];

  for (const entry of data) {
    await InterviewQuestion.findOneAndUpdate(
      { discipline: entry.discipline },
      entry,                            
      { upsert: true, new: true }      
    );
  }

  console.log(" Interview questions synced with DB");
}
