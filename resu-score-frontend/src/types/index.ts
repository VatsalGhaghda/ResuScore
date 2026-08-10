export interface AISuggestion {
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'format' | 'content' | 'ats' | 'grammar';
}

export interface AIChecklistItem {
  item: string;
  passed: boolean;
  reason?: string;
}

export interface AnalysisResponse {
  message: string;
  analysisId: string;
  filename: string;
  originalName: string;
  fileType: string;
  size: number;
  wordCount: number;
  characterCount: number;
  isResumeLike: boolean;
  textPreview: string;
  metadata: Record<string, any>;
  scoringMode?: 'ai' | 'heuristic';
  formatAnalysis: {
    formatScore: number;
    isSingleColumn: boolean;
    hasImages: boolean;
    hasTables: boolean;
    suggestions?: string[];
  };
  contentAnalysis: {
    contentScore: number;
    hasContact: boolean;
    hasExperience: boolean;
    hasEducation: boolean;
    hasSkills: boolean;
    skillCount: number;
    experienceCount: number;
    educationCount: number;
    suggestions?: string[];
  };
  atsAnalysis: {
    atsScore: number;
    keywordCount: number;
    keywordDensity: number;
    bulletCount: number;
    hasActionVerbs: boolean;
    hasQuantifiedResults: boolean;
    estimatedPages: number;
    jobMatchPercentage?: number;
    suggestions?: string[];
  };
  checklistValidation: {
    overallCompliance?: number;
    missingItems?: string[];
    suggestions?: string[];
    aiChecklist?: AIChecklistItem[];
  };
  grammarCheck?: {
    score: number;
    issueCount: number;
    errorCount: number;
    warningCount: number;
    suggestionCount: number;
    issues?: Array<{
      text: string;
      position: { start: number; end: number };
      type: 'spelling' | 'grammar' | 'punctuation' | 'style';
      severity: 'error' | 'warning' | 'suggestion';
      suggestion?: string;
      reason: string;
    }>;
  };
  keywordSuggestions?: {
    missingKeywords?: string[];
  };
  aiInsights?: {
    overallScore: number;
    formatScore: number;
    contentScore: number;
    atsScore: number;
    checklistScore: number;
    rolePrediction: string;
    industryPrediction: string;
    strengths: string[];
    criticalIssues: string[];
    rewriteSuggestions: Array<{ original: string; improved: string }>;
    tailoredAdvice: string;
    suggestions?: AISuggestion[];
    checklist?: AIChecklistItem[];
  };
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
