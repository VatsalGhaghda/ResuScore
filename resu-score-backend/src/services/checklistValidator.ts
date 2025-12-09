/**
 * Comprehensive ATS Checklist Validator
 * Validates all points from the ATS-Friendly Resume Checklist
 */

import { extractEmails, detectDateFormats } from '../utils/textPreprocessor';

export interface ChecklistValidation {
  fileFormat: {
    isValid: boolean;
    isTextBased: boolean;
    issues: string[];
  };
  structure: {
    isSingleColumn: boolean;
    hasTables: boolean;
    hasTextBoxes: boolean;
    issues: string[];
  };
  headings: {
    usesStandardHeadings: boolean;
    nonStandardHeadings: string[];
    issues: string[];
  };
  keywords: {
    hasKeywords: boolean;
    keywordDensity: number;
    keywordsInSkills: boolean;
    keywordsInExperience: boolean;
    issues: string[];
  };
  skills: {
    hasDedicatedSection: boolean;
    format: 'pipe' | 'bullet' | 'paragraph' | 'none';
    isProperFormat: boolean; // 1-2 words per skill
    issues: string[];
  };
  experience: {
    hasRequiredFields: boolean; // Title, Company, Dates
    format: 'standard' | 'non-standard';
    isReverseChronological: boolean;
    issues: string[];
  };
  education: {
    hasRequiredFields: boolean; // Degree, Institution, Date
    issues: string[];
  };
  contact: {
    hasName: boolean;
    hasPhone: boolean;
    hasEmail: boolean;
    hasProfessionalEmail: boolean;
    hasLinkedIn: boolean;
    isInPlainText: boolean; // Not only in headers/footers
    issues: string[];
  };
  dates: {
    isConsistent: boolean;
    hasVagueDates: boolean;
    format: string[];
    issues: string[];
  };
  formatting: {
    usesSimpleBullets: boolean; // No special characters
    hasSpecialCharacters: boolean;
    issues: string[];
  };
  length: {
    isOptimal: boolean;
    wordCount: number;
    estimatedPages: number;
    issues: string[];
  };
  achievements: {
    usesActionVerbs: boolean;
    hasQuantifiedResults: boolean;
    isAchievementOriented: boolean;
    issues: string[];
  };
  fileName: {
    isProfessional: boolean;
    issues: string[];
  };
  acronyms: {
    hasAcronyms: boolean;
    hasFullForms: boolean;
    issues: string[];
  };
  overallCompliance: number; // Percentage of checklist items met
  missingItems: string[];
}

/**
 * Validate resume against complete ATS checklist
 */
export function validateChecklist(
  text: string,
  fileName: string,
  sections: { [key: string]: string },
  formatAnalysis: any,
  contentAnalysis: any,
  atsAnalysis: any
): ChecklistValidation {
  const fileFormat = validateFileFormat(fileName, formatAnalysis);
  const structure = validateStructure(formatAnalysis);
  const headings = validateHeadings(contentAnalysis);
  const keywords = validateKeywords(atsAnalysis, sections);
  const skills = validateSkills(sections, contentAnalysis);
  const experience = validateExperience(sections, contentAnalysis);
  const education = validateEducation(sections, contentAnalysis);
  const contact = validateContact(text, sections, contentAnalysis, formatAnalysis);
  const dates = validateDates(text, contentAnalysis);
  const formatting = validateFormatting(text);
  const length = validateLength(atsAnalysis);
  const achievements = validateAchievements(atsAnalysis);
  const fileNameValidation = validateFileName(fileName);
  const acronyms = validateAcronyms(text);

  // Calculate overall compliance
  const validations = [
    fileFormat.isValid,
    structure.isSingleColumn && !structure.hasTables,
    headings.usesStandardHeadings,
    keywords.hasKeywords,
    skills.hasDedicatedSection && skills.isProperFormat,
    experience.hasRequiredFields,
    education.hasRequiredFields,
    contact.hasName && contact.hasPhone && contact.hasEmail && contact.hasProfessionalEmail,
    dates.isConsistent && !dates.hasVagueDates,
    formatting.usesSimpleBullets,
    length.isOptimal,
    achievements.usesActionVerbs && achievements.hasQuantifiedResults,
    fileNameValidation.isProfessional,
    acronyms.hasFullForms || !acronyms.hasAcronyms,
  ];

  const complianceCount = validations.filter(v => v).length;
  const overallCompliance = Math.round((complianceCount / validations.length) * 100);

  // Collect missing items
  const missingItems: string[] = [];
  if (!fileFormat.isValid) missingItems.push('Correct file format (.docx or text-based .pdf)');
  if (!structure.isSingleColumn) missingItems.push('Single-column layout');
  if (structure.hasTables) missingItems.push('No tables for experience/skills');
  if (!headings.usesStandardHeadings) missingItems.push('Standard section headings');
  if (!keywords.hasKeywords) missingItems.push('Keyword optimization');
  if (!skills.hasDedicatedSection) missingItems.push('Dedicated skills section');
  if (!skills.isProperFormat) missingItems.push('Skills in proper format (1-2 words per skill)');
  if (!experience.hasRequiredFields) missingItems.push('Experience entries with Title, Company, Dates');
  if (!education.hasRequiredFields) missingItems.push('Education with Degree, Institution, Date');
  if (!contact.hasName) missingItems.push('Full name in contact');
  if (!contact.hasPhone) missingItems.push('Phone number');
  if (!contact.hasEmail) missingItems.push('Email address');
  if (!contact.hasProfessionalEmail) missingItems.push('Professional email address');
  if (!dates.isConsistent) missingItems.push('Consistent date format');
  if (dates.hasVagueDates) missingItems.push('No vague dates (use specific month/year)');
  if (!formatting.usesSimpleBullets) missingItems.push('Simple bullet points (no special characters)');
  if (!length.isOptimal) missingItems.push('Optimal length (1-2 pages)');
  if (!achievements.usesActionVerbs) missingItems.push('Action verbs in bullet points');
  if (!achievements.hasQuantifiedResults) missingItems.push('Quantified achievements');
  if (!fileNameValidation.isProfessional) missingItems.push('Professional file name');
  if (acronyms.hasAcronyms && !acronyms.hasFullForms) missingItems.push('Acronyms with full forms');

  return {
    fileFormat,
    structure,
    headings,
    keywords,
    skills,
    experience,
    education,
    contact,
    dates,
    formatting,
    length,
    achievements,
    fileName: fileNameValidation,
    acronyms,
    overallCompliance,
    missingItems,
  };
}

function validateFileFormat(fileName: string, formatAnalysis: any): ChecklistValidation['fileFormat'] {
  const issues: string[] = [];
  const ext = fileName.toLowerCase().split('.').pop();
  const isValid = ext === 'pdf' || ext === 'docx';
  const isTextBased = !formatAnalysis.images.hasImages;

  if (!isValid) {
    issues.push('File must be .docx or .pdf format');
  }
  if (!isTextBased) {
    issues.push('File appears to be image-based. Use text-based PDF or DOCX.');
  }

  return { isValid, isTextBased, issues };
}

function validateStructure(formatAnalysis: any): ChecklistValidation['structure'] {
  return {
    isSingleColumn: formatAnalysis.layout.isSingleColumn,
    hasTables: formatAnalysis.tables.hasTables,
    hasTextBoxes: false, // Cannot detect from text, but tables often indicate text boxes
    issues: [
      ...(formatAnalysis.layout.hasMultiColumn ? ['Multi-column layout detected'] : []),
      ...(formatAnalysis.tables.hasTables ? ['Tables detected - use plain text format'] : []),
    ],
  };
}

function validateHeadings(contentAnalysis: any): ChecklistValidation['headings'] {
  return {
    usesStandardHeadings: contentAnalysis.sections.nonStandardHeadings.length === 0,
    nonStandardHeadings: contentAnalysis.sections.nonStandardHeadings,
    issues: contentAnalysis.sections.issues.filter((issue: string) => issue.includes('heading')),
  };
}

function validateKeywords(atsAnalysis: any, sections: { [key: string]: string }): ChecklistValidation['keywords'] {
  const issues: string[] = [];
  const hasKeywords = atsAnalysis.keywords.uniqueKeywords >= 5;
  const keywordsInSkills = sections.skills ? atsAnalysis.keywords.uniqueKeywords > 0 : false;
  const keywordsInExperience = sections.experience ? atsAnalysis.keywords.uniqueKeywords > 0 : false;

  if (!hasKeywords) {
    issues.push('Include more relevant keywords in your resume');
  }
  if (!keywordsInSkills) {
    issues.push('Include keywords in your Skills section');
  }
  if (!keywordsInExperience) {
    issues.push('Include keywords in your Work Experience section');
  }

  return {
    hasKeywords,
    keywordDensity: atsAnalysis.keywords.keywordDensity,
    keywordsInSkills,
    keywordsInExperience,
    issues,
  };
}

function validateSkills(sections: { [key: string]: string }, contentAnalysis: any): ChecklistValidation['skills'] {
  const issues: string[] = [];
  const hasDedicatedSection = !!sections.skills && contentAnalysis.skills.hasSkillsSection;
  
  let format: 'pipe' | 'bullet' | 'paragraph' | 'none' = 'none';
  let isProperFormat = false;

  if (hasDedicatedSection && sections.skills) {
    const skillsText = sections.skills;
    const hasPipes = /\|/.test(skillsText);
    const hasBullets = /[•\-\*]/.test(skillsText);
    
    if (hasPipes) {
      format = 'pipe';
      // Check if skills are 1-2 words (pipe-separated)
      const skills = skillsText.split('|').map(s => s.trim());
      isProperFormat = skills.every(skill => {
        const words = skill.split(/\s+/).filter(w => w.length > 0);
        return words.length >= 1 && words.length <= 2;
      });
    } else if (hasBullets) {
      format = 'bullet';
      // Check if skills are 1-2 words (bullet-separated)
      const skills = skillsText.split(/[•\-\*]/).map(s => s.trim()).filter(s => s.length > 0);
      isProperFormat = skills.every(skill => {
        const words = skill.split(/\s+/).filter(w => w.length > 0);
        return words.length >= 1 && words.length <= 2;
      });
    } else {
      format = 'paragraph';
      isProperFormat = false;
    }

    if (!isProperFormat && (format === 'pipe' || format === 'bullet')) {
      issues.push('Skills should be 1-2 words each. Use format: "Python | Java | SQL" or bulleted list');
    }
    if (format === 'paragraph') {
      issues.push('Skills should be in pipe-separated or bulleted format, not paragraph');
    }
  } else {
    issues.push('Dedicated Skills section required');
  }

  return {
    hasDedicatedSection,
    format,
    isProperFormat,
    issues,
  };
}

function validateExperience(sections: { [key: string]: string }, contentAnalysis: any): ChecklistValidation['experience'] {
  const issues: string[] = [];
  const hasRequiredFields = contentAnalysis.experience.entryCount > 0 &&
    contentAnalysis.experience.entries.some((entry: any) => 
      entry.title && entry.company && entry.dates
    );

  // Check format (Title | Company | Dates)
  let format: 'standard' | 'non-standard' = 'non-standard';
  if (sections.experience) {
    const hasStandardFormat = /[|\-–]/.test(sections.experience);
    format = hasStandardFormat ? 'standard' : 'non-standard';
  }

  // Check reverse chronological order (most recent first)
  let isReverseChronological = true;
  if (contentAnalysis.experience.entries.length > 1) {
    const dates = contentAnalysis.experience.entries
      .map((e: any) => e.dates)
      .filter((d: string) => d)
      .map((d: string) => {
        const yearMatch = d.match(/\d{4}/);
        return yearMatch ? parseInt(yearMatch[0]) : 0;
      });
    
    if (dates.length > 1) {
      isReverseChronological = dates.every((year: number, i: number) => 
        i === 0 || year <= dates[i - 1]
      );
    }
  }

  if (!hasRequiredFields) {
    issues.push('Each experience entry must have: Job Title, Company Name, and Dates');
  }
  if (format === 'non-standard') {
    issues.push('Use standard format: "Job Title | Company Name | Dates"');
  }
  if (!isReverseChronological) {
    issues.push('List work experience in reverse chronological order (most recent first)');
  }

  return {
    hasRequiredFields,
    format,
    isReverseChronological,
    issues,
  };
}

function validateEducation(sections: { [key: string]: string }, contentAnalysis: any): ChecklistValidation['education'] {
  const issues: string[] = [];
  const hasRequiredFields = contentAnalysis.education.entryCount > 0 &&
    contentAnalysis.education.entries.some((entry: any) => 
      entry.degree && entry.institution && entry.dates
    );

  if (!hasRequiredFields) {
    issues.push('Education entries must include: Degree, Institution Name, and Graduation Date');
  }

  return {
    hasRequiredFields,
    issues,
  };
}

function validateContact(
  text: string,
  sections: { [key: string]: string },
  contentAnalysis: any,
  formatAnalysis: any
): ChecklistValidation['contact'] {
  const issues: string[] = [];
  const emails = extractEmails(text);
  const hasEmail = emails.length > 0;
  const hasPhone = contentAnalysis.contact.hasPhone;
  const hasLinkedIn = contentAnalysis.contact.hasLinkedIn;

  // Check for name (usually at the start of resume)
  const firstLines = text.split('\n').slice(0, 5).join(' ');
  const namePattern = /^[A-Z][a-z]+\s+[A-Z][a-z]+/;
  const hasName = namePattern.test(firstLines);

  // Check for professional email
  const unprofessionalPatterns = /(cool|hot|sexy|fun|party|dude|guy|girl|123|456|789|qwerty|asdf)/i;
  const hasProfessionalEmail = hasEmail && !emails.some(email => unprofessionalPatterns.test(email));

  // Check if contact is in plain text (not only in headers/footers)
  const contactSection = sections.contact;
  const hasContactSection = !!(contactSection && typeof contactSection === 'string' && contactSection.length > 0);
  const isInPlainText = !formatAnalysis.headersFooters.hasHeader || hasContactSection;

  if (!hasName) {
    issues.push('Include your full name at the top of the resume');
  }
  if (!hasPhone) {
    issues.push('Include a phone number');
  }
  if (!hasEmail) {
    issues.push('Include an email address');
  }
  if (!hasProfessionalEmail) {
    issues.push('Use a professional email address (avoid unprofessional usernames)');
  }
  if (!isInPlainText) {
    issues.push('Ensure contact information is in the main body, not only in headers/footers');
  }

  return {
    hasName,
    hasPhone,
    hasEmail,
    hasProfessionalEmail,
    hasLinkedIn,
    isInPlainText,
    issues,
  };
}

function validateDates(text: string, contentAnalysis: any): ChecklistValidation['dates'] {
  const dateInfo = detectDateFormats(text);
  const vaguePattern = /(spring|summer|fall|winter|early|late)\s+\d{4}/i;
  const hasVagueDates = vaguePattern.test(text);
  const isConsistent = dateInfo.dateFormats.length <= 2;

  const issues: string[] = [];
  if (!isConsistent) {
    issues.push('Use consistent date format throughout (e.g., "Jan 2020 - Dec 2022")');
  }
  if (hasVagueDates) {
    issues.push('Avoid vague dates like "Spring 2020". Use specific month/year format.');
  }

  return {
    isConsistent,
    hasVagueDates,
    format: dateInfo.dateFormats,
    issues,
  };
}

function validateFormatting(text: string): ChecklistValidation['formatting'] {
  const specialCharPattern = /[✔➤★☆♥♦♣♠]/;
  const hasSpecialCharacters = specialCharPattern.test(text);
  const simpleBulletPattern = /[•\-\*]/;
  const usesSimpleBullets = simpleBulletPattern.test(text) && !hasSpecialCharacters;

  const issues: string[] = [];
  if (hasSpecialCharacters) {
    issues.push('Avoid special characters in bullet points. Use simple dots (•) or dashes (-).');
  }
  if (!usesSimpleBullets && text.includes('\n-') || text.includes('\n•')) {
    issues.push('Use consistent simple bullet points (• or -)');
  }

  return {
    usesSimpleBullets,
    hasSpecialCharacters,
    issues,
  };
}

function validateLength(atsAnalysis: any): ChecklistValidation['length'] {
  const issues: string[] = [];
  const isOptimal = atsAnalysis.length.isOptimal;

  if (!isOptimal) {
    issues.push(...atsAnalysis.length.issues);
  }

  return {
    isOptimal,
    wordCount: atsAnalysis.length.wordCount,
    estimatedPages: atsAnalysis.length.estimatedPages,
    issues,
  };
}

function validateAchievements(atsAnalysis: any): ChecklistValidation['achievements'] {
  return {
    usesActionVerbs: atsAnalysis.achievements.usesActionVerbs,
    hasQuantifiedResults: atsAnalysis.achievements.hasQuantifiedResults,
    isAchievementOriented: atsAnalysis.achievements.hasAchievements,
    issues: atsAnalysis.achievements.issues,
  };
}

function validateFileName(fileName: string): ChecklistValidation['fileName'] {
  const issues: string[] = [];
  const unprofessionalPatterns = /(final|updated|new|old|copy|draft|test|temp|resume\d+|v\d+)/i;
  const isProfessional = !unprofessionalPatterns.test(fileName) && 
    fileName.length < 100 &&
    /^[A-Za-z0-9_\-\.]+$/.test(fileName);

  if (!isProfessional) {
    issues.push('Use professional file name format: "FirstName_LastName_Resume.pdf"');
    issues.push('Avoid words like "final", "updated", "v3" in file name');
  }

  return {
    isProfessional,
    issues,
  };
}

function validateAcronyms(text: string): ChecklistValidation['acronyms'] {
  // Common acronyms that should have full forms
  const commonAcronyms = [
    /\bSEO\b/i, /\bAPI\b/i, /\bUI\b/i, /\bUX\b/i, /\bML\b/i, /\bAI\b/i,
    /\bAWS\b/i, /\bSaaS\b/i, /\bPaaS\b/i, /\bIaaS\b/i, /\bCI\/CD\b/i,
    /\bREST\b/i, /\bSOAP\b/i, /\bJSON\b/i, /\bXML\b/i, /\bHTML\b/i,
    /\bCSS\b/i, /\bJS\b/i, /\bSQL\b/i, /\bNoSQL\b/i,
  ];

  let hasAcronyms = false;
  let hasFullForms = false;

  for (const pattern of commonAcronyms) {
    if (pattern.test(text)) {
      hasAcronyms = true;
      // Check if full form appears nearby (within 50 characters)
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const index = text.indexOf(match);
          const context = text.substring(Math.max(0, index - 50), Math.min(text.length, index + 50));
          // Check for common full forms
          const fullFormPatterns: { [key: string]: RegExp } = {
            'SEO': /search\s+engine\s+optimization/i,
            'API': /application\s+programming\s+interface/i,
            'UI': /user\s+interface/i,
            'UX': /user\s+experience/i,
            'ML': /machine\s+learning/i,
            'AI': /artificial\s+intelligence/i,
            'AWS': /amazon\s+web\s+services/i,
            'REST': /representational\s+state\s+transfer/i,
          };
          
          const acronym = match.toUpperCase();
          if (fullFormPatterns[acronym] && fullFormPatterns[acronym].test(context)) {
            hasFullForms = true;
            break;
          }
        }
      }
    }
  }

  const issues: string[] = [];
  if (hasAcronyms && !hasFullForms) {
    issues.push('Include full forms for acronyms (e.g., "Search Engine Optimization (SEO)")');
  }

  return {
    hasAcronyms,
    hasFullForms,
    issues,
  };
}
