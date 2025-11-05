import express from "express";
import {
  applyForJob,
  getUserApplications,
  getAllApplications,
  getJobApplications,
  updateApplicationStatus,
  withdrawApplication,
} from "../controllers/appliedJobs.controller.js";

const router = express.Router();

// Apply for a job
router.post("/apply", applyForJob);

// Get ALL applications from database (for admin)
router.get("/all-applications", getAllApplications);

// Get all applications by logged-in user
router.get("/my-applications", getUserApplications);

// Get all applications for a specific job
router.get("/job/:jobId", getJobApplications);

// Update application status (admin/recruiter)
router.patch("/status/:applicationId", updateApplicationStatus);

// Withdraw application
router.delete("/withdraw/:applicationId", withdrawApplication);

export default router;
