// ATS Scoring System - Comprehensive Resume Compatibility Analysis
// Based on 6 key criteria with weighted scoring

// Industry-standard action verbs for professional terminology
const ACTION_VERBS = new Set([
  "managed", "developed", "led", "implemented", "created", "designed", "built", "established",
  "improved", "increased", "reduced", "optimized", "streamlined", "coordinated", "executed",
  "delivered", "achieved", "supervised", "directed", "organized", "planned", "initiated",
  "collaborated", "analyzed", "resolved", "enhanced", "maintained", "operated", "administered"
]);

// Standard section headings that ATS systems recognize
const STANDARD_SECTIONS = [
  "experience", "work experience", "professional experience", "employment",
  "education", "academic background", "qualifications",
  "skills", "technical skills", "core competencies", "expertise",
  "summary", "professional summary", "profile", "objective",
  "contact", "contact information", "personal information",
  "achievements", "accomplishments", "awards", "certifications"
];

// 1. Standard Formatting & Structure Score (10% weight - reduced from 30%)
function calculateFormattingScore(extractedData) {
  let score = 0;
  const maxScore = 10;
  
  // Check for standard section headings (3 points)
  const sectionCount = STANDARD_SECTIONS.filter(section => {
    const dataString = JSON.stringify(extractedData).toLowerCase();
    return dataString.includes(section);
  }).length;
  score += Math.min(3, sectionCount * 0.5);
  
  // Check for clean structure - presence of organized sections (4 points)
  if (extractedData.personalInfo || extractedData.contact) score += 1;
  if (extractedData.workExperience || extractedData.experience) score += 1;
  if (extractedData.education) score += 1;
  if (extractedData.skills || extractedData.technicalSkills) score += 1;
  
  // Assume good formatting since AI extracted successfully (3 points)
  score += 3;
  
  return Math.min(score, maxScore);
}

// 2. Keyword Density & Professional Terminology (10% weight - reduced from 25%)
function calculateKeywordScore(extractedData) {
  let score = 0;
  const maxScore = 10;
  
  const allText = JSON.stringify(extractedData).toLowerCase();
  
  // Count action verbs (4 points)
  const actionVerbCount = Array.from(ACTION_VERBS).filter(verb => 
    allText.includes(verb)
  ).length;
  score += Math.min(4, actionVerbCount * 0.5);
  
  // Technical skills presence (3 points)
  if (extractedData.skills || extractedData.technicalSkills) {
    score += 3;
  }
  
  // Professional certifications (2 points)
  if (extractedData.certifications || allText.includes("certif")) {
    score += 2;
  }
  
  // Quantifiable achievements - look for numbers (1 point)
  const hasNumbers = /\d+/.test(allText);
  if (hasNumbers) score += 1;
  
  return Math.min(score, maxScore);
}

// 3. Completeness Score (10% weight - reduced from 20%)
function calculateCompletenessScore(extractedData) {
  let score = 0;
  const maxScore = 10;
  
  // Essential sections check
  if (extractedData.personalInfo?.email || extractedData.email) score += 2;
  if (extractedData.professionalSummary) score += 1.5;
  if (extractedData.workExperience && extractedData.workExperience.length > 0) score += 2.5;
  if (extractedData.education && extractedData.education.length > 0) score += 2;
  if (extractedData.skills && (extractedData.skills.technical?.length > 0 || Array.isArray(extractedData.skills))) score += 2;
  
  return Math.min(score, maxScore);
}

// 4. ATS Parsing Success Rate (5% weight - reduced from 15%)
function calculateParsingScore(extractedData) {
  let score = 0;
  const maxScore = 5;
  
  // Section identification (2 points)
  const identifiableSections = Object.keys(extractedData).length;
  score += Math.min(2, identifiableSections * 0.2);
  
  // Contact information parseability (2 points)
  if (extractedData.personalInfo?.email || extractedData.email) score += 1;
  if (extractedData.personalInfo?.phone || extractedData.phone) score += 1;
  
  // Job titles and companies clarity (1 point)
  if (extractedData.workExperience && Array.isArray(extractedData.workExperience) && extractedData.workExperience.length > 0) {
    const hasJobTitles = extractedData.workExperience.some(job => job.jobTitle);
    const hasCompanies = extractedData.workExperience.some(job => job.company);
    if (hasJobTitles && hasCompanies) score += 1;
  }
  
  return Math.min(score, maxScore);
}

// 5. Content Quality Metrics (5% weight - reduced from 10%)
function calculateContentQualityScore(extractedData) {
  let score = 0;
  const maxScore = 5;
  
  const allText = JSON.stringify(extractedData);
  
  // Appropriate length check (1 point)
  if (allText.length > 500 && allText.length < 10000) score += 1;
  
  // Professional language indicators (2 points)
  const professionalWords = ["professional", "experienced", "skilled", "expertise", "proficient"];
  const hasProfessionalLanguage = professionalWords.some(word => 
    allText.toLowerCase().includes(word)
  );
  if (hasProfessionalLanguage) score += 2;
  
  // Achievement-oriented language (2 points)
  const achievementWords = ["achieved", "accomplished", "improved", "increased", "successful"];
  const hasAchievementLanguage = achievementWords.some(word => 
    allText.toLowerCase().includes(word)
  );
  if (hasAchievementLanguage) score += 2;
  
  return Math.min(score, maxScore);
}

// Main ATS scoring function with comprehensive analysis
export function calculateATS(extractedData, jobTitle = null) {
  // Calculate base quality scores (40% total)
  const formattingScore = calculateFormattingScore(extractedData);        // 10%
  const keywordScore = calculateKeywordScore(extractedData);              // 10%
  const completenessScore = calculateCompletenessScore(extractedData);    // 10%
  const parsingScore = calculateParsingScore(extractedData);              // 5%
  const contentQualityScore = calculateContentQualityScore(extractedData);// 5%
  
  // Calculate job title relevance (60% weight)
  let jobTitleRelevance = 0;
  let jobTitleMatch = "Not Specified";
  
  if (jobTitle && typeof jobTitle === 'string' && jobTitle.trim() !== '') {
    const relevanceResult = calculateJobTitleRelevance(extractedData, jobTitle);
    jobTitleRelevance = relevanceResult.score; // 0-60 points
    jobTitleMatch = relevanceResult.match;
  } else {
    // If no job title provided, use base scores only (proportionally scaled to 100)
    const baseTotal = formattingScore + keywordScore + completenessScore + parsingScore + contentQualityScore;
    const scaledScore = Math.round((baseTotal / 40) * 100); // Scale 40-point base to 100
    
    return {
      ATS_Score: Math.min(100, scaledScore),
      rating: getRating(scaledScore),
      breakdown: {
        formatting: formattingScore,
        keywords: keywordScore,
        completeness: completenessScore,
        parsing: parsingScore,
        contentQuality: contentQualityScore,
        jobTitleRelevance: 0
      },
      jobTitleMatch: "Not Specified - Generic ATS Score Only",
      recommendations: generateRecommendations({
        formatting: formattingScore,
        keywords: keywordScore,
        completeness: completenessScore,
        parsing: parsingScore,
        contentQuality: contentQualityScore,
        jobTitleRelevance: 0
      }, null)
    };
  }
  
  // Total ATS score with job title (0-100)
  const totalScore = Math.min(100, Math.max(0, Math.round(
    formattingScore + keywordScore + completenessScore + parsingScore + contentQualityScore + jobTitleRelevance
  )));
  
  // Detailed breakdown for feedback
  const breakdown = {
    formatting: formattingScore,          // max 10
    keywords: keywordScore,               // max 10
    completeness: completenessScore,      // max 10
    parsing: parsingScore,                // max 5
    contentQuality: contentQualityScore,  // max 5
    jobTitleRelevance: jobTitleRelevance  // max 60
  };
  
  return {
    ATS_Score: totalScore,
    rating: getRating(totalScore),
    breakdown: breakdown,
    jobTitleMatch: jobTitleMatch,
    recommendations: generateRecommendations(breakdown, jobTitle)
  };
}

// Helper function to determine rating
function getRating(score) {
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  return "Poor";
}

// Calculate job title relevance score (60% weight - 0 to 60 points)
function calculateJobTitleRelevance(extractedData, targetJobTitle) {
  const maxScore = 60;
  const target = targetJobTitle.toLowerCase().trim();
  
  // Extract all job titles from work experience
  const candidateJobTitles = [];
  if (extractedData.workExperience && Array.isArray(extractedData.workExperience)) {
    extractedData.workExperience.forEach(job => {
      if (job.jobTitle) {
        candidateJobTitles.push(job.jobTitle.toLowerCase().trim());
      }
    });
  }
  
  // If no work experience, check for fresher/entry-level indicators
  if (candidateJobTitles.length === 0) {
    // Check if applying for entry-level/junior/intern positions
    const entryLevelKeywords = ['junior', 'entry', 'intern', 'trainee', 'fresher', 'graduate', 'associate'];
    const isEntryLevel = entryLevelKeywords.some(keyword => target.includes(keyword));
    
    if (isEntryLevel) {
      return {
        score: 25, // Moderate score for freshers applying to entry-level (42% of max)
        match: "Entry Level - Suitable for Freshers"
      };
    }
    
    return {
      score: 5, // Very low score for no experience applying to non-entry level
      match: "No Matching Experience Found"
    };
  }
  
  // Tokenize job titles for matching
  const targetTokens = target.split(/[\s\-\/]+/).filter(Boolean);
  
  let bestMatchScore = 0;
  let matchedTitle = "";
  
  candidateJobTitles.forEach(candidateTitle => {
    const candidateTokens = candidateTitle.split(/[\s\-\/]+/).filter(Boolean);
    
    // Exact match - Full 60 points
    if (candidateTitle === target) {
      bestMatchScore = Math.max(bestMatchScore, maxScore);
      matchedTitle = candidateTitle;
      return;
    }
    
    // Calculate token-based similarity
    let matchingTokens = 0;
    let keywordMatch = false;
    
    // Check for matching tokens
    targetTokens.forEach(targetToken => {
      candidateTokens.forEach(candidateToken => {
        // Exact token match
        if (targetToken === candidateToken) {
          matchingTokens++;
          // Check if it's a key role keyword (developer, engineer, manager, etc.)
          const keyRoleKeywords = ['developer', 'engineer', 'manager', 'analyst', 'designer', 
                                    'architect', 'specialist', 'lead', 'scientist', 'consultant'];
          if (keyRoleKeywords.includes(targetToken)) {
            keywordMatch = true;
          }
        }
        // Partial match (contains)
        else if (candidateToken.includes(targetToken) || targetToken.includes(candidateToken)) {
          matchingTokens += 0.7; // Partial credit
        }
      });
    });
    
    // Calculate similarity percentage
    const similarityPercent = matchingTokens / targetTokens.length;
    
    // Score based on similarity
    let currentScore = 0;
    
    if (similarityPercent >= 0.9) {
      // 90%+ match - Near exact (50-58 points)
      currentScore = 50 + (similarityPercent - 0.9) * 80;
    } else if (similarityPercent >= 0.7) {
      // 70-90% match - Strong (40-50 points)
      currentScore = 40 + (similarityPercent - 0.7) * 50;
    } else if (similarityPercent >= 0.5) {
      // 50-70% match - Good (25-40 points)
      currentScore = 25 + (similarityPercent - 0.5) * 75;
    } else if (similarityPercent >= 0.3) {
      // 30-50% match - Partial (15-25 points)
      currentScore = 15 + (similarityPercent - 0.3) * 50;
    } else {
      // < 30% match - Weak (0-15 points)
      currentScore = similarityPercent * 50;
    }
    
    // Bonus if key role keyword matches
    if (keywordMatch) {
      currentScore += 5;
    }
    
    if (currentScore > bestMatchScore) {
      bestMatchScore = currentScore;
      matchedTitle = candidateTitle;
    }
  });
  
  // Determine match quality
  let matchQuality;
  if (bestMatchScore >= 58) matchQuality = "Exact Match";
  else if (bestMatchScore >= 45) matchQuality = "Strong Match";
  else if (bestMatchScore >= 30) matchQuality = "Good Match";
  else if (bestMatchScore >= 15) matchQuality = "Partial Match";
  else matchQuality = "Weak Match";
  
  return {
    score: Math.round(bestMatchScore),
    match: matchQuality + (matchedTitle ? ` (${matchedTitle})` : "")
  };
}

// Generate improvement recommendations based on scores
function generateRecommendations(breakdown, jobTitle = null) {
  const recommendations = [];
  
  if (breakdown.formatting < 8) {
    recommendations.push("Use standard section headings like 'Experience', 'Education', 'Skills'");
  }
  
  if (breakdown.keywords < 7) {
    recommendations.push("Include more action verbs and industry-specific terminology");
  }
  
  if (breakdown.completeness < 7) {
    recommendations.push("Ensure all essential sections are present: contact info, summary, experience, education, skills");
  }
  
  if (breakdown.parsing < 3) {
    recommendations.push("Use clear job titles, company names, and proper date formatting");
  }
  
  if (breakdown.contentQuality < 3) {
    recommendations.push("Focus on achievements with quantifiable results and professional language");
  }
  
  if (jobTitle && breakdown.jobTitleRelevance < 30) {
    recommendations.push(`Your experience doesn't strongly match "${jobTitle}". Consider highlighting relevant transferable skills or similar roles.`);
  }
  
  return recommendations;
}

// Legacy function for job description matching (commented out but available)
/*
export function calculateJobMatchScore(extractedData, jobDescription) {
  // Previous keyword matching logic here...
  // This can be used as a separate endpoint for job-specific matching
}
*/
