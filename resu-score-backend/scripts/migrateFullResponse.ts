// scripts/migrateFullResponse.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ResumeAnalysis from '../src/models/ResumeAnalysis';

dotenv.config();

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resuscore');
    console.log('Connected to MongoDB');

    const analyses = await ResumeAnalysis.find({ 
      $or: [
        { fullResponse: { $exists: false } },
        { fullResponse: null }
      ] 
    });

    console.log(`Found ${analyses.length} analyses to update`);

    for (const analysis of analyses) {
      if (analysis.analysisResults) {
        const fullResponse = {
          message: 'Analysis loaded from legacy format',
          analysisId: analysis._id,
          filename: analysis.filename,
          originalName: analysis.originalName,
          fileType: analysis.fileType,
          size: analysis.fileSize,
          wordCount: analysis.analysisResults.extractedText?.split(/\s+/).length || 0,
          characterCount: analysis.analysisResults.extractedText?.length || 0,
          isResumeLike: true,
          textPreview: analysis.analysisResults.extractedText?.substring(0, 200) || '',
          metadata: {},
          formatAnalysis: {
            formatScore: analysis.analysisResults.formatScore,
            isSingleColumn: true,
            hasImages: false,
            hasTables: false,
            suggestions: []
          },
          contentAnalysis: {
            contentScore: analysis.analysisResults.contentScore,
            hasContact: analysis.analysisResults.checks?.contactInfo || false,
            hasExperience: analysis.analysisResults.checks?.experience || false,
            hasEducation: analysis.analysisResults.checks?.education || false,
            hasSkills: analysis.analysisResults.checks?.skills || false,
            suggestions: analysis.analysisResults.suggestions || []
          },
          atsAnalysis: {
            atsScore: analysis.analysisResults.atsScore,
            keywordCount: 0,
            keywordDensity: 0,
            bulletCount: 0,
            hasActionVerbs: false,
            hasQuantifiedResults: false,
            estimatedPages: 1,
            suggestions: []
          },
          checklistValidation: {
            overallCompliance: 0,
            missingItems: []
          },
          grammarCheck: {
            score: 0,
            issueCount: 0,
            errorCount: 0,
            warningCount: 0,
            suggestionCount: 0,
            issues: []
          },
          keywordSuggestions: {
            missingKeywords: []
          },
          overallScore: analysis.analysisResults.overallScore || 0
        };

        await ResumeAnalysis.updateOne(
          { _id: analysis._id },
          { $set: { fullResponse } }
        );
        console.log(`Updated analysis ${analysis._id}`);
      }
    }

    console.log('Migration completed');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();