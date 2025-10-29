import express from "express";
import { getQuestionsByDiscipline } from "../controllers/interview.controller.js";



const router = express.Router();

router.get("/:discipline", getQuestionsByDiscipline);


export default router;
