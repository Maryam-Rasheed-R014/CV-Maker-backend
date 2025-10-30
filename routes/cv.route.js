import express from "express";
import multer from "multer";
import { extractCVData } from "../controllers/cv.controller.js";

const router = express.Router();


const upload = multer({ dest: "uploads/" });

router.post("/upload-cv", upload.single("cv"), extractCVData);

export default router;
