import mongoose from "mongoose";    
const jobsSchema = new mongoose.Schema(
  {
    jobTitle: {    

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
salary:
        {   type: String,
            required: true,
        },  
    },
    {
        timestamps: true,
    }
);
const Jobs = mongoose.model("Jobs", jobsSchema); 
export default Jobs;