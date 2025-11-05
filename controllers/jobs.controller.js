import Jobs from "../models/jobs.model.js";
export const createJob = async (req, res) => {
  try {
    const { jobTitle, companyName, location, jobDescription, requirements, vacancies, jobType, salary } = req.body;
    const newJob = new Jobs({
      jobTitle,
      companyName,
      location,
      jobDescription,
      requirements,
      vacancies,
      jobType,
      salary,
    });
    const savedJob = await newJob.save();
    res.status(201).json(savedJob);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating job", error: error.message });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Jobs.find();
    res.status(200).json(jobs);
  } catch (err) {
    {
      res.status(500).json({
        message: "error in fatching jobs",
        error: err.message,
      });
    }
  }
};




export const updateJob = async (req, res)=>{
    try{
        const {id}=req.params;
        const {jobTitle, companyName, location, jobDescription, requirements, vacancies, jobType, salary}= req.body; 
        const update= await Jobs.findByIdAndUpdate({
            _id:id
        },
        {   
            jobTitle,
            companyName,
            location,
            jobDescription,
            requirements,
            vacancies,
            jobType,
            salary,
        },
        {new:true   
        })
        res.status(200).json(update);

    }
    catch(err){
    res.status(500).json({
      message: "error in updating job",
      error: err.message,
    });
};
}


export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;  
    const deletedJob = await Jobs.findByIdAndDelete(id);
    if (!deletedJob) {
      return res.status(404).json({ message: "Job not found" });
    }   
    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting job", error: error.message });
  }
};