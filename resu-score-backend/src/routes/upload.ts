import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { processResumeFile, deleteFile } from '../services/fileProcessor';
import ResumeAnalysis from '../models/ResumeAnalysis';
import { validateFile, validateFileContent } from '../utils/fileValidator';
import { analyzeFormat } from '../services/formatAnalyzer';
import { analyzeContent } from '../services/contentAnalyzer';
import { analyzeATS } from '../services/atsAnalyzer';
import { validateChecklist } from '../services/checklistValidator';
import { extractSections } from '../utils/textPreprocessor';
import { checkGrammar } from '../services/grammarChecker';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed!'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload and process resume
router.post('/', upload.single('resume'), async (req, res) => {
  let filePath: string | null = null;
  
  try {
    const clientId = req.header('X-Client-Id');
    if (!clientId) {
      return res.status(400).json({ error: 'Missing client identifier' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const fileType = fileExt === '.pdf' ? 'pdf' : 'docx';

    // Validate file
    const validation = validateFile(filePath, req.file.originalname, req.file.size);
    if (!validation.isValid) {
      deleteFile(filePath);
      return res.status(400).json({
        error: 'File validation failed',
        details: validation.errors,
        warnings: validation.warnings,
      });
    }

    // Validate file content matches extension
    if (!validateFileContent(filePath, fileType)) {
      deleteFile(filePath);
      return res.status(400).json({
        error: 'File content does not match file type',
        details: `The file does not appear to be a valid ${fileType.toUpperCase()} file.`,
      });
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.log('⚠️  File validation warnings:', validation.warnings);
    }

    console.log(`📄 Processing ${fileType.toUpperCase()} file: ${req.file.originalname}`);

    // Process the file to extract text
    const processedFile = await processResumeFile(filePath, fileType);

    if (!processedFile.success) {
      deleteFile(filePath);
      return res.status(400).json({ 
        error: 'Failed to process file',
        details: processedFile.error 
      });
    }

    // Validate that the file appears to be a resume
    if (!processedFile.isResumeLike && processedFile.wordCount < 50) {
      deleteFile(filePath);
      return res.status(400).json({ 
        error: 'File does not appear to be a resume',
        details: 'The uploaded file does not contain typical resume content. Please upload a valid resume file.'
      });
    }

    // Run format analysis
    console.log('🔍 Running format analysis...');
    const formatAnalysis = analyzeFormat(processedFile.cleanedText, processedFile.wordCount);

    // Run content analysis
    console.log('🔍 Running content analysis...');
    const contentAnalysis = analyzeContent(processedFile.cleanedText);

    // Run ATS analysis (optional: can accept job description from request body)
    // Use raw text for bullet detection (preserves line breaks), cleaned text for other analysis
    console.log('🔍 Running ATS optimization analysis...');
    const jobDescription = req.body?.jobDescription || undefined;
    // Create a hybrid text: use raw text but normalize only excessive whitespace for bullet detection
    const textForBullets = processedFile.text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const atsAnalysis = analyzeATS(processedFile.cleanedText, jobDescription, textForBullets);

    // Extract sections for checklist validation (re-extract for detailed validation)
    const extractedSections = extractSections(processedFile.cleanedText);

    // Run comprehensive checklist validation
    console.log('🔍 Running comprehensive checklist validation...');
    const checklistValidation = validateChecklist(
      processedFile.cleanedText,
      req.file.originalname,
      extractedSections,
      formatAnalysis,
      contentAnalysis,
      atsAnalysis
    );

    // Run grammar and spelling check
    console.log('🔍 Running grammar and spelling check...');
    const grammarCheck = checkGrammar(processedFile.cleanedText);

    // Update checks based on comprehensive checklist validation
    const checks = {
      fileFormat: checklistValidation.fileFormat.isValid && checklistValidation.fileFormat.isTextBased,
      structure: checklistValidation.structure.isSingleColumn && !checklistValidation.structure.hasTables,
      headings: checklistValidation.headings.usesStandardHeadings,
      skills: checklistValidation.skills.hasDedicatedSection && checklistValidation.skills.isProperFormat,
      experience: checklistValidation.experience.hasRequiredFields,
      education: checklistValidation.education.hasRequiredFields,
      contactInfo: checklistValidation.contact.hasName && 
                   checklistValidation.contact.hasPhone && 
                   checklistValidation.contact.hasEmail && 
                   checklistValidation.contact.hasProfessionalEmail,
      keywords: checklistValidation.keywords.hasKeywords,
      dates: checklistValidation.dates.isConsistent && !checklistValidation.dates.hasVagueDates,
      length: checklistValidation.length.isOptimal,
    };

    // Calculate overall score using industry-standard weights
    // Weight: Format 20%, Content 25%, ATS 45%, Checklist Compliance 10%
    // Aligned with industry standards where ATS optimization is the primary factor
    const overallScore = Math.round(
      (formatAnalysis.overallFormatScore * 0.20) +
      (contentAnalysis.overallContentScore * 0.25) +
      (atsAnalysis.overallATSScore * 0.45) +
      (checklistValidation.overallCompliance * 0.10)
    );

    // Combine suggestions from all analyses and checklist validation
    const allSuggestions = [
      ...formatAnalysis.suggestions,
      ...contentAnalysis.suggestions,
      ...atsAnalysis.suggestions,
    ];

    // Add checklist-specific suggestions for missing items
    const checklistSuggestions = checklistValidation.missingItems.map(item => 
      `Missing: ${item}`
    );

    // Deduplicate suggestions (case-insensitive, similar meaning)
    const suggestionSet = new Set<string>();
    const uniqueSuggestions: string[] = [];
    
    const normalizeSuggestion = (s: string) => {
      // Normalize and extract key phrases
      return s.toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, ' ') // Remove punctuation
        .replace(/\s+/g, ' '); // Normalize whitespace
    };
    
    // Key phrases that indicate similar suggestions
    const getKeyPhrases = (s: string): string[] => {
      const normalized = normalizeSuggestion(s);
      const phrases: string[] = [];
      // Extract important words (3+ characters)
      const words = normalized.split(/\s+/).filter(w => w.length >= 3);
      // Create 2-word and 3-word phrases
      for (let i = 0; i < words.length - 1; i++) {
        phrases.push(words[i] + ' ' + words[i + 1]);
      }
      for (let i = 0; i < words.length - 2; i++) {
        phrases.push(words[i] + ' ' + words[i + 1] + ' ' + words[i + 2]);
      }
      return phrases;
    };
    
    for (const suggestion of [...allSuggestions, ...checklistSuggestions]) {
      const normalized = normalizeSuggestion(suggestion);
      const keyPhrases = getKeyPhrases(suggestion);
      
      // Check if similar suggestion already exists
      let isDuplicate = false;
      for (const existing of suggestionSet) {
        // Exact match
        if (normalized === existing) {
          isDuplicate = true;
          break;
        }
        
        // Check for overlapping key phrases (if 2+ phrases match, likely duplicate)
        const existingPhrases = getKeyPhrases(existing);
        const matchingPhrases = keyPhrases.filter(p => existingPhrases.includes(p));
        if (matchingPhrases.length >= 2) {
          isDuplicate = true;
          break;
        }
        
        // Check for substring match in longer suggestions
        if (normalized.length > 30 && existing.length > 30) {
          const minLen = Math.min(normalized.length, existing.length);
          const similarity = matchingPhrases.length / Math.max(keyPhrases.length, existingPhrases.length);
          if (similarity > 0.6) {
            isDuplicate = true;
            break;
          }
        }
      }
      
      if (!isDuplicate) {
        suggestionSet.add(normalized);
        uniqueSuggestions.push(suggestion);
      }
    }

    const suggestions = uniqueSuggestions;

    // Extract sections for storage
    const sections = {
      contact: {
        emails: contentAnalysis.contact.emails,
        phones: contentAnalysis.contact.phones,
        urls: contentAnalysis.contact.urls,
      },
      summary: contentAnalysis.sections.hasSummary ? 'Present' : undefined,
      skills: contentAnalysis.skills.skillsFound,
      experience: contentAnalysis.experience.entries,
      education: contentAnalysis.education.entries,
      certifications: contentAnalysis.sections.hasCertifications ? 'Present' : undefined,
    };

    // Save to MongoDB (use cleanedText for analysis, keep raw text for reference)
    const resumeAnalysis = new ResumeAnalysis({
      clientId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileType: fileType,
      fileSize: req.file.size,
      analysisResults: {
        overallScore,
        formatScore: formatAnalysis.overallFormatScore,
        contentScore: contentAnalysis.overallContentScore,
        atsScore: atsAnalysis.overallATSScore,
        checks,
        suggestions,
        extractedText: processedFile.cleanedText, // Use cleaned text for analysis
        sections,
      },
    });

    const savedAnalysis = await resumeAnalysis.save();

    // Build the full response payload once so we can both return it and store it
    const apiResponse = {
      message: 'File uploaded and processed successfully',
      analysisId: savedAnalysis._id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileType: fileType,
      size: req.file.size,
      wordCount: processedFile.wordCount,
      characterCount: processedFile.characterCount,
      isResumeLike: processedFile.isResumeLike,
      textPreview: processedFile.cleanedText.substring(0, 200) + (processedFile.cleanedText.length > 200 ? '...' : ''),
      metadata: processedFile.metadata,
      formatAnalysis: {
        formatScore: formatAnalysis.overallFormatScore,
        isSingleColumn: formatAnalysis.layout.isSingleColumn,
        hasImages: formatAnalysis.images.hasImages,
        hasTables: formatAnalysis.tables.hasTables,
        suggestions: formatAnalysis.suggestions.slice(0, 3), // Return top 3 suggestions
      },
      contentAnalysis: {
        contentScore: contentAnalysis.overallContentScore,
        hasContact: contentAnalysis.contact.hasEmail && contentAnalysis.contact.hasPhone,
        hasExperience: contentAnalysis.experience.hasExperienceSection,
        hasEducation: contentAnalysis.education.hasEducationSection,
        hasSkills: contentAnalysis.skills.hasSkillsSection,
        skillCount: contentAnalysis.skills.skillCount,
        experienceCount: contentAnalysis.experience.entryCount,
        educationCount: contentAnalysis.education.entryCount,
        suggestions: contentAnalysis.suggestions.slice(0, 3), // Return top 3 suggestions
      },
      atsAnalysis: {
        atsScore: atsAnalysis.overallATSScore,
        keywordCount: atsAnalysis.keywords.uniqueKeywords,
        keywordDensity: atsAnalysis.keywords.keywordDensity,
        bulletCount: atsAnalysis.bullets.bulletCount,
        hasActionVerbs: atsAnalysis.bullets.usesActionVerbs,
        hasQuantifiedResults: atsAnalysis.bullets.hasQuantifiedResults,
        estimatedPages: atsAnalysis.length.estimatedPages,
        jobMatchPercentage: atsAnalysis.keywords.jobSpecificMatch?.matchPercentage,
        suggestions: atsAnalysis.suggestions.slice(0, 3), // Return top 3 suggestions
      },
      checklistValidation: {
        overallCompliance: checklistValidation.overallCompliance,
        missingItems: checklistValidation.missingItems.slice(0, 10), // Top 10 missing items
        // suggestions removed - missingItems already provides this information
        fileFormat: checklistValidation.fileFormat.isValid,
        structure: checklistValidation.structure.isSingleColumn,
        headings: checklistValidation.headings.usesStandardHeadings,
        skills: checklistValidation.skills.isProperFormat,
        experience: checklistValidation.experience.hasRequiredFields,
        contact: checklistValidation.contact.hasProfessionalEmail,
        dates: checklistValidation.dates.isConsistent,
      },
      grammarCheck: {
        score: grammarCheck.score,
        issueCount: grammarCheck.issueCount,
        errorCount: grammarCheck.errorCount,
        warningCount: grammarCheck.warningCount,
        suggestionCount: grammarCheck.suggestionCount,
        issues: grammarCheck.issues.slice(0, 10), // Top 10 issues
      },
      keywordSuggestions: {
        // Include top missing keywords for quick reference
        missingKeywords: atsAnalysis.keywords.jobSpecificMatch?.missingKeywords?.slice(0, 10) || [],
      },
      overallScore,
    };

    // Persist the full response for later retrieval from history/results?id=...
    await ResumeAnalysis.findByIdAndUpdate(savedAnalysis._id, {
      fullResponse: apiResponse,
    });

    // Clean up uploaded file after processing
    deleteFile(filePath);

    // Return the same payload that we stored
    res.json(apiResponse);
  } catch (error: any) {
    // Clean up file if it exists
    if (filePath) {
      deleteFile(filePath);
    }
    
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'File upload failed',
      details: error.message 
    });
  }
});

export default router;
