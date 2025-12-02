import express from "express";
import multer from "multer";
import { extractCVData, getCvByUser, calculateATSScore } from "../controllers/cv.controller.js";

const router = express.Router();


const upload = multer({ dest: "uploads/" });

router.post("/upload-cv", upload.single("cv"), extractCVData);

router.post("/calculate-ats", upload.single("cv"), calculateATSScore);

router.get("/user/:userId", getCvByUser);

export default router;
