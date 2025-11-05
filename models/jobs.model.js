import mongoose from "mongoose";    
const jobsSchema = new mongoose.Schema(
  {
    jobTitle: {    
        type: String,
        required: true,
    },
    companyName: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    jobDescription: {
        type: String,
        required: true,
    },
    requirements: {
        type: String,
        required: true,
    },
    vacancies: {
        type: Number,
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
  },
  {
    timestamps: true,
  }
);
const Jobs = mongoose.model("Jobs", jobsSchema); 
export default Jobs;