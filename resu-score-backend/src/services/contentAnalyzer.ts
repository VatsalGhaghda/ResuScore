/**
 * Content Analysis Engine
 * Analyzes resume content structure and sections
 */

import {
  extractSections,
  detectResumeElements,
  extractEmails,
  extractPhoneNumbers,
  extractUrls,
  detectDateFormats,
  countWords,
} from '../utils/textPreprocessor';

export interface ContentAnalysis {
  sections: {
    hasContact: boolean;
    hasSummary: boolean;
    hasExperience: boolean;
    hasEducation: boolean;
    hasSkills: boolean;
    hasCertifications: boolean;
    hasProjects: boolean;
    sectionHeadings: string[];
    standardHeadings: string[];
    nonStandardHeadings: string[];
    issues: string[];
  };
  contact: {
    hasEmail: boolean;
    hasPhone: boolean;
    hasLinkedIn: boolean;
    hasGitHub: boolean;
    hasWebsite: boolean;
    emails: string[];
    phones: string[];
    urls: string[];
    issues: string[];
  };
  skills: {
    hasSkillsSection: boolean;
    skillsFound: string[];
    skillCount: number;
    format: 'list' | 'paragraph' | 'mixed' | 'none';
    issues: string[];
  };
  experience: {
    hasExperienceSection: boolean;
    entries: ExperienceEntry[];
    entryCount: number;
    hasDates: boolean;
    dateFormatConsistent: boolean;
    issues: string[];
  };
  education: {
    hasEducationSection: boolean;
    entries: EducationEntry[];
    entryCount: number;
    hasDates: boolean;
    issues: string[];
  };
  dates: {
    hasDates: boolean;
    dateFormats: string[];
    isConsistent: boolean;
    issues: string[];
  };
  overallContentScore: number;
  suggestions: string[];
}

export interface ExperienceEntry {
  title?: string;
  company?: string;
  dates?: string;
  description?: string;
}

export interface EducationEntry {
  degree?: string;
  institution?: string;
  dates?: string;
  details?: string;
}

/**
 * Analyze resume content
 */
export function analyzeContent(text: string): ContentAnalysis {
  const sections = analyzeSections(text);
  const contact = analyzeContact(text);
  const skills = analyzeSkills(text, sections.extractedSections);
  const experience = analyzeExperience(text, sections.extractedSections);
  const education = analyzeEducation(text, sections.extractedSections);
  const dates = analyzeDates(text);

  // Calculate overall content score
  const overallContentScore = calculateContentScore(sections, contact, skills, experience, education, dates);

  // Generate suggestions
  const suggestions = generateContentSuggestions(sections, contact, skills, experience, education, dates);

  const { extractedSections, ...sectionsWithoutExtracted } = sections;

  return {
    sections: sectionsWithoutExtracted,
    contact,
    skills,
    experience,
    education,
    dates,
    overallContentScore,
    suggestions,
  };
}

/**
 * Analyze section headings
 */
function analyzeSections(text: string): {
  hasContact: boolean;
  hasSummary: boolean;
  hasExperience: boolean;
  hasEducation: boolean;
  hasSkills: boolean;
  hasCertifications: boolean;
  hasProjects: boolean;
  sectionHeadings: string[];
  standardHeadings: string[];
  nonStandardHeadings: string[];
  issues: string[];
  extractedSections: { [key: string]: string };
} {
  const extractedSections = extractSections(text);
  const issues: string[] = [];
  const standardHeadings: string[] = [];
  const nonStandardHeadings: string[] = [];

  // Standard section headings
  const standardPatterns = {
    contact: /^(contact|personal information|contact information)$/i,
    summary: /^(summary|profile|objective|professional summary|career objective)$/i,
    experience: /^(experience|work experience|employment|professional experience|work history)$/i,
    education: /^(education|academic|qualifications|degrees)$/i,
    skills: /^(skills|technical skills|competencies|abilities)$/i,
    certifications: /^(certifications|certificates|licenses)$/i,
    projects: /^(projects|project experience)$/i,
  };

  // Check for standard sections
  const hasContact = !!extractedSections.contact || Object.keys(extractedSections).some(key => standardPatterns.contact.test(key));
  const hasSummary = !!extractedSections.summary || Object.keys(extractedSections).some(key => standardPatterns.summary.test(key));
  const hasExperience = !!extractedSections.experience || Object.keys(extractedSections).some(key => standardPatterns.experience.test(key));
  const hasEducation = !!extractedSections.education || Object.keys(extractedSections).some(key => standardPatterns.education.test(key));
  const hasSkills = !!extractedSections.skills || Object.keys(extractedSections).some(key => standardPatterns.skills.test(key));
  const hasCertifications = !!extractedSections.certifications || Object.keys(extractedSections).some(key => standardPatterns.certifications.test(key));
  const hasProjects = !!extractedSections.projects || Object.keys(extractedSections).some(key => standardPatterns.projects.test(key));

  // Identify standard vs non-standard headings
  for (const [sectionName, content] of Object.entries(extractedSections)) {
    let isStandard = false;
    for (const pattern of Object.values(standardPatterns)) {
      if (pattern.test(sectionName)) {
        isStandard = true;
        standardHeadings.push(sectionName);
        break;
      }
    }
    if (!isStandard && sectionName !== 'header') {
      nonStandardHeadings.push(sectionName);
    }
  }

  // Generate issues
  if (!hasContact) {
    issues.push('Contact information section not found. Use standard heading: "Contact" or "Contact Information"');
  }
  if (!hasExperience) {
    issues.push('Work experience section not found. Use standard heading: "Work Experience" or "Experience"');
  }
  if (!hasEducation) {
    issues.push('Education section not found. Use standard heading: "Education"');
  }
  if (!hasSkills) {
    issues.push('Skills section not found. Use standard heading: "Skills" or "Technical Skills"');
  }
  if (nonStandardHeadings.length > 0) {
    issues.push(`Non-standard section headings detected: ${nonStandardHeadings.join(', ')}. ATS may not recognize these sections.`);
  }

  return {
    hasContact,
    hasSummary,
    hasExperience,
    hasEducation,
    hasSkills,
    hasCertifications,
    hasProjects,
    sectionHeadings: Object.keys(extractedSections),
    standardHeadings,
    nonStandardHeadings,
    issues,
    extractedSections,
  };
}

/**
 * Analyze contact information
 */
function analyzeContact(text: string): ContentAnalysis['contact'] {
  const elements = detectResumeElements(text);
  const emails = extractEmails(text);
  const phones = extractPhoneNumbers(text);
  const urls = extractUrls(text);
  const issues: string[] = [];

  // Filter URLs for LinkedIn, GitHub, etc.
  const linkedInUrls = urls.filter(url => /linkedin\.com/i.test(url));
  const githubUrls = urls.filter(url => /github\.com/i.test(url));
  const websiteUrls = urls.filter(url => !/linkedin\.com|github\.com/i.test(url));

  if (!elements.hasEmail && emails.length === 0) {
    issues.push('Email address not found. Include a professional email address.');
  }
  if (!elements.hasPhone && phones.length === 0) {
    issues.push('Phone number not found. Include a contact phone number.');
  }
  if (emails.length > 0) {
    // Check for unprofessional emails
    const unprofessionalPatterns = /(cool|hot|sexy|fun|party|dude|guy|girl)/i;
    const unprofessionalEmails = emails.filter(email => unprofessionalPatterns.test(email));
    if (unprofessionalEmails.length > 0) {
      issues.push('Unprofessional email address detected. Use a professional email format.');
    }
  }

  return {
    hasEmail: elements.hasEmail || emails.length > 0,
    hasPhone: elements.hasPhone || phones.length > 0,
    hasLinkedIn: elements.hasLinkedIn || linkedInUrls.length > 0,
    hasGitHub: elements.hasGitHub || githubUrls.length > 0,
    hasWebsite: elements.hasWebsite || websiteUrls.length > 0,
    emails,
    phones,
    urls: [...linkedInUrls, ...githubUrls, ...websiteUrls],
    issues,
  };
}

/**
 * Analyze skills section
 */
function analyzeSkills(text: string, extractedSections: { [key: string]: string }): ContentAnalysis['skills'] {
  const issues: string[] = [];
  let skillsFound: string[] = [];
  let format: 'list' | 'paragraph' | 'mixed' | 'none' = 'none';
  let hasSkillsSection = !!extractedSections.skills;
  let skillsText = extractedSections.skills || '';

  // Fallback: If no explicit section found, search entire text for skills patterns
  if (!hasSkillsSection) {
    // Look for common skills indicators
    const skillsPatterns = [
      /(?:skills?|technical\s+skills?|competenc|abilities?|proficienc)[\s\S]{0,1000}/i,
    ];
    
    for (const pattern of skillsPatterns) {
      const match = text.match(pattern);
      if (match && match[0].length > 30) {
        skillsText = match[0];
        hasSkillsSection = true;
        break;
      }
    }
    
    // If still not found, check if text contains common technical terms
    if (!hasSkillsSection) {
      const commonTechTerms = /(?:javascript|python|java|react|node|sql|html|css|aws|docker|git|mongodb|typescript|angular|vue)/i;
      if (commonTechTerms.test(text)) {
        // Likely has skills content scattered in text
        // Extract a portion that might contain skills
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (commonTechTerms.test(lines[i]) && lines[i].length < 200) {
            skillsText = lines.slice(Math.max(0, i - 2), i + 5).join('\n');
            hasSkillsSection = true;
            break;
          }
        }
      }
    }
  }

  if (hasSkillsSection) {
    const normalizedSkillsText = skillsText.toLowerCase();
    
    // Detect format
    const hasBullets = /[•\-\*]/.test(skillsText);
    const hasPipes = /\|/.test(skillsText);
    const hasCommas = /,/.test(skillsText);
    const hasNewlines = /\n/.test(skillsText);

    if (hasBullets || (hasNewlines && !hasCommas)) {
      format = 'list';
    } else if (hasPipes || hasCommas) {
      format = 'list';
    } else if (hasNewlines && hasCommas) {
      format = 'mixed';
    } else {
      format = 'paragraph';
    }

    // Extract skills (common technical skills)
    const commonSkills = [
      'javascript', 'python', 'java', 'react', 'node', 'sql', 'html', 'css',
      'aws', 'docker', 'kubernetes', 'git', 'mongodb', 'postgresql',
      'typescript', 'angular', 'vue', 'express', 'django', 'flask',
      'machine learning', 'ai', 'data science', 'agile', 'scrum'
    ];

    for (const skill of commonSkills) {
      if (normalizedSkillsText.includes(skill)) {
        skillsFound.push(skill);
      }
    }

    // Extract skills from text (words that might be skills)
    const words = skillsText.split(/\s+/).filter(word => {
      const w = word.toLowerCase().replace(/[^a-z]/g, '');
      return w.length > 2 && w.length < 20 && /^[a-z]+$/.test(w);
    });

    // Add unique words that might be skills
    skillsFound = [...new Set([...skillsFound, ...words.slice(0, 20)])];

    if (format === 'paragraph') {
      issues.push('Skills are in paragraph format. Use a bulleted list or pipe-separated format for better ATS parsing.');
    }
    if (skillsFound.length < 5) {
      issues.push('Very few skills detected. Ensure you list specific technical skills.');
    }
  } else {
    issues.push('Skills section not found. Include a dedicated skills section with technical skills.');
  }

  return {
    hasSkillsSection,
    skillsFound: skillsFound.slice(0, 30), // Limit to 30 skills
    skillCount: skillsFound.length,
    format,
    issues,
  };
}

/**
 * Analyze experience section
 */
function analyzeExperience(text: string, extractedSections: { [key: string]: string }): ContentAnalysis['experience'] {
  const issues: string[] = [];
  const entries: ExperienceEntry[] = [];
  let hasExperienceSection = !!extractedSections.experience;
  let experienceText = extractedSections.experience || '';

  // Fallback: If no explicit section found, search entire text for experience patterns
  if (!hasExperienceSection) {
    // Look for common experience indicators
    const experiencePatterns = [
      /(?:work\s+experience|professional\s+experience|employment|work\s+history)[\s\S]{0,3000}/i,
      /(?:position|role|job|worked|employed)[\s\S]{0,2000}/i,
    ];
    
    for (const pattern of experiencePatterns) {
      const match = text.match(pattern);
      if (match && match[0].length > 100) { // Ensure we got substantial content
        experienceText = match[0];
        hasExperienceSection = true;
        break;
      }
    }
    
    // If still not found, check if text contains job-like patterns
    if (!hasExperienceSection) {
      const jobIndicators = /(?:manager|developer|engineer|analyst|specialist|coordinator|director|lead|senior|junior|associate)/i;
      const datePattern = /(?:20\d{2}|19\d{2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;
      
      if (jobIndicators.test(text) && datePattern.test(text)) {
        // Likely has experience content, use a portion of text
        const lines = text.split('\n');
        let startIdx = -1;
        for (let i = 0; i < lines.length; i++) {
          if (jobIndicators.test(lines[i]) || datePattern.test(lines[i])) {
            startIdx = i;
            break;
          }
        }
        if (startIdx >= 0) {
          experienceText = lines.slice(startIdx, startIdx + 30).join('\n');
          hasExperienceSection = true;
        }
      }
    }
  }

  if (hasExperienceSection) {
    const lines = experienceText.split('\n').filter(line => line.trim().length > 0);

    // Try to parse experience entries
    // Look for patterns like: "Job Title | Company | Dates" or "Job Title, Company, Dates"
    let currentEntry: ExperienceEntry = {};
    
    for (const line of lines) {
      // Check if line looks like a job title/company line
      const titleCompanyPattern = /^(.+?)\s*[|\-–]\s*(.+?)(?:\s*[|\-–]\s*(.+))?$/;
      const match = line.match(titleCompanyPattern);
      
      if (match) {
        if (currentEntry.title) {
          entries.push(currentEntry);
        }
        currentEntry = {
          title: match[1].trim(),
          company: match[2].trim(),
          dates: match[3]?.trim(),
        };
      } else if (line.match(/^\d{4}/) || line.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i)) {
        // Date line
        if (!currentEntry.dates) {
          currentEntry.dates = line.trim();
        }
      } else if (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./)) {
        // Bullet point
        if (!currentEntry.description) {
          currentEntry.description = '';
        }
        currentEntry.description += line.trim() + '\n';
      } else if (line.length > 10 && !currentEntry.company) {
        // Might be company name
        currentEntry.company = line.trim();
      }
    }

    if (currentEntry.title) {
      entries.push(currentEntry);
    }

    // Check for dates
    const hasDates = entries.some(entry => entry.dates) || /(\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(experienceText);
    
    // Check date format consistency
    const dateFormats = detectDateFormats(experienceText);
    const dateFormatConsistent = dateFormats.dateFormats.length <= 2; // Allow 1-2 formats

    if (entries.length === 0) {
      issues.push('No work experience entries detected. Ensure experience is clearly formatted.');
    }
    if (!hasDates) {
      issues.push('Dates not found in experience section. Include employment dates for each position.');
    }
    if (!dateFormatConsistent) {
      issues.push('Inconsistent date formats detected. Use a consistent date format (e.g., "Jan 2020 - Dec 2022").');
    }
  } else {
    issues.push('Work experience section not found.');
  }

  return {
    hasExperienceSection,
    entries: entries.slice(0, 10), // Limit to 10 entries
    entryCount: entries.length,
    hasDates: hasExperienceSection ? /(\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(experienceText) : false,
    dateFormatConsistent: hasExperienceSection ? detectDateFormats(experienceText).dateFormats.length <= 2 : false,
    issues,
  };
}

/**
 * Analyze education section
 */
function analyzeEducation(text: string, extractedSections: { [key: string]: string }): ContentAnalysis['education'] {
  const issues: string[] = [];
  const entries: EducationEntry[] = [];
  let hasEducationSection = !!extractedSections.education;
  let educationText = extractedSections.education || '';

  // Fallback: If no explicit section found, search entire text for education patterns
  if (!hasEducationSection) {
    // Look for common education indicators
    const educationPatterns = [
      /(?:education|academic|qualifications|degrees?)[\s\S]{0,2000}/i,
      /(?:university|college|institute|school)[\s\S]{0,1500}/i,
    ];
    
    for (const pattern of educationPatterns) {
      const match = text.match(pattern);
      if (match && match[0].length > 50) { // Ensure we got substantial content
        educationText = match[0];
        hasEducationSection = true;
        break;
      }
    }
    
    // If still not found, check if text contains degree-like patterns
    if (!hasEducationSection) {
      const degreeIndicators = /(?:bachelor|master|phd|doctorate|associate|diploma|degree|b\.?s\.?|m\.?s\.?|m\.?a\.?|b\.?a\.?)/i;
      const institutionIndicators = /(?:university|college|institute|school)/i;
      
      if (degreeIndicators.test(text) || institutionIndicators.test(text)) {
        // Likely has education content, use a portion of text
        const lines = text.split('\n');
        let startIdx = -1;
        for (let i = 0; i < lines.length; i++) {
          if (degreeIndicators.test(lines[i]) || institutionIndicators.test(lines[i])) {
            startIdx = i;
            break;
          }
        }
        if (startIdx >= 0) {
          educationText = lines.slice(startIdx, startIdx + 15).join('\n');
          hasEducationSection = true;
        }
      }
    }
  }

  if (hasEducationSection) {
    const lines = educationText.split('\n').filter(line => line.trim().length > 0);

    // Try to parse education entries
    let currentEntry: EducationEntry = {};
    
    for (const line of lines) {
      // Check for degree patterns
      if (/bachelor|master|phd|doctorate|associate|diploma|degree/i.test(line)) {
        if (currentEntry.degree) {
          entries.push(currentEntry);
        }
        currentEntry = { degree: line.trim() };
      } else if (/university|college|institute|school/i.test(line) && !currentEntry.institution) {
        currentEntry.institution = line.trim();
      } else if (line.match(/^\d{4}/) || line.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i)) {
        currentEntry.dates = line.trim();
      } else if (line.length > 5 && !currentEntry.institution) {
        currentEntry.institution = line.trim();
      }
    }

    if (currentEntry.degree) {
      entries.push(currentEntry);
    }

    const hasDates = entries.some(entry => entry.dates) || /(\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(educationText);

    if (entries.length === 0) {
      issues.push('No education entries detected. Ensure education is clearly formatted.');
    }
    if (!hasDates) {
      issues.push('Graduation dates not found. Include graduation dates for each degree.');
    }
  } else {
    issues.push('Education section not found.');
  }

  return {
    hasEducationSection,
    entries: entries.slice(0, 5), // Limit to 5 entries
    entryCount: entries.length,
    hasDates: hasEducationSection ? /(\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(extractedSections.education || '') : false,
    issues,
  };
}

/**
 * Analyze date formats
 */
function analyzeDates(text: string): ContentAnalysis['dates'] {
  const dateInfo = detectDateFormats(text);
  const issues: string[] = [];

  if (!dateInfo.hasDates) {
    issues.push('No dates found in resume. Include dates for experience and education.');
  } else {
    if (dateInfo.dateFormats.length > 3) {
      issues.push('Multiple date formats detected. Use a consistent date format throughout the resume.');
    }
    // Check for vague dates
    const vaguePatterns = /(spring|summer|fall|winter|early|late)\s+\d{4}/i;
    if (vaguePatterns.test(text)) {
      issues.push('Vague date formats detected (e.g., "Spring 2020"). Use specific month/year format (e.g., "Jan 2020").');
    }
  }

  return {
    hasDates: dateInfo.hasDates,
    dateFormats: dateInfo.dateFormats,
    isConsistent: dateInfo.dateFormats.length <= 2,
    issues,
  };
}

/**
 * Calculate overall content score
 */
function calculateContentScore(
  sections: ReturnType<typeof analyzeSections>,
  contact: ContentAnalysis['contact'],
  skills: ContentAnalysis['skills'],
  experience: ContentAnalysis['experience'],
  education: ContentAnalysis['education'],
  dates: ContentAnalysis['dates']
): number {
  let score = 100;

  // Deduct for missing sections
  if (!sections.hasContact) score -= 10;
  if (!sections.hasExperience) score -= 20;
  if (!sections.hasEducation) score -= 15;
  if (!sections.hasSkills) score -= 15;

  // Deduct for contact issues
  if (!contact.hasEmail) score -= 10;
  if (!contact.hasPhone) score -= 5;

  // Deduct for skills issues
  if (!skills.hasSkillsSection) score -= 15;
  if (skills.format === 'paragraph') score -= 5;

  // Deduct for experience issues
  if (!experience.hasExperienceSection) score -= 20;
  if (!experience.hasDates) score -= 10;
  if (!experience.dateFormatConsistent) score -= 5;

  // Deduct for education issues
  if (!education.hasEducationSection) score -= 15;
  if (!education.hasDates) score -= 5;

  // Deduct for date issues
  if (!dates.isConsistent) score -= 5;

  // Deduct for non-standard headings
  if (sections.nonStandardHeadings.length > 0) score -= 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate content suggestions
 */
function generateContentSuggestions(
  sections: ReturnType<typeof analyzeSections>,
  contact: ContentAnalysis['contact'],
  skills: ContentAnalysis['skills'],
  experience: ContentAnalysis['experience'],
  education: ContentAnalysis['education'],
  dates: ContentAnalysis['dates']
): string[] {
  const suggestions: string[] = [];

  if (sections.nonStandardHeadings.length > 0) {
    suggestions.push(`Use standard section headings: ${sections.standardHeadings.join(', ')}`);
  }
  if (!contact.hasEmail) {
    suggestions.push('Add a professional email address to your contact section');
  }
  if (!contact.hasPhone) {
    suggestions.push('Add a phone number to your contact section');
  }
  if (!skills.hasSkillsSection) {
    suggestions.push('Create a dedicated Skills section with technical skills listed');
  }
  if (skills.format === 'paragraph') {
    suggestions.push('Format skills as a bulleted list or pipe-separated list for better ATS parsing');
  }
  if (!experience.hasExperienceSection) {
    suggestions.push('Include a Work Experience section with job titles, companies, and dates');
  }
  if (!experience.hasDates) {
    suggestions.push('Add employment dates to each work experience entry');
  }
  if (!experience.dateFormatConsistent) {
    suggestions.push('Use consistent date format throughout (e.g., "Jan 2020 - Dec 2022")');
  }
  if (!education.hasEducationSection) {
    suggestions.push('Include an Education section with degrees and graduation dates');
  }
  if (!dates.isConsistent) {
    suggestions.push('Use a consistent date format throughout your resume');
  }

  if (suggestions.length === 0) {
    suggestions.push('Content structure looks good! All essential sections are present.');
  }

  return suggestions;
}
