import express from 'express';
import ResumeAnalysis from '../models/ResumeAnalysis';
import { validateScoring, compareWithATSCheckers } from '../services/atsBenchmark';

const router = express.Router();

// Get analysis by ID
router.get('/:id', async (req, res) => {
  try {
    const clientId = req.header('X-Client-Id');
    if (!clientId) {
      return res.status(400).json({ error: 'Missing client identifier' });
    }

    const analysis = await ResumeAnalysis.findOne({
      _id: req.params.id,
      clientId,
    });
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    // If we have a stored fullResponse (AnalysisResponse), return it directly
    if (analysis.fullResponse) {
      return res.json(analysis.fullResponse);
    }

    // Fallback for older records that only have compact analysisResults
    const transformedData = {
      message: 'Analysis retrieved successfully',
      analysisId: analysis._id.toString(),
      filename: analysis.filename,
      originalName: analysis.originalName,
      fileType: analysis.fileType,
      size: analysis.fileSize,
      wordCount: analysis.analysisResults.extractedText?.split(/\s+/).length || 0,
      formatAnalysis: {
        formatScore: analysis.analysisResults.formatScore,
        isSingleColumn: analysis.analysisResults.checks.structure,
        hasImages: false,
        hasTables: false,
        suggestions: analysis.analysisResults.suggestions,
      },
      contentAnalysis: {
        contentScore: analysis.analysisResults.contentScore,
        hasContact: analysis.analysisResults.checks.contactInfo,
        hasExperience: analysis.analysisResults.checks.experience,
        hasEducation: analysis.analysisResults.checks.education,
        hasSkills: analysis.analysisResults.checks.skills,
        skillCount: analysis.analysisResults.sections?.skills?.length || 0,
        experienceCount: analysis.analysisResults.sections?.experience?.length || 0,
        educationCount: analysis.analysisResults.sections?.education?.length || 0,
        suggestions: analysis.analysisResults.suggestions,
      },
      atsAnalysis: {
        atsScore: analysis.analysisResults.atsScore,
        keywordCount: 0,
        keywordDensity: 0,
        bulletCount: 0,
        hasActionVerbs: false,
        hasQuantifiedResults: false,
        estimatedPages: 1,
        suggestions: analysis.analysisResults.suggestions,
      },
      checklistValidation: {
        overallCompliance: Math.round(analysis.analysisResults.overallScore),
        missingItems: Object.entries(analysis.analysisResults.checks)
          .filter(([_, value]) => !value)
          .map(([key]) => key),
        suggestions: analysis.analysisResults.suggestions,
      },
      isResumeLike: true,
      textPreview: (analysis.analysisResults.extractedText || '').substring(0, 200) + '...',
      metadata: {},
    };

    res.json(transformedData);
  } catch (error: any) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// Get all analyses
router.get('/', async (req, res) => {
  try {
    const clientId = req.header('X-Client-Id');
    if (!clientId) {
      return res.status(400).json({ error: 'Missing client identifier' });
    }

    const analyses = await ResumeAnalysis.find({ clientId })
      .sort({ uploadDate: -1 })
      .limit(50)
      .select('filename originalName fileType fileSize uploadDate analysisResults');
    
    res.json(analyses);
  } catch (error: any) {
    console.error('Error fetching analyses:', error);
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
});

// Get benchmark comparison for an analysis
router.get('/:id/benchmark', async (req, res) => {
  try {
    const analysis = await ResumeAnalysis.findById(req.params.id);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const { formatScore, contentScore, atsScore, overallScore } = analysis.analysisResults;

    // Validate against industry standards
    const validation = validateScoring(formatScore, contentScore, atsScore, 0);

    // Compare with known ATS checkers
    const atsComparison = compareWithATSCheckers(formatScore, contentScore, atsScore, overallScore);

    res.json({
      ourScoring: {
        formatScore,
        contentScore,
        atsScore,
        overallScore,
      },
      industryValidation: validation,
      atsCheckerComparison: atsComparison,
      methodology: {
        ourWeights: {
          format: '20%',
          content: '30%',
          ats: '30%',
          checklist: '20%',
        },
        industryStandard: {
          format: '25%',
          content: '30%',
          ats: '45%',
        },
        note: 'Our scoring includes checklist compliance (20%) which provides more comprehensive validation',
      },
    });
  } catch (error: any) {
    console.error('Error generating benchmark:', error);
    res.status(500).json({ error: 'Failed to generate benchmark' });
  }
});

export default router;
