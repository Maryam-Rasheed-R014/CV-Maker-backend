import natural from "natural";

// Common English stopwords to ignore
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "in", "on", "with", "for", "to",
  "of", "by", "is", "are", "that", "this", "it", "at", "as", "be",
  "from", "was", "were", "has", "have", "had", "but"
]);

// Convert CV object into text for matching
function textFromCv(extractedData) {
  if (typeof extractedData === "object" && extractedData !== null) {
    const parts = [];
    if (extractedData.skills)
      parts.push(
        Array.isArray(extractedData.skills)
          ? extractedData.skills.join(" ")
          : String(extractedData.skills)
      );
    if (extractedData.experience) parts.push(String(extractedData.experience));
    if (extractedData.education) parts.push(String(extractedData.education));
    if (extractedData.summary) parts.push(String(extractedData.summary));
    return parts.join(" ").toLowerCase();
  }
  return String(extractedData).toLowerCase();
}

// Tokenization and cleanup
function tokenize(text) {
  const tokenizer = new natural.WordTokenizer();
  return tokenizer.tokenize(text);
}

function normalizeToken(tok) {
  return tok.replace(/[^a-z0-9\+\-#]/gi, "").toLowerCase();
}

function removeStopwords(tokens) {
  return tokens.filter((t) => !STOPWORDS.has(t));
}

// Main ATS scoring function
export function calculateATS(extractedData, jobDescription) {
  const cvText = textFromCv(extractedData);
  const jdText = String(jobDescription).toLowerCase();

  const cvTokens = tokenize(cvText).map(normalizeToken).filter(Boolean);
  const jdTokens = tokenize(jdText).map(normalizeToken).filter(Boolean);

  const cvFiltered = removeStopwords(cvTokens);
  const jdFiltered = removeStopwords(jdTokens);

  const cvSet = new Set(cvFiltered);
  const jdSet = new Set(jdFiltered);

  const matches = [...jdSet].filter((word) => cvSet.has(word));
  const denom = jdSet.size || 1;
  const score = Number(((matches.length / denom) * 100).toFixed(2));

  return {
    ATS_Score: score,

   
  };
}
