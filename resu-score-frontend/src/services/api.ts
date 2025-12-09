import type { AnalysisResponse } from '@/types';
import { getClientId } from '@/utils/clientId';

// Get API URL from environment or use default localhost
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Validate and fix placeholder URLs
if (API_BASE_URL.includes('your-backend-url') || API_BASE_URL.includes('localhost:3000')) {
  console.warn('⚠️ Invalid API URL detected. Using default: http://localhost:3001/api');
  API_BASE_URL = 'http://localhost:3001/api';
}

export const uploadResume = async (
  file: File,
  onProgress?: (progress: number) => void,
  jobDescription?: string
): Promise<AnalysisResponse> => {
  const formData = new FormData();
  formData.append('resume', file);
  if (jobDescription && jobDescription.trim()) {
    formData.append('jobDescription', jobDescription.trim());
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percentage = (e.loaded / e.total) * 100;
        onProgress(percentage);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Failed to parse response'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.message || error.error || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error occurred'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was aborted'));
    });

    xhr.open('POST', `${API_BASE_URL}/upload`);
    xhr.setRequestHeader('X-Client-Id', getClientId());
    xhr.send(formData);
  });
};

export const getAnalysis = async (analysisId: string): Promise<AnalysisResponse> => {
  const response = await fetch(`${API_BASE_URL}/analysis/${analysisId}`, {
    headers: {
      'X-Client-Id': getClientId(),
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch analysis');
  }
  
  return response.json();
};

export interface AnalysisListItem {
  _id: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  analysisResults: {
    overallScore: number;
    formatScore: number;
    contentScore: number;
    atsScore: number;
    checks: {
      fileFormat: boolean;
      structure: boolean;
      headings: boolean;
      skills: boolean;
      experience: boolean;
      education: boolean;
      contactInfo: boolean;
      keywords: boolean;
      dates: boolean;
      length: boolean;
      [key: string]: any;
    };
    suggestions: string[];
    extractedText: string;
    sections: {
      contact?: any;
      summary?: string;
      skills?: string[];
      experience?: any[];
      education?: any[];
      certifications?: any[];
      [key: string]: any;
    };
  };
}

export const getAllAnalyses = async (): Promise<AnalysisListItem[]> => {
  const response = await fetch(`${API_BASE_URL}/analysis`, {
    headers: {
      'X-Client-Id': getClientId(),
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch analyses');
  }
  
  return response.json();
};

export interface BenchmarkResponse {
  ourScoring: {
    formatScore: number;
    contentScore: number;
    atsScore: number;
    overallScore: number;
  };
  industryValidation: any;
  atsCheckerComparison: any;
  methodology: {
    ourWeights: {
      format: string;
      content: string;
      ats: string;
      checklist: string;
    };
    industryStandard: {
      format: string;
      content: string;
      ats: string;
    };
    note: string;
  };
}

export const getBenchmark = async (analysisId: string): Promise<BenchmarkResponse> => {
  const response = await fetch(`${API_BASE_URL}/analysis/${analysisId}/benchmark`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch benchmark');
  }
  
  return response.json();
};

export interface KeywordSuggestion {
  keyword: string;
  category: 'technical' | 'soft-skill' | 'industry' | 'action-verb' | 'certification' | 'tool';
  priority: 'high' | 'medium' | 'low';
  reason: string;
  synonyms?: string[];
  context?: string;
}

export interface KeywordSuggestionsResponse {
  suggestions: KeywordSuggestion[];
  missingKeywords: string[];
  relatedKeywords: string[];
  industryKeywords: string[];
  actionVerbSuggestions: string[];
}

export const getKeywordSuggestions = async (
  resumeText?: string,
  jobDescription?: string,
  analysisId?: string,
  missingKeywords?: string[]
): Promise<KeywordSuggestionsResponse> => {
  const url = new URL(`${API_BASE_URL}/keywords/suggestions`);
  
  if (analysisId) {
    url.searchParams.append('analysisId', analysisId);
  }
  if (resumeText) {
    url.searchParams.append('resumeText', resumeText);
  }
  if (jobDescription) {
    url.searchParams.append('jobDescription', jobDescription);
  }

  if (missingKeywords && missingKeywords.length > 0) {
    // Use POST if we have missing keywords
    const response = await fetch(`${API_BASE_URL}/keywords/suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeText,
        jobDescription,
        missingKeywords,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch keyword suggestions');
    }
    
    return response.json();
  } else {
    // Use GET otherwise
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error('Failed to fetch keyword suggestions');
    }
    
    return response.json();
  }
};

