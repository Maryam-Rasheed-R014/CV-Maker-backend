import fs from "fs";
import OpenAI from "openai";
import { PDFParse } from "pdf-parse";
import jwt from "jsonwebtoken";
import CvData from "../models/cvData.model.js"; // <-- Import your model
import { calculateATS } from "../service/atsCalculation.service.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Normalize extracted data to ensure consistent structure
function normalizeExtractedData(rawData) {
  // Helper function to ensure array
  const ensureArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') return data.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

  const normalized = {
    personalInfo: {
      fullName: rawData.personalInfo?.fullName || rawData.fullName || rawData.name || "",
      email: rawData.personalInfo?.email || rawData.email || "",
      phone: rawData.personalInfo?.phone || rawData.phone || rawData.phoneNumber || "",
      location: rawData.personalInfo?.location || rawData.location || rawData.address || "",
      linkedin: rawData.personalInfo?.linkedin || rawData.linkedin || rawData.linkedIn || "",
      portfolio: rawData.personalInfo?.portfolio || rawData.portfolio || rawData.website || "",
    },
    
    professionalSummary: rawData.professionalSummary || rawData.summary || rawData.about || rawData.objective || rawData.profile || "",
    
    skills: {
      technical: ensureArray(
        rawData.skills?.technical || 
        rawData.technicalSkills || 
        (Array.isArray(rawData.skills) ? rawData.skills : null)
      ),
      soft: ensureArray(rawData.skills?.soft || rawData.softSkills),
      tools: ensureArray(rawData.skills?.tools || rawData.tools),
      certifications: ensureArray(rawData.skills?.certifications || rawData.certifications),
    },
    
    workExperience: ensureArray(rawData.workExperience || rawData.experience).map(job => ({
      jobTitle: job?.jobTitle || job?.title || job?.position || "",
      company: job?.company || job?.companyName || job?.organization || "",
      duration: job?.duration || job?.period || job?.dates || job?.timeframe || "",
      location: job?.location || "",
      description: job?.description || job?.responsibilities || job?.jobDescription || job?.duties || "",
      achievements: job?.achievements || job?.accomplishments || job?.keyAchievements || "",
      technologies: ensureArray(job?.technologies || job?.techStack || job?.tools),
    })),
    
    education: ensureArray(rawData.education).map(edu => ({
      degree: edu?.degree || edu?.qualification || edu?.certificate || edu?.program || "",
      institution: edu?.institution || edu?.school || edu?.university || edu?.college || "",
      duration: edu?.duration || edu?.year || edu?.period || edu?.graduation || "",
      grade: edu?.grade || edu?.cgpa || edu?.gpa || edu?.score || "",
      location: edu?.location || "",
      coursework: edu?.coursework || edu?.relevantCoursework || edu?.majorCourses || "",
    })),
    
    projects: ensureArray(rawData.projects).map(project => ({
      name: project?.name || project?.title || project?.projectName || "",
      description: project?.description || project?.details || project?.overview || "",
      technologies: ensureArray(project?.technologies || project?.techStack || project?.tools),
      duration: project?.duration || project?.period || project?.timeframe || "",
      role: project?.role || project?.position || project?.responsibility || "",
      link: project?.link || project?.url || project?.github || project?.demo || "",
    })),
    
    achievements: ensureArray(rawData.achievements || rawData.awards || rawData.accomplishments),
    languages: ensureArray(rawData.languages || rawData.spokenLanguages),
    interests: ensureArray(rawData.interests || rawData.hobbies),
  };
  
  return normalized;
}

export  async function extractCVData(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

       const { jobDescription, jobTitle } = req.body;
    // Job description and job title are now optional - ATS score is calculated generically
    // jobTitle is used for relevance matching if provided


    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId, email } = decoded;

    // Read file and extract text
    const pdfBuffer = fs.readFileSync(req.file.path);
    const parser = new PDFParse({ data: pdfBuffer });
    const pdfData = await parser.getText();
    const cvText = pdfData.text;

    //  OpenAI API call
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert CV/Resume parser. Extract ALL information from the provided CV text and return it in a structured JSON format. 
          Be thorough and extract every detail. If a field is not present in the CV, use an empty string or empty array.
          CRITICAL: Return ONLY valid JSON, no explanations or markdown formatting.`
        },
        {
          role: "user",
          content: `Parse this CV and extract ALL information into the following exact JSON structure:

{
  "personalInfo": {
    "fullName": "extract full name",
    "email": "extract email address",
    "phone": "extract phone number",
    "location": "extract city, state/country",
    "linkedin": "extract LinkedIn URL if present",
    "portfolio": "extract portfolio/website URL if present"
  },
  "professionalSummary": "extract complete professional summary, objective, or about section - full paragraph(s)",
  "skills": {
    "technical": ["list ALL technical skills, programming languages, frameworks, libraries as separate items"],
    "soft": ["list ALL soft skills like leadership, communication, etc."],
    "tools": ["list ALL tools and technologies"],
    "certifications": ["list ALL certifications and professional qualifications"]
  },
  "workExperience": [
    {
      "jobTitle": "extract exact job title",
      "company": "extract company name",
      "duration": "extract start date - end date",
      "location": "extract job location",
      "description": "extract COMPLETE job description and responsibilities - all bullet points combined",
      "achievements": "extract ALL achievements and accomplishments",
      "technologies": ["list all technologies/tools used in this role"]
    }
  ],
  "education": [
    {
      "degree": "extract degree/qualification name",
      "institution": "extract school/university name",
      "duration": "extract year or duration",
      "grade": "extract GPA/CGPA/percentage if mentioned",
      "location": "extract institution location",
      "coursework": "extract relevant coursework if mentioned"
    }
  ],
  "projects": [
    {
      "name": "extract project name",
      "description": "extract COMPLETE project description - all details",
      "technologies": ["list all technologies used"],
      "duration": "extract project duration if mentioned",
      "role": "extract your role in project",
      "link": "extract GitHub/demo link if present"
    }
  ],
  "achievements": ["list ALL awards, achievements, recognitions"],
  "languages": ["list ALL languages with proficiency if mentioned"],
  "interests": ["list hobbies and interests if present"]
}

IMPORTANT RULES:
1. Extract EVERYTHING - be thorough and detailed
2. For descriptions and summaries, extract the FULL TEXT, not summaries
3. Keep all bullet points and details in descriptions
4. If a section is not present, use empty string "" or empty array []
5. Return ONLY the JSON object, no additional text
6. Ensure valid JSON format

CV Text:
${cvText}`,
        },
      ],
    });



let raw = response.choices[0].message.content.trim();

// Remove markdown formatting (```json ... ```)
raw = raw.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();

let aiExtractedData;
try {
  aiExtractedData = JSON.parse(raw);
  console.log("✅ OpenAI Raw Response Structure:", JSON.stringify(Object.keys(aiExtractedData), null, 2));
  console.log("📋 Raw Data Sample:", JSON.stringify(aiExtractedData, null, 2).substring(0, 500) + "...");
} catch (err) {
  console.error("❌ Error parsing AI JSON:", err);
  console.error("📄 Raw response:", raw.substring(0, 1000));
  return res.status(500).json({
    message: "Failed to process CV (invalid JSON format from AI)",
    error: err.message,
  });
}

// Normalize the extracted data to ensure consistent structure
const normalizedData = normalizeExtractedData(aiExtractedData);
console.log("✨ Normalized Data Structure:", JSON.stringify({
  personalInfo: normalizedData.personalInfo,
  skillsCount: {
    technical: normalizedData.skills.technical.length,
    soft: normalizedData.skills.soft.length,
    tools: normalizedData.skills.tools.length,
    certifications: normalizedData.skills.certifications.length
  },
  workExperienceCount: normalizedData.workExperience.length,
  educationCount: normalizedData.education.length,
  projectsCount: normalizedData.projects.length
}, null, 2));

const atsResult = calculateATS(normalizedData, jobTitle); // Pass jobTitle for relevance matching

   
   const updatedCvRecord = await CvData.findOneAndUpdate(
      { userId }, // condition
      {
        userId,
        email,
        extractedData: normalizedData, // Use normalized data
        atsScore: atsResult.ATS_Score,
       
      },
      { new: true, upsert: true, setDefaultsOnInsert: true } // create if not exist
    );
   
   res.status(200).json({
      message: "CV processed and ATS calculated successfully",
      data: {
        userId: updatedCvRecord.userId,
        email: updatedCvRecord.email,
        atsScore: updatedCvRecord.atsScore,
        extractedData: normalizedData,
        createdAt: updatedCvRecord.createdAt,
      },
      ats: atsResult
    });

   
    
    if (typeof parser?.destroy === "function") await parser.destroy();
    fs.unlinkSync(req.file.path);
   
  } catch (error) {
    console.error("Error processing CV:", error);
    res.status(500).json({ message: "Failed to process CV", error: error.message });
  }
}

// Controller: Get CV record by userId
export const getCvByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

  
    const cvRecord = await CvData.findOne({ userId });

    if (!cvRecord) {
      return res.status(404).json({ message: "CV record not found" });
    }

 
    const { atsScore, createdAt, email, extractedData } = cvRecord;

    return res.status(200).json({
      atsScore,
      createdAt,
      email,
      extractedData,
    });
  } catch (error) {
    console.error("Error fetching CV by userId:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
