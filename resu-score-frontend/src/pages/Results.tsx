import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  FileText, 
  Layout, 
  Type, 
  Search, 
  CheckSquare,
  ArrowLeft,
  Download,
  RefreshCw,
  Calendar,
  Table,
  Hash,
  User,
  Briefcase,
  GraduationCap,
  AlertCircle,
  Lightbulb,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { ScoreCard } from "@/components/ui/ScoreCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { SuggestionList } from "@/components/SuggestionList";
import { ChecklistSection } from "@/components/ChecklistSection";
import { MetricCard } from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import type { AnalysisResponse } from "@/types";
import { getAnalysis } from "@/services/api";
import { toast } from "sonner";

// Transform backend data to UI format
const transformAnalysisData = (data: any) => {
  const safeScore = (score: number | undefined): number => {
    if (score === undefined || isNaN(score)) return 0;
    return Math.round(score);
  };

  // Handle both old and new data structures
  const isNewFormat = 'analysisResults' in data;
  const analysis = isNewFormat ? data.analysisResults : data;
  
  // Get scores with fallbacks
  const formatScore = analysis.formatScore || (data.formatAnalysis?.formatScore || 0);
  const contentScore = analysis.contentScore || (data.contentAnalysis?.contentScore || 0);
  const atsScore = analysis.atsScore || (data.atsAnalysis?.atsScore || 0);
  const overallScore = analysis.overallScore || data.checklistValidation?.overallCompliance || 0;
  const jobMatch = typeof data.atsAnalysis?.jobMatchPercentage === 'number'
    ? data.atsAnalysis.jobMatchPercentage
    : null;

  // Collect all suggestions from all sections
  const allSuggestions = [
    ...(analysis.suggestions || []),
    ...(data.formatAnalysis?.suggestions || []),
    ...(data.contentAnalysis?.suggestions || []),
    ...(data.atsAnalysis?.suggestions || []),
    ...(data.checklistValidation?.suggestions || [])
  ];

  // Remove duplicates and transform to suggestion objects
  const uniqueSuggestions = Array.from(new Set(allSuggestions));
  const suggestions = uniqueSuggestions.map((suggestion, idx) => ({
    id: `suggestion-${idx}`,
    type: "warning" as const,
    title: "Suggestion",
    description: String(suggestion),
    impact: "medium" as const,
  }));

  // Content suggestions
  if (data.contentAnalysis.suggestions) {
    data.contentAnalysis.suggestions.forEach((suggestion, idx) => {
      suggestions.push({
        id: `content-${idx}`,
        type: "warning" as const,
        title: "Content Improvement",
        description: suggestion,
        impact: "high" as const,
      });
    });
  }

  // ATS suggestions
  if (data.atsAnalysis.suggestions) {
    data.atsAnalysis.suggestions.forEach((suggestion, idx) => {
      suggestions.push({
        id: `ats-${idx}`,
        type: "warning" as const,
        title: "ATS Optimization",
        description: suggestion,
        impact: "high" as const,
      });
    });
  }

  // Job matching suggestions (only when we have a valid numeric percentage)
  if (jobMatch !== null) {
    const matchPct = jobMatch;
    if (matchPct < 50) {
      suggestions.push({
        id: 'job-match-low',
        type: "error" as const,
        title: "Low Job Match Score",
        description: `Your resume matches only ${matchPct}% of the job description keywords. Add more relevant keywords to improve your match.`,
        impact: "high" as const,
      });
    } else if (matchPct < 70) {
      suggestions.push({
        id: 'job-match-medium',
        type: "warning" as const,
        title: "Moderate Job Match Score",
        description: `Your resume matches ${matchPct}% of the job description keywords. Consider adding more relevant skills and keywords.`,
        impact: "high" as const,
      });
    }
  }

  // Checklist missing items
  if (data.checklistValidation.missingItems) {
    data.checklistValidation.missingItems.forEach((item, idx) => {
      suggestions.push({
        id: `checklist-${idx}`,
        type: "error" as const,
        title: "Missing Item",
        description: item,
        impact: "high" as const,
      });
    });
  }

  // Build checklist items
  const checklistItems = [
    { id: "1", label: "Contact Information", isComplete: data.contentAnalysis.hasContact, category: "Essentials" },
    { id: "2", label: "Work Experience", isComplete: data.contentAnalysis.hasExperience, category: "Essentials" },
    { id: "3", label: "Education Section", isComplete: data.contentAnalysis.hasEducation, category: "Essentials" },
    { id: "4", label: "Skills Section", isComplete: data.contentAnalysis.hasSkills, category: "Essentials" },
    { id: "5", label: "Single Column Layout", isComplete: data.formatAnalysis.isSingleColumn, category: "Format" },
    { id: "6", label: "No Images", isComplete: !data.formatAnalysis.hasImages, category: "Format" },
    { id: "7", label: "No Tables", isComplete: !data.formatAnalysis.hasTables, category: "Format" },
    { id: "8", label: "Action Verbs Used", isComplete: data.atsAnalysis.hasActionVerbs, category: "Content" },
    { id: "9", label: "Quantified Results", isComplete: data.atsAnalysis.hasQuantifiedResults, category: "Content" },
  ];

  return {
    overallScore,
    scores: {
      format: { 
        score: safeScore(formatScore), 
        description: data.formatAnalysis.isSingleColumn ? "Clean structure detected" : "Consider single column layout" 
      },
      content: { 
        score: safeScore(contentScore), 
        description: contentScore >= 70 ? "Good content quality" : "Could use more impact" 
      },
      ats: { 
        score: safeScore(atsScore), 
        description: jobMatch !== null
          ? `Job match: ${jobMatch}% - ${jobMatch >= 70 ? "Strong alignment" : jobMatch >= 50 ? "Moderate alignment" : "Needs improvement"}`
          : data.atsAnalysis.keywordCount > 10 ? "Good keyword density" : "Add more relevant keywords"
      },
      checklist: { 
        score: safeScore(data.checklistValidation.overallCompliance || 0), 
        description: data.checklistValidation.overallCompliance && data.checklistValidation.overallCompliance >= 80 ? "Most items present" : "Some items missing" 
      },
    },
    suggestions,
    checklist: checklistItems,
    metrics: {
      format: [
        { label: "File Type", value: data.fileType.toUpperCase(), status: "good" as const },
        { label: "Page Count", value: `${data.atsAnalysis.estimatedPages} page${data.atsAnalysis.estimatedPages !== 1 ? 's' : ''}`, status: "good" as const },
        { label: "Layout", value: data.formatAnalysis.isSingleColumn ? "Single column" : "Multi-column", status: data.formatAnalysis.isSingleColumn ? "good" as const : "warning" as const },
        { label: "Images", value: data.formatAnalysis.hasImages ? "Found" : "None", status: data.formatAnalysis.hasImages ? "warning" as const : "good" as const },
        { label: "Tables", value: data.formatAnalysis.hasTables ? "Found" : "None", status: data.formatAnalysis.hasTables ? "warning" as const : "good" as const },
      ],
      content: [
        { label: "Word Count", value: `${data.wordCount} words`, status: "good" as const },
        { label: "Bullet Points", value: `${data.atsAnalysis.bulletCount} found`, status: "good" as const },
        { label: "Action Verbs", value: data.atsAnalysis.hasActionVerbs ? "Yes" : "No", status: data.atsAnalysis.hasActionVerbs ? "good" as const : "warning" as const },
        { label: "Quantified Results", value: data.atsAnalysis.hasQuantifiedResults ? "Yes" : "No", status: data.atsAnalysis.hasQuantifiedResults ? "good" as const : "warning" as const },
        { label: "Experience Entries", value: `${data.contentAnalysis.experienceCount}`, status: "good" as const },
        { label: "Education Entries", value: `${data.contentAnalysis.educationCount}`, status: "good" as const },
        { label: "Skills Count", value: `${data.contentAnalysis.skillCount}`, status: "good" as const },
      ],
      ats: [
        { label: "Keyword Count", value: `${data.atsAnalysis.keywordCount}`, status: "good" as const },
        { label: "Keyword Density", value: `${data.atsAnalysis.keywordDensity.toFixed(1)}%`, status: "good" as const },
        { label: "Skills Detected", value: `${data.contentAnalysis.skillCount} skills`, status: "good" as const },
        { label: "Job Match", value: jobMatch !== null ? `${jobMatch}%` : "N/A", status: "good" as const },
      ],
      layout: [
        { label: "Tables", value: data.formatAnalysis.hasTables ? "Detected" : "None detected", status: data.formatAnalysis.hasTables ? "warning" as const : "good" as const },
        { label: "Columns", value: data.formatAnalysis.isSingleColumn ? "Single column" : "Multi-column", status: data.formatAnalysis.isSingleColumn ? "good" as const : "warning" as const },
        { label: "Images", value: data.formatAnalysis.hasImages ? "Found" : "None found", status: data.formatAnalysis.hasImages ? "warning" as const : "good" as const },
        { label: "File Size", value: `${(data.size / 1024).toFixed(1)} KB`, status: "good" as const },
      ],
    },
    grammarCheck: data.grammarCheck ? {
      score: data.grammarCheck.score,
      issueCount: data.grammarCheck.issueCount,
      errorCount: data.grammarCheck.errorCount,
      warningCount: data.grammarCheck.warningCount,
      suggestionCount: data.grammarCheck.suggestionCount,
      issues: data.grammarCheck.issues || [],
    } : null,
    keywordSuggestions: data.keywordSuggestions ? {
      missingKeywords: data.keywordSuggestions.missingKeywords || [],
    } : null,
    originalData: data,
  };
};

const Results = () => {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const analysisId = searchParams.get('id');

  useEffect(() => {
    const loadAnalysis = async () => {
      setIsLoading(true);
      try {
        let data: AnalysisResponse;

        // If there's an analysisId in URL, fetch from API
        if (analysisId) {
          const fetchedData = await getAnalysis(analysisId);
          // Transform the fetched data to match our response format
          // If the data is already in the transformed format, use it directly
          if (fetchedData.analysisId) {
            data = fetchedData;
          } else {
            // Otherwise, transform it to match the expected format
            data = {
              message: 'Analysis loaded',
              analysisId: fetchedData._id || analysisId,
              filename: fetchedData.filename,
              originalName: fetchedData.originalName,
              fileType: fetchedData.fileType,
              size: fetchedData.fileSize,
              wordCount: fetchedData.analysisResults?.extractedText?.split(/\s+/).length || 0,
              characterCount: fetchedData.analysisResults?.extractedText?.length || 0,
              isResumeLike: true,
              textPreview: (fetchedData.analysisResults?.extractedText || '').substring(0, 200) + '...',
              metadata: {},
              formatAnalysis: {
                formatScore: fetchedData.analysisResults?.formatScore || 0,
                isSingleColumn: fetchedData.analysisResults?.checks?.structure || true,
                hasImages: false,
                hasTables: false,
                suggestions: fetchedData.analysisResults?.suggestions || []
              },
              contentAnalysis: {
                contentScore: fetchedData.analysisResults?.contentScore || 0,
                hasContact: fetchedData.analysisResults?.checks?.contactInfo || false,
                hasExperience: fetchedData.analysisResults?.checks?.experience || false,
                hasEducation: fetchedData.analysisResults?.checks?.education || false,
                hasSkills: fetchedData.analysisResults?.checks?.skills || false,
                skillCount: fetchedData.analysisResults?.sections?.skills?.length || 0,
                experienceCount: fetchedData.analysisResults?.sections?.experience?.length || 0,
                educationCount: fetchedData.analysisResults?.sections?.education?.length || 0,
                suggestions: fetchedData.analysisResults?.suggestions || []
              },
              atsAnalysis: {
                atsScore: fetchedData.analysisResults?.atsScore || 0,
                keywordCount: 0,
                keywordDensity: 0,
                bulletCount: 0,
                hasActionVerbs: false,
                hasQuantifiedResults: false,
                estimatedPages: 1,
                suggestions: fetchedData.analysisResults?.suggestions || []
              },
              checklistValidation: {
                overallCompliance: fetchedData.analysisResults?.overallScore || 0,
                missingItems: fetchedData.analysisResults?.checks 
                  ? Object.entries(fetchedData.analysisResults.checks)
                      .filter(([_, value]) => !value)
                      .map(([key]) => key)
                  : [],
                suggestions: fetchedData.analysisResults?.suggestions || []
              }
            };
          }
        } else {
          // Otherwise, try to load from sessionStorage
          const storedData = sessionStorage.getItem('analysisData');
          if (!storedData) {
            throw new Error('No analysis data found');
          }
          data = JSON.parse(storedData);
        }

        setAnalysisData(transformAnalysisData(data));
      } catch (error: any) {
        console.error('Failed to load analysis:', error);
        toast.error(error.message || 'Failed to load analysis results');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalysis();
  }, [navigate, analysisId]);


  if (isLoading || !analysisData) {
    return (
      <div className="min-h-screen relative">
        <BackgroundEffects />
        <Navbar />
        <main className="relative z-10 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analysis results...</p>
          </div>
        </main>
      </div>
    );
  }

  const originalData = analysisData.originalData;
  const jobMatchPct = originalData?.atsAnalysis?.jobMatchPercentage ?? 0;
  const hasJobMatch = originalData?.atsAnalysis?.jobMatchPercentage != null;

  const handleExportReport = () => {
    if (!analysisData || !originalData) return;

    const getScoreColor = (score: number) => {
      if (score >= 80) return '#10b981'; // green
      if (score >= 60) return '#f59e0b'; // amber
      return '#ef4444'; // red
    };

    const getScoreLabel = (score: number) => {
      if (score >= 80) return 'Excellent';
      if (score >= 60) return 'Good';
      return 'Needs Improvement';
    };

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Generate HTML report
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume Analysis Report - ${originalData.originalName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #f9fafb;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 40px;
        }
        .header {
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
        }
        .header-main {
            flex: 1;
        }
        .header h1 {
            color: #1e40af;
            font-size: 28px;
            margin-bottom: 10px;
        }
        .header .meta {
            color: #6b7280;
            font-size: 14px;
        }
        .logo {
            text-align: right;
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
        }
        .logo span {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 999px;
            background: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #ec4899 100%);
            color: white;
            font-size: 13px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }
        .score-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .score-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
        }
        .score-card h3 {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .score-value {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .score-label {
            font-size: 14px;
            opacity: 0.9;
        }
        .section {
            margin: 40px 0;
        }
        .section h2 {
            color: #1e40af;
            font-size: 22px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .section-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 999px;
            background: #eff6ff;
            color: #1d4ed8;
            font-size: 14px;
            font-weight: 600;
        }
        .section-title-text {
            flex: 1;
        }
        .suggestion-item {
            background: #f9fafb;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 4px;
        }
        .suggestion-item.error {
            border-left-color: #ef4444;
            background: #fef2f2;
        }
        .suggestion-item.warning {
            border-left-color: #f59e0b;
            background: #fffbeb;
        }
        .suggestion-item.success {
            border-left-color: #10b981;
            background: #f0fdf4;
        }
        .suggestion-title {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 5px;
        }
        .suggestion-desc {
            color: #6b7280;
            font-size: 14px;
        }
        .suggestion-impact {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            margin-top: 8px;
        }
        .impact-high { background: #fee2e2; color: #991b1b; }
        .impact-medium { background: #fef3c7; color: #92400e; }
        .impact-low { background: #e5e7eb; color: #374151; }
        .checklist-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .checklist-item {
            display: flex;
            align-items: center;
            padding: 12px;
            background: #f9fafb;
            border-radius: 8px;
        }
        .checklist-item.complete {
            background: #f0fdf4;
        }
        .checklist-item.incomplete {
            background: #fef2f2;
        }
        .check-icon {
            width: 20px;
            height: 20px;
            margin-right: 10px;
            font-weight: bold;
        }
        .check-icon.complete { color: #10b981; }
        .check-icon.incomplete { color: #ef4444; }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .metric-item {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            border-left: 3px solid #3b82f6;
        }
        .metric-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .metric-value {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-main">
                <h1>Resume Analysis Report</h1>
                <div class="meta">
                    <strong>File:</strong> ${originalData.originalName} | 
                    <strong>Analyzed:</strong> ${formatDate(new Date())} | 
                    <strong>Type:</strong> ${originalData.fileType.toUpperCase()}
                </div>
            </div>
            <div class="logo">
                <span>ResuScore</span>
            </div>
        </div>

        ${hasJobMatch ? `
        <div class="section" style="margin-top: 0;">
            <div class="section-heading">
                <span class="section-number">1</span>
                <span class="section-title-text">Job Description Match</span>
            </div>
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
                <div style="display: flex; align-items: baseline; gap: 10px; margin-bottom: 10px;">
                    <span style="font-size: 48px; font-weight: bold;">${jobMatchPct}%</span>
                    <span style="opacity: 0.9;">match</span>
                </div>
                <div style="height: 8px; background: rgba(255,255,255,0.3); border-radius: 4px; overflow: hidden; margin-top: 10px;">
                    <div style="height: 100%; background: white; width: ${jobMatchPct}%; border-radius: 4px;"></div>
                </div>
                <p style="margin-top: 10px; font-size: 14px; opacity: 0.9;">
                    ${jobMatchPct >= 80 ? 'Excellent match! Your resume aligns well with the job requirements.' : 
                      jobMatchPct >= 60 ? 'Good match. Consider adding more relevant keywords.' : 
                      'Needs improvement. Add more keywords from the job description.'}
                </p>
            </div>
        </div>
        ` : ''}
        
        <div class="section" style="margin-top: 10px;">
            <h2>
                <span class="section-number">1</span>
                <span class="section-title-text">Scores Overview</span>
            </h2>
            <div class="score-section">
            <div class="score-card" style="background: linear-gradient(135deg, ${getScoreColor(analysisData.overallScore)} 0%, ${getScoreColor(analysisData.overallScore)}dd 100%);">
                <h3>Overall Score</h3>
                <div class="score-value">${analysisData.overallScore}%</div>
                <div class="score-label">${getScoreLabel(analysisData.overallScore)}</div>
            </div>
            <div class="score-card">
                <h3>Format Score</h3>
                <div class="score-value">${analysisData.scores.format.score}%</div>
                <div class="score-label">${analysisData.scores.format.description}</div>
            </div>
            <div class="score-card">
                <h3>Content Score</h3>
                <div class="score-value">${analysisData.scores.content.score}%</div>
                <div class="score-label">${analysisData.scores.content.description}</div>
            </div>
            <div class="score-card">
                <h3>ATS Score</h3>
                <div class="score-value">${analysisData.scores.ats.score}%</div>
                <div class="score-label">${analysisData.scores.ats.description}</div>
            </div>
            </div>
        </div>

        <div class="section">
            <h2>
                <span class="section-number">2</span>
                <span class="section-title-text">Improvement Suggestions</span>
            </h2>
            ${analysisData.suggestions.map(s => `
                <div class="suggestion-item ${s.type}">
                    <div class="suggestion-title">${s.title}</div>
                    <div class="suggestion-desc">${s.description}</div>
                    <span class="suggestion-impact impact-${s.impact}">${s.impact} Impact</span>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>
                <span class="section-number">3</span>
                <span class="section-title-text">Resume Checklist</span>
            </h2>
            <div class="checklist-grid">
                ${analysisData.checklist.map(item => `
                    <div class="checklist-item ${item.isComplete ? 'complete' : 'incomplete'}">
                        <span class="check-icon ${item.isComplete ? 'complete' : 'incomplete'}">
                            ${item.isComplete ? '✓' : '✗'}
                        </span>
                        <span>${item.label}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>
                <span class="section-number">4</span>
                <span class="section-title-text">Detailed Metrics</span>
            </h2>
            <h3 style="margin-top: 20px; margin-bottom: 15px; color: #4b5563;">Format Analysis</h3>
            <div class="metrics-grid">
                ${analysisData.metrics.format.map(m => `
                    <div class="metric-item">
                        <div class="metric-label">${m.label}</div>
                        <div class="metric-value">${m.value}</div>
                    </div>
                `).join('')}
            </div>
            
            <h3 style="margin-top: 30px; margin-bottom: 15px; color: #4b5563;">Content Quality</h3>
            <div class="metrics-grid">
                ${analysisData.metrics.content.map(m => `
                    <div class="metric-item">
                        <div class="metric-label">${m.label}</div>
                        <div class="metric-value">${m.value}</div>
                    </div>
                `).join('')}
            </div>
            
            <h3 style="margin-top: 30px; margin-bottom: 15px; color: #4b5563;">ATS Compatibility</h3>
            <div class="metrics-grid">
                ${analysisData.metrics.ats.map(m => `
                    <div class="metric-item">
                        <div class="metric-label">${m.label}</div>
                        <div class="metric-value">${m.value}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        ${analysisData.grammarCheck && analysisData.grammarCheck.issueCount > 0 ? `
        <div class="section">
            <h2>
                <span class="section-number">5</span>
                <span class="section-title-text">Grammar & Spelling Check</span>
            </h2>
            <div style="background: ${getScoreColor(analysisData.grammarCheck.score)}15; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${getScoreColor(analysisData.grammarCheck.score)};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <h3 style="margin: 0; color: ${getScoreColor(analysisData.grammarCheck.score)};">Grammar Score: ${analysisData.grammarCheck.score}%</h3>
                        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${analysisData.grammarCheck.issueCount} issue${analysisData.grammarCheck.issueCount !== 1 ? 's' : ''} found</p>
                    </div>
                    <div style="display: flex; gap: 15px;">
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #ef4444;">${analysisData.grammarCheck.errorCount}</div>
                            <div style="font-size: 12px; color: #6b7280;">Errors</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${analysisData.grammarCheck.warningCount}</div>
                            <div style="font-size: 12px; color: #6b7280;">Warnings</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${analysisData.grammarCheck.suggestionCount}</div>
                            <div style="font-size: 12px; color: #6b7280;">Suggestions</div>
                        </div>
                    </div>
                </div>
            </div>
            ${analysisData.grammarCheck.issues && analysisData.grammarCheck.issues.length > 0 ? `
            <h3 style="margin-top: 20px; margin-bottom: 15px; color: #4b5563;">Issues Found</h3>
            ${analysisData.grammarCheck.issues.slice(0, 10).map((issue: any) => `
                <div class="suggestion-item ${issue.severity}" style="margin-bottom: 15px;">
                    <div class="suggestion-title">
                        <span style="display: inline-block; padding: 2px 8px; background: ${issue.severity === 'error' ? '#fee2e2' : issue.severity === 'warning' ? '#fef3c7' : '#e0e7ff'}; color: ${issue.severity === 'error' ? '#991b1b' : issue.severity === 'warning' ? '#92400e' : '#3730a3'}; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-right: 8px;">${issue.type}</span>
                        ${issue.text.substring(0, 80)}${issue.text.length > 80 ? '...' : ''}
                    </div>
                    <div class="suggestion-desc">${issue.reason}</div>
                    ${issue.suggestion ? `<div style="margin-top: 8px; padding: 8px; background: #f0f9ff; border-left: 3px solid #3b82f6; border-radius: 4px; font-size: 13px; color: #1e40af;"><strong>💡 Suggestion:</strong> ${issue.suggestion}</div>` : ''}
                </div>
            `).join('')}
            ` : ''}
        </div>
        ` : ''}

        ${analysisData.keywordSuggestions && analysisData.keywordSuggestions.missingKeywords.length > 0 ? `
        <div class="section">
            <h2>
                <span class="section-number">6</span>
                <span class="section-title-text">Keyword Suggestions</span>
            </h2>
            <p style="color: #6b7280; margin-bottom: 20px;">Add these keywords to improve your ATS match score and increase your chances of passing through applicant tracking systems.</p>
            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
                ${analysisData.keywordSuggestions.missingKeywords.slice(0, 20).map((keyword: string) => `
                    <span style="display: inline-block; padding: 6px 12px; background: #e0e7ff; color: #3730a3; border-radius: 20px; font-size: 13px; font-weight: 500;">${keyword}</span>
                `).join('')}
            </div>
            <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>💡 Tip:</strong> Integrate these keywords naturally into your resume, especially in your skills section and experience descriptions. Don't just list them—show how you've used them.
                </p>
            </div>
        </div>
        ` : ''}

        <div class="footer">
            <p>Generated by ResuScore - Resume Analysis Tool</p>
            <p>This report provides actionable insights to improve your resume's ATS compatibility and overall quality.</p>
            <p style="margin-top: 10px; font-size: 12px; color: #9ca3af;">You can print this report to PDF using your browser's print function (Ctrl+P / Cmd+P)</p>
        </div>
    </div>
</body>
</html>`;

    // Create and download HTML file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-analysis-${originalData.originalName.replace(/\.[^/.]+$/, '')}-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('HTML report exported successfully! You can print it to PDF if needed.');
  };

  return (
    <div className="min-h-screen relative">
      <BackgroundEffects />
      <Navbar />
      
      <main className="relative z-10 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <Link 
                to="/"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Upload</span>
              </Link>
              <motion.h1
                className="font-display text-3xl md:text-4xl font-bold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Analysis Results
              </motion.h1>
              <motion.p
                className="text-muted-foreground mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {originalData.originalName} • {originalData.fileType.toUpperCase()} • Analyzed just now
              </motion.p>
            </div>

            <motion.div
              className="flex flex-col sm:flex-row justify-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button 
                variant="outline" 
                className="glass-hover w-full sm:w-auto"
                onClick={handleExportReport}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button asChild className="w-full sm:w-auto">
                <Link to="/" className="flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Analyze New
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Main Score Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Overall Score */}
            <GlassCard className="lg:row-span-2 flex flex-col items-center justify-center py-12">
              <ScoreGauge 
                score={analysisData.overallScore} 
                size="xl"
                label="Overall Score"
              />
              <motion.p
                className="mt-6 text-center text-muted-foreground max-w-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                Your resume is performing well but has room for improvement in key areas.
              </motion.p>
            </GlassCard>

            {/* Sub Scores */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <ScoreCard
                title="Format"
                score={analysisData.scores.format.score}
                icon={Layout}
                description={analysisData.scores.format.description}
                delay={0.1}
              />
              <ScoreCard
                title="Content"
                score={analysisData.scores.content.score}
                icon={Type}
                description={analysisData.scores.content.description}
                delay={0.2}
              />
              <ScoreCard
                title="ATS"
                score={analysisData.scores.ats.score}
                icon={Search}
                description={analysisData.scores.ats.description}
                delay={0.3}
              />
              <ScoreCard
                title="Checklist"
                score={analysisData.scores.checklist.score}
                icon={CheckSquare}
                description={analysisData.scores.checklist.description}
                delay={0.4}
              />
            </div>
          </div>

          {/* Job Match Section - Prominent Display */}
          {hasJobMatch && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <GlassCard className="p-6 border-2 border-primary/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <Briefcase className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold">Job Description Match</h2>
                    <p className="text-sm text-muted-foreground">
                      How well your resume matches the job requirements
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-bold text-primary">
                        {jobMatchPct}%
                      </span>
                      <span className="text-muted-foreground">match</span>
                    </div>
                    <div className="h-3 bg-secondary/50 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${jobMatchPct}%` }}
                        transition={{ duration: 1, delay: 0.6 }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    {jobMatchPct >= 80 && (
                      <div className="text-score-excellent font-semibold">Excellent Match!</div>
                    )}
                    {jobMatchPct >= 60 && jobMatchPct < 80 && (
                      <div className="text-warning font-semibold">Good Match</div>
                    )}
                    {jobMatchPct < 60 && (
                      <div className="text-destructive font-semibold">Needs Improvement</div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Detailed Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Suggestions */}
            <SuggestionList suggestions={analysisData.suggestions} />
            
            {/* Checklist */}
            <ChecklistSection items={analysisData.checklist} />
          </div>

          {/* Grammar Check Section */}
          {analysisData.grammarCheck && analysisData.grammarCheck.issueCount > 0 && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
                    <AlertCircle className="w-6 h-6 text-warning" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-2xl font-bold">Grammar & Spelling Check</h2>
                    <p className="text-sm text-muted-foreground">
                      {analysisData.grammarCheck.issueCount} issue{analysisData.grammarCheck.issueCount !== 1 ? 's' : ''} found
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{
                      color: analysisData.grammarCheck.score >= 80 ? '#10b981' : 
                             analysisData.grammarCheck.score >= 60 ? '#f59e0b' : '#ef4444'
                    }}>
                      {analysisData.grammarCheck.score}%
                    </div>
                    <div className="text-xs text-muted-foreground">Grammar Score</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="text-xl font-bold text-destructive">{analysisData.grammarCheck.errorCount}</div>
                    <div className="text-xs text-muted-foreground">Errors</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <div className="text-xl font-bold text-warning">{analysisData.grammarCheck.warningCount}</div>
                    <div className="text-xs text-muted-foreground">Warnings</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="text-xl font-bold text-primary">{analysisData.grammarCheck.suggestionCount}</div>
                    <div className="text-xs text-muted-foreground">Suggestions</div>
                  </div>
                </div>

                {analysisData.grammarCheck.issues.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {analysisData.grammarCheck.issues.slice(0, 5).map((issue: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border-l-4 ${
                          issue.severity === 'error' ? 'bg-destructive/5 border-destructive' :
                          issue.severity === 'warning' ? 'bg-warning/5 border-warning' :
                          'bg-primary/5 border-primary'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            issue.severity === 'error' ? 'bg-destructive/20 text-destructive' :
                            issue.severity === 'warning' ? 'bg-warning/20 text-warning' :
                            'bg-primary/20 text-primary'
                          }`}>
                            {issue.type}
                          </span>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{issue.text.substring(0, 50)}...</div>
                            <div className="text-xs text-muted-foreground mt-1">{issue.reason}</div>
                            {issue.suggestion && (
                              <div className="text-xs text-primary mt-1">
                                💡 {issue.suggestion}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}

          {/* Keyword Suggestions Section */}
          {analysisData.keywordSuggestions && analysisData.keywordSuggestions.missingKeywords.length > 0 && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold">Keyword Suggestions</h2>
                    <p className="text-sm text-muted-foreground">
                      Add these keywords to improve your ATS match score
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {analysisData.keywordSuggestions.missingKeywords.slice(0, 15).map((keyword: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                      title="Click to copy"
                      onClick={() => {
                        navigator.clipboard.writeText(keyword);
                        toast.success(`Copied "${keyword}" to clipboard`);
                      }}
                    >
                      {keyword}
                    </span>
                  ))}
                </div>

                <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-muted">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      <strong>Tip:</strong> Integrate these keywords naturally into your resume, especially in your skills section and experience descriptions. 
                      Don't just list them—show how you've used them.
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Metrics Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="font-display text-2xl font-bold mb-6">Detailed Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard
                title="Format Analysis"
                icon={FileText}
                details={analysisData.metrics.format}
                delay={0.1}
              />
              <MetricCard
                title="Content Quality"
                icon={Type}
                details={analysisData.metrics.content}
                delay={0.2}
              />
              <MetricCard
                title="ATS Compatibility"
                icon={Search}
                details={analysisData.metrics.ats}
                delay={0.3}
              />
              <MetricCard
                title="Layout & Structure"
                icon={Table}
                details={analysisData.metrics.layout}
                delay={0.4}
              />
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
};

export default Results;
