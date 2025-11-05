import AppliedJob from "../models/appliedJobs.model.js";
import CvData from "../models/cvData.model.js";
import jwt from "jsonwebtoken";

// Apply for a job
export const applyForJob = async (req, res) => {
  try {
   
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

 
    const {
      jobId,
      jobTitle,
      jobType,
      salary,
      openings,
      yearsOfExperience,
      relevantExperience,
      currentLocation,
      expectedSalary,
    } = req.body;

   
    const salaryStr = typeof salary === 'string' ? salary : String(salary);
    const expectedSalaryStr = typeof expectedSalary === 'string' ? expectedSalary : String(expectedSalary);

 
    if (!jobId || !jobTitle || !jobType || !salary || !openings || 
        !yearsOfExperience || !relevantExperience || !currentLocation || !expectedSalary) {
      return res.status(400).json({ 
        message: "All fields are required",
        missing: {
          jobId: !jobId,
          jobTitle: !jobTitle,
          jobType: !jobType,
          salary: !salary,
          openings: !openings,
          yearsOfExperience: !yearsOfExperience,
          relevantExperience: !relevantExperience,
          currentLocation: !currentLocation,
          expectedSalary: !expectedSalary
        }
      });
    }

    
    const existingApplication = await AppliedJob.findOne({ userId, jobId });
    if (existingApplication) {
      return res.status(400).json({ 
        message: "You have already applied for this job",
        applicationId: existingApplication._id,
        appliedAt: existingApplication.appliedAt
      });
    }

   
    let atsScore = 0;
    const cvRecord = await CvData.findOne({ userId });
    if (cvRecord && cvRecord.atsScore) {
      atsScore = cvRecord.atsScore;
    }


    const newApplication = new AppliedJob({
      userId,
      jobId,
      jobTitle,
      jobType,
      salary: salaryStr,
      openings,
      yearsOfExperience,
      relevantExperience,
      currentLocation,
      expectedSalary: expectedSalaryStr,
      atsScore,
      applicationStatus: "pending",
    });

    await newApplication.save();

    res.status(201).json({
      message: "Application submitted successfully",
      application: {
        applicationId: newApplication._id,
        jobTitle: newApplication.jobTitle,
        jobType: newApplication.jobType,
        atsScore: newApplication.atsScore,
        applicationStatus: newApplication.applicationStatus,
        appliedAt: newApplication.appliedAt,
      },
    });
  } catch (error) {
    console.error("Error applying for job:", error);
    

    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "You have already applied for this job" 
      });
    }
    
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Get ALL applications from database (for admin dashboard)
export const getAllApplications = async (req, res) => {
  try {
    const applications = await AppliedJob.find()
      .sort({ appliedAt: -1 })
      .populate('userId', 'firstName lastName email')
      .populate('jobId', 'jobTitle companyName location');

    res.status(200).json({
      message: "All applications retrieved successfully",
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Error fetching all applications:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Get all applications by a user
export const getUserApplications = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const applications = await AppliedJob.find({ userId })
      .sort({ appliedAt: -1 })
      .populate('jobId', 'title company location'); // Populate job details if needed

    res.status(200).json({
      message: "Applications retrieved successfully",
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Error fetching user applications:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Get applications for a specific job
export const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({ message: "Job ID is required" });
    }

    const applications = await AppliedJob.find({ jobId })
      .sort({ atsScore: -1, appliedAt: 1 }) 
      .populate('userId', 'firstName lastName email'); 

    res.status(200).json({
      message: "Applications retrieved successfully",
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Error fetching job applications:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Update application status (for admin/recruiter)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required" });
    }

    if (!status || !["pending", "reviewed", "shortlisted", "rejected", "accepted"].includes(status)) {
      return res.status(400).json({ 
        message: "Valid status is required",
        validStatuses: ["pending", "reviewed", "shortlisted", "rejected", "accepted"]
      });
    }

    const application = await AppliedJob.findByIdAndUpdate(
      applicationId,
      { applicationStatus: status },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.status(200).json({
      message: "Application status updated successfully",
      application,
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Delete application (withdraw)
export const withdrawApplication = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { applicationId } = req.params;

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required" });
    }

    // Find and delete application (only if it belongs to the user)
    const application = await AppliedJob.findOneAndDelete({ 
      _id: applicationId, 
      userId 
    });

    if (!application) {
      return res.status(404).json({ 
        message: "Application not found or you don't have permission to withdraw it" 
      });
    }

    res.status(200).json({
      message: "Application withdrawn successfully",
      applicationId: application._id,
    });
  } catch (error) {
    console.error("Error withdrawing application:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};
