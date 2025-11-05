import express from "express";
import {
  submitFeedback,
  getAllFeedbacks,
  getUserFeedbacks,
  getFeedbackStats,
  deleteFeedback,
} from "../controllers/feedback.controller.js";

const router = express.Router();

// Submit feedback (requires authentication)
router.post("/submit", submitFeedback);

// Get all feedbacks (for admin)
router.get("/all", getAllFeedbacks);

// Get user's own feedbacks
router.get("/my-feedbacks", getUserFeedbacks);

// Get feedback statistics
router.get("/stats", getFeedbackStats);

// Delete feedback (for admin)
router.delete("/:feedbackId", deleteFeedback);

export default router;
