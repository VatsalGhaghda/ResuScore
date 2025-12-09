/**
 * Keyword Suggestion Engine
 * Provides intelligent keyword suggestions based on job description,
 * industry standards, and resume content analysis
 */

export interface KeywordSuggestion {
  keyword: string;
  category: 'technical' | 'soft-skill' | 'industry' | 'action-verb' | 'certification' | 'tool';
  priority: 'high' | 'medium' | 'low';
  reason: string;
  synonyms?: string[];
  context?: string; // Where to add this keyword
}

export interface KeywordSuggestionsResponse {
  suggestions: KeywordSuggestion[];
  missingKeywords: string[];
  relatedKeywords: string[];
  industryKeywords: string[];
  actionVerbSuggestions: string[];
}

// Industry-specific keyword databases
const INDUSTRY_KEYWORDS: { [key: string]: string[] } = {
  'software': ['agile', 'scrum', 'devops', 'ci/cd', 'microservices', 'api', 'rest', 'graphql', 'docker', 'kubernetes'],
  'data': ['sql', 'python', 'r', 'machine learning', 'data science', 'analytics', 'big data', 'etl', 'data visualization'],
  'design': ['ui/ux', 'figma', 'adobe', 'prototyping', 'wireframing', 'user research', 'design systems'],
  'marketing': ['seo', 'sem', 'content marketing', 'social media', 'analytics', 'crm', 'email marketing', 'ppc'],
  'finance': ['financial analysis', 'accounting', 'forecasting', 'budgeting', 'risk management', 'compliance'],
  'sales': ['crm', 'lead generation', 'client relations', 'negotiation', 'revenue growth', 'account management'],
};

// Common technical skills by category
const TECHNICAL_KEYWORDS: { [key: string]: string[] } = {
  'programming': ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'php', 'ruby'],
  'web': ['html', 'css', 'react', 'vue', 'angular', 'next.js', 'node.js', 'express', 'django', 'flask'],
  'database': ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle'],
  'cloud': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible'],
  'tools': ['git', 'jenkins', 'jira', 'confluence', 'slack', 'figma', 'adobe'],
};

// Action verb synonyms
const ACTION_VERB_SYNONYMS: { [key: string]: string[] } = {
  'developed': ['created', 'built', 'designed', 'engineered', 'architected'],
  'managed': ['led', 'supervised', 'oversaw', 'coordinated', 'directed'],
  'improved': ['enhanced', 'optimized', 'refined', 'upgraded', 'streamlined'],
  'increased': ['boosted', 'elevated', 'amplified', 'expanded', 'grew'],
  'achieved': ['accomplished', 'attained', 'delivered', 'executed', 'realized'],
};

/**
 * Generate intelligent keyword suggestions
 */
export function generateKeywordSuggestions(
  resumeText: string,
  jobDescription?: string,
  missingKeywords?: string[]
): KeywordSuggestionsResponse {
  const resumeLower = resumeText.toLowerCase();
  const suggestions: KeywordSuggestion[] = [];
  const relatedKeywords: string[] = [];
  const industryKeywords: string[] = [];
  const actionVerbSuggestions: string[] = [];

  // 1. Analyze missing keywords from job description
  if (missingKeywords && missingKeywords.length > 0) {
    missingKeywords.slice(0, 15).forEach(keyword => {
      const category = categorizeKeyword(keyword);
      const priority = calculatePriority(keyword, jobDescription || '');
      
      suggestions.push({
        keyword,
        category,
        priority,
        reason: `This keyword appears ${priority === 'high' ? 'frequently' : 'occasionally'} in the job description but is missing from your resume.`,
        context: suggestContext(keyword, resumeText),
      });
    });
  }

  // 2. Suggest related/synonym keywords
  if (jobDescription) {
    const jobKeywords = extractKeywords(jobDescription);
    jobKeywords.forEach(jobKeyword => {
      if (!resumeLower.includes(jobKeyword.toLowerCase())) {
        const synonyms = findSynonyms(jobKeyword);
        synonyms.forEach(synonym => {
          if (!resumeLower.includes(synonym.toLowerCase()) && !relatedKeywords.includes(synonym)) {
            relatedKeywords.push(synonym);
            suggestions.push({
              keyword: synonym,
              category: categorizeKeyword(synonym),
              priority: 'medium',
              reason: `Related to "${jobKeyword}" from the job description. Using synonyms can improve ATS matching.`,
              synonyms: [jobKeyword],
            });
          }
        });
      }
    });
  }

  // 3. Industry-specific keyword suggestions
  const detectedIndustry = detectIndustry(jobDescription || resumeText);
  if (detectedIndustry && INDUSTRY_KEYWORDS[detectedIndustry]) {
    INDUSTRY_KEYWORDS[detectedIndustry].forEach(keyword => {
      if (!resumeLower.includes(keyword.toLowerCase())) {
        industryKeywords.push(keyword);
        suggestions.push({
          keyword,
          category: 'industry',
          priority: 'medium',
          reason: `Common ${detectedIndustry} industry keyword that could strengthen your resume.`,
        });
      }
    });
  }

  // 4. Technical skill suggestions based on existing skills
  const existingSkills = extractTechnicalSkills(resumeText);
  existingSkills.forEach(skill => {
    const related = findRelatedTechnicalSkills(skill);
    related.forEach(relatedSkill => {
      if (!resumeLower.includes(relatedSkill.toLowerCase()) && 
          !suggestions.some(s => s.keyword.toLowerCase() === relatedSkill.toLowerCase())) {
        suggestions.push({
          keyword: relatedSkill,
          category: 'technical',
          priority: 'low',
          reason: `Commonly used alongside "${skill}" in similar roles.`,
        });
      }
    });
  });

  // 5. Action verb suggestions
  const existingVerbs = extractActionVerbs(resumeText);
  existingVerbs.forEach((verb: string) => {
    const synonyms = ACTION_VERB_SYNONYMS[verb.toLowerCase()] || [];
    synonyms.forEach(synonym => {
      if (!actionVerbSuggestions.includes(synonym) && 
          !resumeLower.includes(synonym.toLowerCase())) {
        actionVerbSuggestions.push(synonym);
        suggestions.push({
          keyword: synonym,
          category: 'action-verb',
          priority: 'low',
          reason: `Strong alternative to "${verb}" that adds variety to your resume.`,
        });
      }
    });
  });

  // 6. Certification and tool suggestions
  if (detectedIndustry) {
    const certs = getIndustryCertifications(detectedIndustry);
    certs.forEach(cert => {
      if (!resumeLower.includes(cert.toLowerCase())) {
        suggestions.push({
          keyword: cert,
          category: 'certification',
          priority: 'medium',
          reason: `Valuable certification in ${detectedIndustry} that could enhance your profile.`,
        });
      }
    });
  }

  // Sort suggestions by priority
  suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return {
    suggestions: suggestions.slice(0, 30), // Top 30 suggestions
    missingKeywords: missingKeywords || [],
    relatedKeywords: relatedKeywords.slice(0, 10),
    industryKeywords: industryKeywords.slice(0, 10),
    actionVerbSuggestions: actionVerbSuggestions.slice(0, 10),
  };
}

/**
 * Categorize a keyword
 */
function categorizeKeyword(keyword: string): KeywordSuggestion['category'] {
  const kw = keyword.toLowerCase();
  
  // Technical keywords
  if (TECHNICAL_KEYWORDS.programming.some(k => kw.includes(k)) ||
      TECHNICAL_KEYWORDS.web.some(k => kw.includes(k)) ||
      TECHNICAL_KEYWORDS.database.some(k => kw.includes(k)) ||
      TECHNICAL_KEYWORDS.cloud.some(k => kw.includes(k))) {
    return 'technical';
  }
  
  // Action verbs
  if (Object.keys(ACTION_VERB_SYNONYMS).some(v => kw.includes(v))) {
    return 'action-verb';
  }
  
  // Soft skills
  if (['communication', 'leadership', 'teamwork', 'problem-solving', 'collaboration', 'adaptability'].some(s => kw.includes(s))) {
    return 'soft-skill';
  }
  
  // Tools
  if (TECHNICAL_KEYWORDS.tools.some(k => kw.includes(k))) {
    return 'tool';
  }
  
  return 'industry';
}

/**
 * Calculate priority based on frequency in job description
 */
function calculatePriority(keyword: string, jobDescription: string): 'high' | 'medium' | 'low' {
  if (!jobDescription) return 'medium';
  
  const jobLower = jobDescription.toLowerCase();
  const keywordLower = keyword.toLowerCase();
  const regex = new RegExp(keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const matches = jobLower.match(regex);
  const frequency = matches ? matches.length : 0;
  
  if (frequency >= 3) return 'high';
  if (frequency >= 1) return 'medium';
  return 'low';
}

/**
 * Suggest where to add a keyword in the resume
 */
function suggestContext(keyword: string, resumeText: string): string {
  const sections = {
    'experience': /experience|work|employment|professional/i,
    'skills': /skills|technical|competencies/i,
    'summary': /summary|objective|profile|about/i,
    'education': /education|academic|university|degree/i,
  };
  
  for (const [section, regex] of Object.entries(sections)) {
    if (regex.test(resumeText)) {
      return `Consider adding to ${section} section`;
    }
  }
  
  return 'Consider adding to skills or experience section';
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  // Remove common stop words
  const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use']);
  
  return [...new Set(words.filter(word => !stopWords.has(word)))].slice(0, 50);
}

/**
 * Find synonyms for a keyword
 */
function findSynonyms(keyword: string): string[] {
  const kw = keyword.toLowerCase();
  const synonyms: string[] = [];
  
  // Check action verb synonyms
  for (const [verb, syns] of Object.entries(ACTION_VERB_SYNONYMS)) {
    if (kw.includes(verb) || syns.some(s => kw.includes(s))) {
      synonyms.push(...syns.filter(s => s !== kw));
    }
  }
  
  // Common technical synonyms
  const techSynonyms: { [key: string]: string[] } = {
    'javascript': ['js', 'ecmascript', 'node.js'],
    'python': ['py', 'django', 'flask'],
    'database': ['db', 'sql', 'nosql'],
    'api': ['rest api', 'graphql', 'endpoint'],
  };
  
  for (const [tech, syns] of Object.entries(techSynonyms)) {
    if (kw.includes(tech)) {
      synonyms.push(...syns);
    }
  }
  
  return [...new Set(synonyms)].slice(0, 5);
}

/**
 * Detect industry from text
 */
function detectIndustry(text: string): string | null {
  const textLower = text.toLowerCase();
  
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (keywords.some(kw => textLower.includes(kw))) {
      return industry;
    }
  }
  
  // Check for common industry indicators
  if (textLower.match(/\b(software|developer|programming|code|application)\b/)) return 'software';
  if (textLower.match(/\b(data|analytics|analysis|machine learning|ai)\b/)) return 'data';
  if (textLower.match(/\b(design|ui|ux|graphic|visual)\b/)) return 'design';
  if (textLower.match(/\b(marketing|seo|advertising|brand)\b/)) return 'marketing';
  if (textLower.match(/\b(finance|accounting|financial|banking)\b/)) return 'finance';
  if (textLower.match(/\b(sales|revenue|customer|client)\b/)) return 'sales';
  
  return null;
}

/**
 * Extract technical skills from resume
 */
function extractTechnicalSkills(text: string): string[] {
  const skills: string[] = [];
  const allTechKeywords = [
    ...TECHNICAL_KEYWORDS.programming,
    ...TECHNICAL_KEYWORDS.web,
    ...TECHNICAL_KEYWORDS.database,
    ...TECHNICAL_KEYWORDS.cloud,
    ...TECHNICAL_KEYWORDS.tools,
  ];
  
  const textLower = text.toLowerCase();
  allTechKeywords.forEach(skill => {
    if (textLower.includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  });
  
  return skills;
}

/**
 * Find related technical skills
 */
function findRelatedTechnicalSkills(skill: string): string[] {
  const skillLower = skill.toLowerCase();
  const related: string[] = [];
  
  // Programming language ecosystems
  if (skillLower.includes('javascript') || skillLower.includes('typescript')) {
    related.push('react', 'node.js', 'express', 'vue', 'angular');
  }
  if (skillLower.includes('python')) {
    related.push('django', 'flask', 'pandas', 'numpy', 'machine learning');
  }
  if (skillLower.includes('java')) {
    related.push('spring', 'hibernate', 'maven', 'gradle');
  }
  
  // Cloud and DevOps
  if (skillLower.includes('aws')) {
    related.push('docker', 'kubernetes', 'terraform', 'ci/cd');
  }
  if (skillLower.includes('docker')) {
    related.push('kubernetes', 'aws', 'azure', 'devops');
  }
  
  // Databases
  if (skillLower.includes('sql') || skillLower.includes('mysql') || skillLower.includes('postgresql')) {
    related.push('database design', 'query optimization', 'nosql');
  }
  
  return [...new Set(related)].slice(0, 5);
}

/**
 * Extract action verbs from resume text
 */
function extractActionVerbs(text: string): string[] {
  const verbs: string[] = [];
  const textLower = text.toLowerCase();
  
  Object.keys(ACTION_VERB_SYNONYMS).forEach(verb => {
    if (textLower.includes(verb.toLowerCase())) {
      verbs.push(verb);
    }
  });
  
  return verbs;
}

/**
 * Get industry-specific certifications
 */
function getIndustryCertifications(industry: string): string[] {
  const certs: { [key: string]: string[] } = {
    'software': ['AWS Certified', 'Google Cloud Certified', 'Microsoft Certified', 'Scrum Master', 'PMP'],
    'data': ['Data Science Certification', 'Tableau Certified', 'Google Analytics', 'AWS Data Analytics'],
    'cloud': ['AWS Solutions Architect', 'Azure Administrator', 'Google Cloud Professional'],
    'security': ['CISSP', 'CEH', 'Security+', 'CISM'],
  };
  
  return certs[industry] || [];
}

