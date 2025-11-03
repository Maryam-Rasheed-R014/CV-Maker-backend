 

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import DBconnection from "./config/db.js";
import userRoutes from "./routes/users.route.js";
import interviewRoutes from "./routes/interview.route.js";
import { seedInterviewQuestions } from "./service/interview.service.js";
import cvRoutes from "./routes/cv.route.js";
import jobRoutes from "./routes/jobs.route.js";


dotenv.config();



const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
  res.send("Server is running");
});


DBconnection();

//  When DB is connected, seed questions
mongoose.connection.once("open", async () => {
  console.log("MongoDB Connected Successfully to CVMaker Database");
  await seedInterviewQuestions(); // Auto sync data on every start
});

// Routes
app.use("/auth", userRoutes);
app.use("/interview", interviewRoutes);
app.use("/cv", cvRoutes);
app.use("/jobs", jobRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
