import express from 'express';

import {
createJob,
    deleteJob,
getAllJobs,
updateJob, } from '../controllers/jobs.controller.js';


const router = express.Router();    
router.post('/create', createJob);
router.get("/getAll", getAllJobs);
router.patch("/updateJob/:id", updateJob);
router.delete("/deleteJob/:id", deleteJob);
   
export default router;