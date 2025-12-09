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
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

