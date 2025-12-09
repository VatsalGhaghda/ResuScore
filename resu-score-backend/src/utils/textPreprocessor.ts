/**
 * Text preprocessing utilities for resume analysis
 */

/**
 * Clean and normalize text content
 */
export function cleanText(text: string): string {
  if (!text) return '';

  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove leading/trailing whitespace
    .trim()
    // Remove special characters that might interfere with analysis
    .replace(/[^\w\s\-.,;:!?()\[\]{}@#$%&*+=/\\|<>]/g, '')
    // Normalize line breaks
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove multiple consecutive newlines
    .replace(/\n{3,}/g, '\n\n');
}

/**
 * Remove extra whitespace and normalize spacing
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

/**
 * Extract text sections based on common resume patterns
 */
export function extractSections(text: string): {
  [key: string]: string;
} {
  const sections: { [key: string]: string } = {};
  const normalizedText = text.toLowerCase();

  // Common section headers
  const sectionPatterns = {
    contact: /(?:contact|personal information|contact information|phone|email|address)/i,
    summary: /(?:summary|profile|objective|professional summary|career objective)/i,
    experience: /(?:experience|work experience|employment|professional experience|work history)/i,
    education: /(?:education|academic|qualifications|degrees)/i,
    skills: /(?:skills|technical skills|competencies|abilities)/i,
    certifications: /(?:certifications|certificates|licenses)/i,
    projects: /(?:projects|project experience)/i,
    languages: /(?:languages|language proficiency)/i,
    awards: /(?:awards|honors|achievements)/i,
  };

  const lines = text.split('\n');
  let currentSection = 'header';
  let currentContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      // Empty line might indicate section break
      if (currentContent.length > 0 && i < lines.length - 1) {
        currentContent.push('');
      }
      continue;
    }

    // Check if this line is a section header
    // More flexible: check if line is mostly uppercase, short, or matches pattern
    let foundSection = false;
    for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
      const isShortLine = line.length < 60;
      const isMostlyUppercase = line === line.toUpperCase() && line.length > 2 && line.length < 30;
      const matchesPattern = pattern.test(line);
      
      // More lenient matching: pattern match OR (short line AND mostly uppercase)
      if (matchesPattern && (isShortLine || isMostlyUppercase)) {
        // Save previous section
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        // Start new section
        currentSection = sectionName;
        currentContent = [];
        foundSection = true;
        break;
      }
    }

    if (!foundSection) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim();
  }
  
  // Fallback: If no explicit sections found, try to detect by content patterns
  if (Object.keys(sections).length <= 1 && sections.header) {
    const headerContent = sections.header.toLowerCase();
    
    // Look for experience indicators in the text
    if (!sections.experience && /(?:worked|employed|position|role|job|company|manager|developer|engineer|analyst)/i.test(headerContent)) {
      // Try to find experience-like content
      const experienceMatch = text.match(/(?:experience|work|employment)[\s\S]{0,2000}/i);
      if (experienceMatch) {
        sections.experience = experienceMatch[0];
      }
    }
    
    // Look for education indicators
    if (!sections.education && /(?:university|college|degree|bachelor|master|phd|education|graduated)/i.test(headerContent)) {
      const educationMatch = text.match(/(?:education|degree|university|college)[\s\S]{0,1000}/i);
      if (educationMatch) {
        sections.education = educationMatch[0];
      }
    }
    
    // Look for skills indicators
    if (!sections.skills && /(?:skill|technology|programming|language|tool|framework)/i.test(headerContent)) {
      const skillsMatch = text.match(/(?:skills?|technical|competenc)[\s\S]{0,500}/i);
      if (skillsMatch) {
        sections.skills = skillsMatch[0];
      }
    }
  }

  return sections;
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Count characters in text
 */
export function countCharacters(text: string): number {
  if (!text) return 0;
  return text.replace(/\s/g, '').length;
}

/**
 * Detect if text contains common resume elements
 */
export function detectResumeElements(text: string): {
  hasEmail: boolean;
  hasPhone: boolean;
  hasAddress: boolean;
  hasLinkedIn: boolean;
  hasGitHub: boolean;
  hasWebsite: boolean;
} {
  const normalizedText = text.toLowerCase();

  return {
    hasEmail: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text),
    hasPhone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text),
    hasAddress: /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)/i.test(text),
    hasLinkedIn: /linkedin\.com\/in\/[\w-]+/i.test(text),
    hasGitHub: /github\.com\/[\w-]+/i.test(text),
    hasWebsite: /(?:www\.)?[\w-]+\.[a-z]{2,}(?:\/[\w-]*)?/i.test(text),
  };
}

/**
 * Extract email addresses from text
 */
export function extractEmails(text: string): string[] {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  return text.match(emailRegex) || [];
}

/**
 * Extract phone numbers from text
 */
export function extractPhoneNumbers(text: string): string[] {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  return text.match(phoneRegex) || [];
}

/**
 * Extract URLs from text
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([\w-]+\.[a-z]{2,}(?:\/[\w-]*)?)/gi;
  return text.match(urlRegex) || [];
}

/**
 * Detect date patterns in text
 */
export function detectDateFormats(text: string): {
  hasDates: boolean;
  dateFormats: string[];
} {
  // Common date patterns
  const datePatterns = [
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi, // Jan 2020
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // 01/2020 or 01/15/2020
    /\b\d{4}-\d{2}-\d{2}\b/g, // 2020-01-15
    /\b\d{4}\s*-\s*\d{4}\b/g, // 2020 - 2023
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
  ];

  const foundFormats: string[] = [];
  let hasDates = false;

  for (const pattern of datePatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      hasDates = true;
      foundFormats.push(...matches);
    }
  }

  return {
    hasDates,
    dateFormats: [...new Set(foundFormats)], // Remove duplicates
  };
}

/**
 * Check if text appears to be a resume
 */
export function isResumeLike(text: string): boolean {
  const normalizedText = text.toLowerCase();
  
  const resumeIndicators = [
    /(?:resume|cv|curriculum vitae)/i,
    /(?:experience|work experience|employment)/i,
    /(?:education|degree|university|college)/i,
    /(?:skills|technical skills)/i,
    /(?:email|phone|contact)/i,
  ];

  let matchCount = 0;
  for (const pattern of resumeIndicators) {
    if (pattern.test(normalizedText)) {
      matchCount++;
    }
  }

  // If at least 3 indicators are present, it's likely a resume
  return matchCount >= 3;
}
