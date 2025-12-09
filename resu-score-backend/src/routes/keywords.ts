/**
 * Keyword Suggestions API Route
 * Provides intelligent keyword suggestions for resume optimization
 */

import express from 'express';
import { generateKeywordSuggestions } from '../services/keywordSuggester';
import { extractSections } from '../utils/textPreprocessor';

const router = express.Router();

/**
 * GET /api/keywords/suggestions
 * Get keyword suggestions for a resume
 * Query params:
 *   - resumeText: The resume text to analyze
 *   - jobDescription: Optional job description
 *   - analysisId: Optional analysis ID to fetch from database
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { resumeText, jobDescription, analysisId } = req.query;

    if (!resumeText && !analysisId) {
      return res.status(400).json({
        error: 'Either resumeText or analysisId must be provided',
      });
    }

    let text = resumeText as string;
    let jobDesc = jobDescription as string | undefined;

    // If analysisId is provided, fetch from database
    if (analysisId) {
      const ResumeAnalysis = (await import('../models/ResumeAnalysis')).default;
      const analysis = await ResumeAnalysis.findById(analysisId);
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }
      
      text = analysis.analysisResults.extractedText;
      // Job description might be stored separately or in metadata
      // For now, we'll use the provided jobDescription or leave it undefined
    }

    if (!text) {
      return res.status(400).json({ error: 'Resume text is required' });
    }

    // Extract missing keywords from ATS analysis if available
    // For now, we'll generate suggestions based on the text and job description
    const suggestions = generateKeywordSuggestions(
      text,
      jobDesc,
      undefined // Missing keywords will be extracted internally
    );

    res.json({
      success: true,
      ...suggestions,
    });
  } catch (error: any) {
    console.error('Keyword suggestions error:', error);
    res.status(500).json({
      error: 'Failed to generate keyword suggestions',
      details: error.message,
    });
  }
});

/**
 * POST /api/keywords/suggestions
 * Get keyword suggestions with full analysis context
 * Body:
 *   - resumeText: The resume text
 *   - jobDescription: Optional job description
 *   - missingKeywords: Optional array of missing keywords from ATS analysis
 */
router.post('/suggestions', async (req, res) => {
  try {
    const { resumeText, jobDescription, missingKeywords } = req.body;

    if (!resumeText) {
      return res.status(400).json({ error: 'resumeText is required' });
    }

    const suggestions = generateKeywordSuggestions(
      resumeText,
      jobDescription,
      missingKeywords
    );

    res.json({
      success: true,
      ...suggestions,
    });
  } catch (error: any) {
    console.error('Keyword suggestions error:', error);
    res.status(500).json({
      error: 'Failed to generate keyword suggestions',
      details: error.message,
    });
  }
});

export default router;

