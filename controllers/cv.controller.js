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


// New Controller: Calculate ATS Score with Suggestions
export const calculateATSScore = async (req, res) => {
  try {
    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No CV file uploaded" });
    }

    // Job title is required for ATS calculation
    const { jobTitle } = req.body;
    if (!jobTitle || jobTitle.trim() === '') {
      return res.status(400).json({ 
        message: "Job title is required for ATS score calculation" 
      });
    }

    // Read and extract text from uploaded CV
    const pdfBuffer = fs.readFileSync(req.file.path);
    const parser = new PDFParse({ data: pdfBuffer });
    const pdfData = await parser.getText();
    const cvText = pdfData.text;

    // Extract CV data using OpenAI
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
    raw = raw.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();

    let aiExtractedData;
    try {
      aiExtractedData = JSON.parse(raw);
    } catch (err) {
      console.error("❌ Error parsing AI JSON:", err);
      return res.status(500).json({
        message: "Failed to process CV (invalid JSON format from AI)",
        error: err.message,
      });
    }

    // Normalize the extracted data
    const normalizedData = normalizeExtractedData(aiExtractedData);

    // Calculate ATS score based on job title
    const atsResult = calculateATS(normalizedData, jobTitle);

    // Generate detailed suggestions if score is less than 75%
    let improvementMessage = "";
    if (atsResult.ATS_Score < 75) {
      const suggestions = generateSimpleSuggestions(atsResult.breakdown, normalizedData, jobTitle);
      improvementMessage = suggestions.join("\n");
    } else {
      improvementMessage = "✅ Great! Your CV meets the ATS standards and is well-matched for this position.";
    }

    // Clean up uploaded file
    if (typeof parser?.destroy === "function") await parser.destroy();
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      atsScore: atsResult.ATS_Score,
      message: improvementMessage
    });

  } catch (error) {
    console.error("Error calculating ATS score:", error);
    
    // Clean up file if it exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      message: "Failed to calculate ATS score", 
      error: error.message 
    });
  }
};

// Helper function to generate simple improvement suggestions
function generateSimpleSuggestions(breakdown, extractedData, jobTitle) {
  const suggestions = [];

  // Job Title Relevance is the most important (70% weight)
  if (breakdown.jobTitleRelevance < 52) {
    suggestions.push(`⚠️ Your experience doesn't match well with "${jobTitle}". Consider highlighting relevant skills and experience that align with this role.`);
    suggestions.push("💡 Add projects or coursework related to this position if you lack direct experience.");
  } else if (breakdown.jobTitleRelevance < 35) {
    suggestions.push(`⚠️ Low job match: Your CV shows experience in different areas. Tailor your CV to emphasize transferable skills for "${jobTitle}".`);
  }

  // Other improvements (30% combined weight)
  if (breakdown.keywords < 5) {
    suggestions.push("💡 Use more action verbs like 'managed', 'developed', 'led', 'implemented' in your experience descriptions.");
    suggestions.push("💡 Include industry-specific keywords and technical terms relevant to the job.");
  }

  if (breakdown.completeness < 5) {
    suggestions.push("⚠️ Your CV is missing essential sections. Ensure you have: Professional Summary, Work Experience, Education, and Skills.");
  }

  if (breakdown.formatting < 5) {
    suggestions.push("💡 Use standard section headings like 'Professional Experience', 'Education', 'Skills' for better ATS compatibility.");
  }

  if (breakdown.contentQuality < 2) {
    suggestions.push("💡 Focus on achievements with quantifiable results (e.g., 'Increased sales by 30%', 'Managed team of 10').");
  }

  if (breakdown.parsing < 2.5) {
    suggestions.push("💡 Ensure clear formatting with proper job titles, company names, and date ranges.");
  }

  return suggestions;
}

// Helper function to generate detailed suggestions
function generateDetailedSuggestions(breakdown, extractedData, jobTitle) {
  const suggestions = [];

  // 1. Formatting suggestions (max 10 points)
  if (breakdown.formatting < 8) {
    suggestions.push({
      category: "Formatting & Structure",
      priority: "High",
      currentScore: `${breakdown.formatting}/10`,
      issue: "Your CV lacks standard section headings that ATS systems recognize",
      improvements: [
        "Use clear section headings like 'Professional Experience', 'Education', 'Skills', 'Summary'",
        "Ensure consistent formatting throughout your CV",
        "Use bullet points for better readability",
        "Avoid using tables, text boxes, or images as ATS systems cannot parse them"
      ]
    });
  }

  // 2. Keywords suggestions (max 10 points)
  if (breakdown.keywords < 7) {
    suggestions.push({
      category: "Keywords & Professional Terminology",
      priority: "High",
      currentScore: `${breakdown.keywords}/10`,
      issue: "Not enough action verbs and industry-specific keywords",
      improvements: [
        "Use action verbs: 'managed', 'developed', 'led', 'implemented', 'designed', 'optimized'",
        "Include industry-specific technical terms and buzzwords",
        "Add relevant certifications and professional qualifications",
        "Use numbers and metrics (e.g., 'Increased sales by 30%', 'Managed team of 10')",
        "Include keywords from the job description you're applying to"
      ]
    });
  }

  // 3. Completeness suggestions (max 10 points)
  if (breakdown.completeness < 7) {
    const missingSections = [];
    if (!extractedData.personalInfo?.email) missingSections.push("Contact Email");
    if (!extractedData.professionalSummary) missingSections.push("Professional Summary");
    if (!extractedData.workExperience || extractedData.workExperience.length === 0) missingSections.push("Work Experience");
    if (!extractedData.education || extractedData.education.length === 0) missingSections.push("Education");
    if (!extractedData.skills || !extractedData.skills.technical || extractedData.skills.technical.length === 0) missingSections.push("Skills");

    suggestions.push({
      category: "Completeness",
      priority: "Critical",
      currentScore: `${breakdown.completeness}/10`,
      issue: "Essential sections are missing from your CV",
      missingSections: missingSections,
      improvements: [
        "Add a professional summary highlighting your key strengths (2-3 sentences)",
        "Include detailed work experience with job titles, companies, and dates",
        "List your educational qualifications with degree names and institutions",
        "Create a comprehensive skills section with technical and soft skills",
        "Ensure contact information is complete (email, phone, location)"
      ]
    });
  }

  // 4. Parsing suggestions (max 5 points)
  if (breakdown.parsing < 3) {
    suggestions.push({
      category: "ATS Parsing Compatibility",
      priority: "High",
      currentScore: `${breakdown.parsing}/5`,
      issue: "ATS systems may have difficulty parsing your CV",
      improvements: [
        "Use simple, clean formatting without complex layouts",
        "Clearly label job titles, company names, and employment dates",
        "Use standard date formats (e.g., 'Jan 2020 - Dec 2022' or '2020-2022')",
        "Avoid headers/footers as ATS systems often ignore them",
        "Save your CV as a .docx or .pdf file (PDF preferred)"
      ]
    });
  }

  // 5. Content Quality suggestions (max 5 points)
  if (breakdown.contentQuality < 3) {
    suggestions.push({
      category: "Content Quality",
      priority: "Medium",
      currentScore: `${breakdown.contentQuality}/5`,
      issue: "Your CV content needs to be more professional and achievement-focused",
      improvements: [
        "Use professional language and avoid casual tone",
        "Focus on achievements rather than just responsibilities",
        "Quantify your accomplishments with numbers and percentages",
        "Use power words like 'achieved', 'accomplished', 'improved', 'increased'",
        "Keep descriptions concise but impactful",
        "Maintain CV length between 1-2 pages"
      ]
    });
  }

  // 6. Job Title Relevance suggestions (max 60 points)
  if (jobTitle && breakdown.jobTitleRelevance < 30) {
    suggestions.push({
      category: "Job Title Relevance",
      priority: "Critical",
      currentScore: `${breakdown.jobTitleRelevance}/60`,
      issue: `Your experience doesn't strongly match the target role: "${jobTitle}"`,
      improvements: [
        `Highlight transferable skills relevant to ${jobTitle}`,
        "Emphasize similar roles or responsibilities from your experience",
        "Add relevant projects that demonstrate required skills",
        "Consider taking courses or certifications related to the role",
        "Tailor your professional summary to match the job requirements",
        "Use keywords from the job description throughout your CV"
      ]
    });
  }

  // Calculate overall improvement potential
  const totalPossibleScore = 100;
  const currentScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0);
  const improvementNeeded = totalPossibleScore - currentScore;

  // Add summary suggestion
  suggestions.unshift({
    category: "Overall Summary",
    priority: "Info",
    currentScore: `${currentScore}/100`,
    issue: `Your CV needs ${improvementNeeded} more points to reach 100%`,
    improvements: [
      `Focus on the high-priority improvements listed below`,
      `Your current ATS score is ${currentScore}%. Aim for 75% or higher`,
      `Address the critical and high-priority issues first for maximum impact`
    ]
  });

  return suggestions;
}
