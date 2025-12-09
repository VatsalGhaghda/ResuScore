/**
 * ATS Optimization Analysis Engine
 * Analyzes resume for ATS compatibility and optimization
 */

import { countWords } from '../utils/textPreprocessor';

export interface ATSAnalysis {
  keywords: {
    keywordDensity: number;
    uniqueKeywords: number;
    keywordFrequency: { [keyword: string]: number };
    jobSpecificMatch?: {
      matchPercentage: number;
      matchedKeywords: string[];
      missingKeywords: string[];
    };
  };
  bullets: {
    bulletCount: number;
    averageBulletLength: number;
    usesActionVerbs: boolean;
    actionVerbCount: number;
    actionVerbs: string[];
    hasQuantifiedResults: boolean;
    quantifiedCount: number;
    issues: string[];
  };
  length: {
    wordCount: number;
    characterCount: number;
    estimatedPages: number;
    isOptimal: boolean;
    issues: string[];
  };
  achievements: {
    hasAchievements: boolean;
    achievementCount: number;
    usesActionVerbs: boolean;
    hasQuantifiedResults: boolean;
    issues: string[];
  };
  overallATSScore: number;
  suggestions: string[];
}

// Common action verbs for resumes
const ACTION_VERBS = [
  'developed', 'created', 'designed', 'implemented', 'built', 'managed', 'led',
  'improved', 'increased', 'decreased', 'reduced', 'optimized', 'enhanced',
  'achieved', 'delivered', 'executed', 'launched', 'established', 'initiated',
  'collaborated', 'coordinated', 'facilitated', 'streamlined', 'transformed',
  'analyzed', 'researched', 'evaluated', 'identified', 'solved', 'resolved',
  'maintained', 'supported', 'trained', 'mentored', 'supervised', 'oversaw'
];

// Common technical keywords
const COMMON_TECH_KEYWORDS = [
  'javascript', 'python', 'java', 'react', 'node', 'sql', 'html', 'css',
  'aws', 'docker', 'kubernetes', 'git', 'mongodb', 'postgresql', 'mysql',
  'typescript', 'angular', 'vue', 'express', 'django', 'flask', 'spring',
  'machine learning', 'ai', 'data science', 'agile', 'scrum', 'devops',
  'rest api', 'graphql', 'microservices', 'ci/cd', 'testing', 'tdd'
];

/**
 * Analyze ATS optimization
 */
export function analyzeATS(text: string, jobDescription?: string, rawTextForBullets?: string): ATSAnalysis {
  const keywords = analyzeKeywords(text, jobDescription);
  // Use raw text for bullet detection if provided (preserves line breaks), otherwise use cleaned text
  const bullets = analyzeBullets(rawTextForBullets || text);
  const length = analyzeLength(text);
  const achievements = analyzeAchievements(text);

  // Calculate overall ATS score
  const overallATSScore = calculateATSScore(keywords, bullets, length, achievements);

  // Generate suggestions
  const suggestions = generateATSSuggestions(keywords, bullets, length, achievements);

  return {
    keywords,
    bullets,
    length,
    achievements,
    overallATSScore,
    suggestions,
  };
}

/**
 * Analyze keywords
 */
function analyzeKeywords(text: string, jobDescription?: string): ATSAnalysis['keywords'] {
  const normalizedText = text.toLowerCase();
  const words = normalizedText.split(/\s+/).filter(w => w.length > 2);
  const totalWords = words.length;

  // Extract technical keywords
  const keywordFrequency: { [keyword: string]: number } = {};
  const foundKeywords: string[] = [];

  for (const keyword of COMMON_TECH_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      keywordFrequency[keyword] = matches.length;
      foundKeywords.push(keyword);
    }
  }

  // Calculate keyword density
  const keywordOccurrences = Object.values(keywordFrequency).reduce((a, b) => a + b, 0);
  const keywordDensity = totalWords > 0 ? (keywordOccurrences / totalWords) * 100 : 0;

  // Job-specific keyword matching
  let jobSpecificMatch: ATSAnalysis['keywords']['jobSpecificMatch'] | undefined;
  if (jobDescription) {
    jobSpecificMatch = matchJobKeywords(text, jobDescription);
  }

  return {
    keywordDensity: Math.round(keywordDensity * 100) / 100,
    uniqueKeywords: foundKeywords.length,
    keywordFrequency,
    jobSpecificMatch,
  };
}

/**
 * Enhanced job description keyword matching
 * Extracts skills, technologies, qualifications, and requirements
 */
function matchJobKeywords(resumeText: string, jobDescription: string): ATSAnalysis['keywords']['jobSpecificMatch'] {
  const resumeLower = resumeText.toLowerCase();
  const jobLower = jobDescription.toLowerCase();

  // Extended common words list
  const commonWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'are', 
    'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 
    'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'from', 'into', 'onto',
    'about', 'above', 'below', 'between', 'during', 'through', 'under', 'over', 'after', 'before'
  ]);

  // Extract important sections from job description
  const sections = {
    requirements: extractSection(jobLower, ['requirements', 'required', 'must have', 'qualifications']),
    skills: extractSection(jobLower, ['skills', 'technical skills', 'competencies', 'abilities']),
    experience: extractSection(jobLower, ['experience', 'years of', 'minimum', 'preferred']),
    education: extractSection(jobLower, ['education', 'degree', 'bachelor', 'master', 'phd', 'diploma']),
  };

  // Combine all sections for keyword extraction
  const combinedText = Object.values(sections).filter(Boolean).join(' ') || jobLower;

  // Extract keywords (3+ characters, excluding common words)
  const jobWords = combinedText
    .split(/[\s,;:()\[\]{}|]+/)
    .map(word => word.replace(/[^a-z0-9+#]/g, '').toLowerCase())
    .filter(word => word.length >= 3 && !commonWords.has(word));

  // Count frequency and prioritize important keywords
  const keywordFrequency: { [key: string]: number } = {};
  jobWords.forEach(word => {
    keywordFrequency[word] = (keywordFrequency[word] || 0) + 1;
  });

  // Sort by frequency and get top keywords
  const sortedKeywords = Object.entries(keywordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100) // Top 100 by frequency
    .map(([word]) => word);

  // Also extract multi-word phrases (2-3 words) that might be important
  const phrases = extractPhrases(jobLower, 2, 3);
  const allKeywords = [...new Set([...sortedKeywords, ...phrases])].slice(0, 80);

  // Check which keywords appear in resume (exact match and partial match)
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];
  const partialMatches: string[] = [];

  for (const keyword of allKeywords) {
    // Exact word boundary match
    const exactRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (exactRegex.test(resumeLower)) {
      matchedKeywords.push(keyword);
    } else {
      // Check for partial match (keyword contains or is contained in resume words)
      const partialRegex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      if (partialRegex.test(resumeLower)) {
        partialMatches.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    }
  }

  // Calculate match percentage (exact matches + 0.5 * partial matches)
  const totalMatches = matchedKeywords.length + (partialMatches.length * 0.5);
  const matchPercentage = allKeywords.length > 0
    ? Math.round((totalMatches / allKeywords.length) * 100)
    : 0;

  // Prioritize missing keywords by frequency
  const missingWithFrequency = missingKeywords
    .map(kw => ({ keyword: kw, frequency: keywordFrequency[kw] || 1 }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 30)
    .map(item => item.keyword);

  return {
    matchPercentage,
    matchedKeywords: matchedKeywords.slice(0, 30),
    missingKeywords: missingWithFrequency,
  };
}

/**
 * Extract section from job description based on keywords
 */
function extractSection(text: string, keywords: string[]): string {
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[^.]*[.:]?([^.]*(?:\\.[^.]*){0,3})`, 'i');
    const match = text.match(regex);
    if (match) {
      return match[0];
    }
  }
  return '';
}

/**
 * Extract important phrases (n-grams) from text
 */
function extractPhrases(text: string, minWords: number, maxWords: number): string[] {
  const phrases: string[] = [];
  const words = text.split(/\s+/).filter(w => w.length >= 3);
  
  for (let n = minWords; n <= maxWords; n++) {
    for (let i = 0; i <= words.length - n; i++) {
      const phrase = words.slice(i, i + n).join(' ');
      // Only include phrases that look like skills/technologies (contain tech terms, action words, etc.)
      if (phrase.length >= 5 && phrase.length <= 40) {
        phrases.push(phrase);
      }
    }
  }
  
  // Return unique phrases, limit to top 20
  return [...new Set(phrases)].slice(0, 20);
}

/**
 * Analyze bullet points
 */
function analyzeBullets(text: string): ATSAnalysis['bullets'] {
  const issues: string[] = [];
  
  // Find bullet points - improved pattern that works with normalized text
  // Pattern 1: Lines starting with bullet characters (preserves newlines)
  const bulletPattern1 = /(?:^|\n)[\s]*[•\-\*\u2022\u2023\u25E6\u2043\u2219]\s+(.+?)(?=\n|$)/gm;
  // Pattern 2: Standalone bullet characters followed by content (for normalized text)
  // More flexible: allows for various spacing and content
  const bulletPattern2 = /[•\-\*\u2022\u2023\u25E6\u2043\u2219][\s]+([A-Z][^\n•\-\*]{15,})/g;
  // Pattern 3: Numbered bullets (1., 2., etc.)
  const bulletPattern3 = /(?:^|\n)[\s]*\d+[\.\)]\s+(.+?)(?=\n|$)/gm;
  // Pattern 4: Dash bullets at start of line or after newline (common in resumes)
  const bulletPattern4 = /(?:^|\n)[\s]*[-–—]\s+([A-Z][^\n]{20,})/gm;
  // Pattern 5: Bullets in the middle of text (for normalized text without line breaks)
  const bulletPattern5 = /\s[•\-\*]\s+([A-Z][^•\-\*]{20,}?)(?=\s[•\-\*]|\s[A-Z][a-z]+\s|$)/g;
  // Pattern 6: Dash followed by capital letter (common in PDFs where formatting is lost)
  const bulletPattern6 = /\s[-–—]\s+([A-Z][A-Za-z\s]{20,}?)(?=\s[-–—]|\s[A-Z][a-z]+\s|$)/g;
  // Pattern 7: Lines that start with action verbs after newline (likely bullet points)
  const actionVerbPattern = new RegExp(`(?:^|\\n)\\s*(${ACTION_VERBS.join('|')})\\s+[A-Z][^\\n]{20,}`, 'gi');
  const bulletPattern7 = actionVerbPattern;
  
  const bullets1 = text.match(bulletPattern1) || [];
  const bullets2 = text.match(bulletPattern2) || [];
  const bullets3 = text.match(bulletPattern3) || [];
  const bullets4 = text.match(bulletPattern4) || [];
  const bullets5 = text.match(bulletPattern5) || [];
  const bullets6 = text.match(bulletPattern6) || [];
  const bullets7 = text.match(bulletPattern7) || [];
  
  // Combine all matches
  const allBulletMatches = [...bullets1, ...bullets2, ...bullets3, ...bullets4, ...bullets5, ...bullets6, ...bullets7];
  
  // Deduplicate by content similarity (same or very similar text)
  const uniqueBullets: string[] = [];
  const seenContent = new Set<string>();
  
  for (const bullet of allBulletMatches) {
    // Extract the content part - try multiple patterns
    let content = '';
    const match1 = bullet.match(/[•\-\*\d+\.\)]\s+(.+)/);
    const match2 = bullet.match(/[-–—]\s+(.+)/);
    const match3 = bullet.match(/([A-Z][A-Za-z\s]{15,})/); // Action verb pattern match
    const match4 = bullet.match(/(.+)/); // Fallback
    
    if (match1) content = match1[1].trim();
    else if (match2) content = match2[1].trim();
    else if (match3) content = match3[1].trim();
    else if (match4) content = match4[1].trim();
    
    if (content.length > 10) {
      const normalizedContent = content.substring(0, 50).toLowerCase().replace(/\s+/g, ' ');
      // Check if we've seen similar content (first 30 chars)
      const contentKey = normalizedContent.substring(0, 30);
      if (!seenContent.has(contentKey)) {
        seenContent.add(contentKey);
        uniqueBullets.push(bullet);
      }
    }
  }
  
  const bulletCount = uniqueBullets.length;

  // Extract bullet content from unique bullets
  const bulletContents = uniqueBullets.map(bullet => {
    // Try different patterns to extract content
    const match1 = bullet.match(/[•\-\*\u2022\u2023\u25E6\u2043\u2219][\s]+(.+)/);
    const match2 = bullet.match(/\d+[\.\)][\s]+(.+)/);
    const match3 = bullet.match(/[-–—][\s]+(.+)/);
    const match4 = bullet.match(/^[\s]*[•\-\*][\s]+(.+)$/);
    
    const content = (match1?.[1] || match2?.[1] || match3?.[1] || match4?.[1] || bullet).trim();
    return content.length > 5 ? content : ''; // Filter out very short matches
  }).filter(content => content.length > 0);

  // Calculate average bullet length
  const totalBulletLength = bulletContents.reduce((sum, bullet) => sum + bullet.length, 0);
  const averageBulletLength = bulletCount > 0 ? Math.round(totalBulletLength / bulletCount) : 0;

  // Check for action verbs
  const normalizedText = text.toLowerCase();
  const foundActionVerbs: string[] = [];
  let actionVerbCount = 0;

  for (const verb of ACTION_VERBS) {
    const regex = new RegExp(`\\b${verb}\\b`, 'gi');
    const matches = normalizedText.match(regex);
    if (matches) {
      actionVerbCount += matches.length;
      if (!foundActionVerbs.includes(verb)) {
        foundActionVerbs.push(verb);
      }
    }
  }

  const usesActionVerbs = actionVerbCount > 0;

  // Check for quantified results (numbers, percentages, etc.)
  const quantifiedPattern = /(\d+%|\d+\s*(?:years?|months?|days?)|increased|decreased|reduced|improved|by\s+\d+)/gi;
  const quantifiedMatches = text.match(quantifiedPattern) || [];
  const hasQuantifiedResults = quantifiedMatches.length > 0;
  const quantifiedCount = quantifiedMatches.length;

  // Generate issues
  if (bulletCount === 0) {
    issues.push('No bullet points found. Use bullet points to highlight achievements and responsibilities.');
  } else if (bulletCount < 5) {
    issues.push('Very few bullet points. Add more bullet points to detail your experience and achievements.');
  }

  if (!usesActionVerbs) {
    issues.push('No action verbs detected. Start bullet points with strong action verbs (e.g., "Developed", "Implemented", "Improved").');
  } else if (actionVerbCount < 3) {
    issues.push('Few action verbs detected. Use more action verbs to make your achievements stand out.');
  }

  if (!hasQuantifiedResults) {
    issues.push('No quantified results found. Add numbers, percentages, or metrics to demonstrate impact (e.g., "Increased sales by 30%").');
  } else if (quantifiedCount < 2) {
    issues.push('Few quantified results. Add more metrics and numbers to quantify your achievements.');
  }

  if (averageBulletLength > 100) {
    issues.push('Bullet points are too long. Keep bullet points concise (ideally 1-2 lines).');
  } else if (averageBulletLength < 20) {
    issues.push('Bullet points are too short. Provide more detail about your achievements and responsibilities.');
  }

  return {
    bulletCount,
    averageBulletLength,
    usesActionVerbs,
    actionVerbCount,
    actionVerbs: foundActionVerbs.slice(0, 10),
    hasQuantifiedResults,
    quantifiedCount,
    issues,
  };
}

/**
 * Analyze resume length
 */
function analyzeLength(text: string): ATSAnalysis['length'] {
  const wordCount = countWords(text);
  const characterCount = text.replace(/\s/g, '').length;
  
  // Estimate pages (assuming ~250 words per page for resume format)
  const estimatedPages = wordCount / 250;
  
  const issues: string[] = [];
  let isOptimal = true;

  // Check length based on word count
  if (wordCount < 200) {
    isOptimal = false;
    issues.push('Resume is too short (less than 1 page). Add more content to showcase your experience.');
  } else if (wordCount > 1000) {
    isOptimal = false;
    issues.push('Resume is too long (more than 2 pages). For most positions, keep resume to 1-2 pages.');
  } else if (wordCount > 800) {
    issues.push('Resume is approaching 2 pages. Consider condensing content if possible.');
  }

  // Check character count
  if (characterCount < 1000) {
    isOptimal = false;
    issues.push('Resume has very little content. Expand your experience and achievements.');
  }

  return {
    wordCount,
    characterCount,
    estimatedPages: Math.round(estimatedPages * 10) / 10,
    isOptimal,
    issues,
  };
}

/**
 * Analyze achievements
 */
function analyzeAchievements(text: string): ATSAnalysis['achievements'] {
  const issues: string[] = [];
  const normalizedText = text.toLowerCase();

  // Check for action verbs (indicator of achievement-oriented content)
  let actionVerbCount = 0;
  for (const verb of ACTION_VERBS) {
    const regex = new RegExp(`\\b${verb}\\b`, 'gi');
    const matches = normalizedText.match(regex);
    if (matches) {
      actionVerbCount += matches.length;
    }
  }
  const usesActionVerbs = actionVerbCount > 0;

  // Check for quantified results
  const quantifiedPattern = /(\d+%|\d+\s*(?:years?|months?|days?)|increased|decreased|reduced|improved|by\s+\d+|achieved|delivered)/gi;
  const quantifiedMatches = text.match(quantifiedPattern) || [];
  const hasQuantifiedResults = quantifiedMatches.length > 0;
  const achievementCount = quantifiedMatches.length;

  // Check for achievement indicators
  const achievementIndicators = [
    /achieved/gi,
    /delivered/gi,
    /improved/gi,
    /increased/gi,
    /reduced/gi,
    /optimized/gi,
    /successfully/gi,
    /award/gi,
    /recognition/gi,
  ];

  let achievementIndicatorCount = 0;
  for (const pattern of achievementIndicators) {
    const matches = text.match(pattern);
    if (matches) {
      achievementIndicatorCount += matches.length;
    }
  }

  const hasAchievements = achievementCount > 0 || achievementIndicatorCount > 0;

  // Generate issues
  if (!usesActionVerbs) {
    issues.push('Resume lacks action verbs. Use action verbs to describe achievements and responsibilities.');
  }

  if (!hasQuantifiedResults) {
    issues.push('No quantified achievements found. Add metrics, numbers, and percentages to demonstrate impact.');
  } else if (achievementCount < 2) {
    issues.push('Few quantified achievements. Add more metrics to quantify your accomplishments.');
  }

  if (!hasAchievements) {
    issues.push('Resume appears to focus on responsibilities rather than achievements. Reframe content to highlight accomplishments and results.');
  }

  return {
    hasAchievements,
    achievementCount,
    usesActionVerbs,
    hasQuantifiedResults,
    issues,
  };
}

/**
 * Calculate overall ATS score
 */
function calculateATSScore(
  keywords: ATSAnalysis['keywords'],
  bullets: ATSAnalysis['bullets'],
  length: ATSAnalysis['length'],
  achievements: ATSAnalysis['achievements']
): number {
  let score = 100;

  // Keyword scoring (40 points) - Increased weight for job matching
  if (keywords.uniqueKeywords < 5) {
    score -= 10;
  } else if (keywords.uniqueKeywords < 10) {
    score -= 5;
  }
  if (keywords.keywordDensity < 2) {
    score -= 8;
  } else if (keywords.keywordDensity < 5) {
    score -= 4;
  }
  
  // Job-specific matching (heavily weighted when job description provided)
  if (keywords.jobSpecificMatch) {
    const matchPct = keywords.jobSpecificMatch.matchPercentage;
    if (matchPct >= 80) {
      // Excellent match - no deduction, even bonus
      score = Math.min(100, score + 5);
    } else if (matchPct >= 60) {
      // Good match - small deduction
      score -= 5;
    } else if (matchPct >= 40) {
      // Moderate match - medium deduction
      score -= 15;
    } else if (matchPct >= 20) {
      // Poor match - large deduction
      score -= 25;
    } else {
      // Very poor match - critical deduction
      score -= 35;
    }
  } else {
    // No job description provided - small penalty for missing this feature
    score -= 3;
  }

  // Bullet point scoring (25 points)
  if (bullets.bulletCount === 0) {
    score -= 20;
  } else if (bullets.bulletCount < 5) {
    score -= 10;
  }
  if (!bullets.usesActionVerbs) {
    score -= 10;
  }
  if (!bullets.hasQuantifiedResults) {
    score -= 10;
  }

  // Length scoring (20 points)
  if (!length.isOptimal) {
    score -= 15;
  }

  // Achievement scoring (25 points)
  if (!achievements.hasAchievements) {
    score -= 15;
  }
  if (!achievements.hasQuantifiedResults) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate ATS suggestions
 */
function generateATSSuggestions(
  keywords: ATSAnalysis['keywords'],
  bullets: ATSAnalysis['bullets'],
  length: ATSAnalysis['length'],
  achievements: ATSAnalysis['achievements']
): string[] {
  const suggestions: string[] = [];

  if (keywords.uniqueKeywords < 5) {
    suggestions.push('Add more relevant technical keywords and skills to improve ATS matching.');
  }
  if (keywords.jobSpecificMatch && keywords.jobSpecificMatch.matchPercentage < 50) {
    suggestions.push(`Only ${keywords.jobSpecificMatch.matchPercentage}% of job keywords matched. Incorporate more keywords from the job description.`);
  }
  if (bullets.bulletCount < 5) {
    suggestions.push('Add more bullet points to detail your experience and achievements.');
  }
  if (!bullets.usesActionVerbs) {
    suggestions.push('Start bullet points with strong action verbs (e.g., "Developed", "Implemented", "Improved").');
  }
  if (!bullets.hasQuantifiedResults) {
    suggestions.push('Add quantified results with numbers, percentages, or metrics to demonstrate impact.');
  }
  if (!length.isOptimal) {
    if (length.wordCount < 200) {
      suggestions.push('Resume is too short. Expand your experience and achievements.');
    } else {
      suggestions.push('Resume is too long. Consider condensing to 1-2 pages for most positions.');
    }
  }
  if (!achievements.hasQuantifiedResults) {
    suggestions.push('Add metrics and numbers to quantify your achievements (e.g., "Increased sales by 30%", "Reduced costs by $50K").');
  }

  if (suggestions.length === 0) {
    suggestions.push('Great job! Your resume is well-optimized for ATS systems.');
  }

  return suggestions;
}
