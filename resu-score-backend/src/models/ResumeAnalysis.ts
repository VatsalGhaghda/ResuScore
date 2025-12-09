import mongoose, { Schema, Document } from 'mongoose';

export interface IResumeAnalysis extends Document {
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadDate: Date;
  clientId: string;
  // Compact scoring summary used for history list
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
    };
  };
  // Optional: full AnalysisResponse payload as sent to the frontend after upload
  fullResponse?: any;
}

const ResumeAnalysisSchema: Schema = new Schema({
  clientId: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
    enum: ['pdf', 'docx'],
  },
  fileSize: {
    type: Number,
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  analysisResults: {
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    formatScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    contentScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    atsScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    checks: {
      fileFormat: { type: Boolean, default: false },
      structure: { type: Boolean, default: false },
      headings: { type: Boolean, default: false },
      skills: { type: Boolean, default: false },
      experience: { type: Boolean, default: false },
      education: { type: Boolean, default: false },
      contactInfo: { type: Boolean, default: false },
      keywords: { type: Boolean, default: false },
      dates: { type: Boolean, default: false },
      length: { type: Boolean, default: false },
    },
    suggestions: [{
      type: String,
    }],
    extractedText: {
      type: String,
      default: '',
    },
    sections: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  fullResponse: {
    type: Schema.Types.Mixed,
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.model<IResumeAnalysis>('ResumeAnalysis', ResumeAnalysisSchema);
