// import express from 'express';
// import dotenv from 'dotenv';
// import cors from 'cors';
// import DBconnection from './config/db.js'; 
// import userRoutes from './routes/users.route.js';
// import passport from 'passport';
// import googleStrategy from 'passport-google-oauth20';
// // import interviewRoutes from "./routes/service.route.js";
// import interviewRoutes from "./routes/interview.route.js";
// import { seedInterviewQuestions } from "./service/interview.service.js";
// import mongoose from "mongoose";
// dotenv.config();

// const app = express();
// const PORT =  5000;
// DBconnection();
// // Middleware

// app.use(cors());
// app.use(express.json());   

// app.use(express.urlencoded({ extended: true }));

// app.get('/', (req, res) => {
//     res.send('Server is running');
// });
// // mongoose.connection.once("open", async () => {
// //   console.log("MongoDB Connected Successfully to CVMaker Database");
// //   await seedInterviewQuestions(); // 👈 call here
// // });
// mongoose.connect()
//   .then(async () => {
//     console.log("MongoDB Connected Successfully to CVMaker Database");
//     await seedInterviewQuestions(); // 🔥 auto sync data on every start
//   })
//   .catch((err) => console.error("DB connection error:", err));
// app.use('/auth', userRoutes);
// app.use("/interview", interviewRoutes);

// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// }); 

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import DBconnection from "./config/db.js";
import userRoutes from "./routes/users.route.js";
import interviewRoutes from "./routes/interview.route.js";
import { seedInterviewQuestions } from "./service/interview.service.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Default route
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Connect to MongoDB
DBconnection();

// ✅ When DB is connected, seed questions
mongoose.connection.once("open", async () => {
  console.log("MongoDB Connected Successfully to CVMaker Database");
  await seedInterviewQuestions(); // Auto sync data on every start
});

// Routes
app.use("/auth", userRoutes);
app.use("/interview", interviewRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
