import Feedback from "../models/feedback.model.js";
import User from "../models/auth.model.js";
import jwt from "jsonwebtoken";

// Submit feedback
export const submitFeedback = async (req, res) => {
  try {
 
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const email = user.email || "";

    
    const { rating, feedback } = req.body;

 
    if (!rating || !feedback) {
      return res.status(400).json({ 
        message: "All fields are required",
        missing: {
          rating: !rating,
          feedback: !feedback
        }
      });
    }

  
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: "Rating must be between 1 and 5" 
      });
    }


    if (feedback.trim().length === 0) {
      return res.status(400).json({ 
        message: "Feedback cannot be empty" 
      });
    }


    const newFeedback = new Feedback({
      userId,
      firstName,
      lastName,
      email,
      rating: parseInt(rating),
      feedback: feedback.trim(),
    });

    await newFeedback.save();

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback: {
        feedbackId: newFeedback._id,
        firstName: newFeedback.firstName,
        lastName: newFeedback.lastName,
        email: newFeedback.email,
        rating: newFeedback.rating,
        feedback: newFeedback.feedback,
        submittedAt: newFeedback.submittedAt,
      },
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Get all feedbacks (for admin)
export const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .sort({ submittedAt: -1 });

    res.status(200).json({
      message: "Feedbacks retrieved successfully",
      count: feedbacks.length,
      feedbacks,
    });
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Get feedbacks by user (optional )
export const getUserFeedbacks = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const feedbacks = await Feedback.find({ userId })
      .sort({ submittedAt: -1 });

    res.status(200).json({
      message: "Your feedbacks retrieved successfully",
      count: feedbacks.length,
      feedbacks,
    });
  } catch (error) {
    console.error("Error fetching user feedbacks:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Get feedback statistics (optional)
export const getFeedbackStats = async (req, res) => {
  try {
    const totalFeedbacks = await Feedback.countDocuments();
    
    const ratingStats = await Feedback.aggregate([
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const avgRating = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" }
        }
      }
    ]);

    res.status(200).json({
      message: "Feedback statistics retrieved successfully",
      stats: {
        totalFeedbacks,
        averageRating: avgRating[0]?.averageRating.toFixed(2) || 0,
        ratingDistribution: ratingStats,
      },
    });
  } catch (error) {
    console.error("Error fetching feedback stats:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Delete feedback (optional - if admin wants to remove inappropriate feedback)
export const deleteFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;

    if (!feedbackId) {
      return res.status(400).json({ message: "Feedback ID is required" });
    }

    const feedback = await Feedback.findByIdAndDelete(feedbackId);

    if (!feedback) {
      return res.status(404).json({ 
        message: "Feedback not found" 
      });
    }

    res.status(200).json({
      message: "Feedback deleted successfully",
      feedbackId: feedback._id,
    });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};
