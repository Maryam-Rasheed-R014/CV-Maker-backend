import mongoose from "mongoose";

const appliedJobSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Jobs",
    required: true,
  },
  jobTitle: {
    type: String,
    required: true,
  },
  jobType: {
    type: String,
    required: true,
  },
  salary: {
    type: String,
    required: true,
  },
  openings: {
    type: Number,
    required: true,
  },
  yearsOfExperience: {
    type: String,
    required: true,
  },
  relevantExperience: {
    type: String,
    required: true,
  },
  currentLocation: {
    type: String,
    required: true,
  },
  expectedSalary: {
    type: String,
    required: true,
  },
  atsScore: {
    type: Number,
    default: 0,
  },
  applicationStatus: {
    type: String,
    enum: ["pending", "reviewed", "shortlisted", "rejected", "accepted"],
    default: "pending",
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Create compound index to prevent duplicate applications
appliedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

const AppliedJob = mongoose.model("AppliedJob", appliedJobSchema);
export default AppliedJob;
