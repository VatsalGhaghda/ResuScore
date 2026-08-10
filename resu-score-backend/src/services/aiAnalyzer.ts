/**
 * AI Resume Analyzer � powered by Groq (llama-3.3-70b-versatile)
 *
 * NEW ARCHITECTURE (v2):
 *   analyzeWithAI() returns a FULL analysis � all sub-scores, suggestions,
 *   and checklist � not just enrichment insights. When AI succeeds, its output
 *   replaces heuristic scores entirely. Heuristics remain as fallback only.
 */

import Groq from 'groq-sdk';

// --- Types --------------------------------------------------------------------

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

export interface AIFullAnalysis {
  overallScore: number;
  formatScore: number;
  contentScore: number;
  atsScore: number;
  checklistScore: number;
  rolePrediction: string;
  industryPrediction: string;
  strengths: string[];
  criticalIssues: string[];
  tailoredAdvice: string;
  suggestions: AISuggestion[];
  checklist: AIChecklistItem[];
  rewriteSuggestions: Array<{ original: string; improved: string }>;
}

export interface HeuristicContext {
  formatScore: number;
  contentScore: number;
  atsScore: number;
  checklistScore: number;
  heuristicOverallScore: number;
}

// --- System Prompt ------------------------------------------------------------

const SYSTEM_PROMPT = `You are a senior technical recruiter and ATS expert with 15+ years of experience at top companies like Google, Microsoft, and McKinsey. You have reviewed tens of thousands of resumes.

Your job is to score and analyze a resume with STRICT, HONEST, PROFESSIONAL standards.

## SCORING CALIBRATION (follow exactly):
- 0-30: Severely incomplete (missing major sections, unreadable)
- 30-50: Poor (major structural, content, or ATS issues)
- 50-65: Average (has basics but needs significant improvement)
- 65-75: Good (solid with some gaps, typical for competitive candidates)
- 75-85: Strong (well-structured, good content, mostly ATS-optimized)
- 85-95: Excellent (nearly perfect, very few issues)
- 95-100: Exceptional (extremely rare)

A typical working professional scores 55-70. Only genuinely outstanding resumes score above 80. BE STRICT.

## SUB-SCORE CALIBRATION:
- formatScore: Penalize multi-column layouts, photos, tables in skills/experience, inconsistent spacing, no section hierarchy
- contentScore: Penalize vague bullets ("responsible for"), no quantification, generic skills, missing summary, education missing graduation year
- atsScore: Penalize low keyword density, no action verbs, passive voice, no quantified achievements, spelling errors, non-standard section names
- checklistScore: Fraction of the 18 checklist items that pass (0-100)

## OUTPUT FORMAT:
Return ONLY a single valid JSON object with no markdown fences.

{
  "overallScore": <integer 0-100>,
  "formatScore": <integer 0-100>,
  "contentScore": <integer 0-100>,
  "atsScore": <integer 0-100>,
  "checklistScore": <integer 0-100>,
  "rolePrediction": "<most likely target job title>",
  "industryPrediction": "<most likely industry>",
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "criticalIssues": ["<critical issue 1>", "<critical issue 2>", "<critical issue 3>"],
  "tailoredAdvice": "<2-3 sentence highly specific actionable advice referencing actual role and content>",
  "suggestions": [
    {
      "type": "error",
      "title": "<short title>",
      "description": "<specific actionable description referencing actual resume content>",
      "impact": "high",
      "category": "format"
    }
  ],
  "checklist": [
    { "item": "Professional email address", "passed": true },
    { "item": "Phone number present", "passed": true },
    { "item": "LinkedIn URL", "passed": false, "reason": "No LinkedIn URL found" },
    { "item": "Single-column layout", "passed": true },
    { "item": "No photos or graphics", "passed": true },
    { "item": "No tables in skills/experience", "passed": true },
    { "item": "Standard section headings", "passed": true },
    { "item": "Work experience with job titles, companies, dates", "passed": true },
    { "item": "Education with degree, institution, graduation year", "passed": true },
    { "item": "Skills section present", "passed": true },
    { "item": "Action verbs used in bullet points", "passed": false, "reason": "Many bullets use passive/weak language" },
    { "item": "Quantified achievements (numbers, %, $)", "passed": false, "reason": "No metrics found in experience section" },
    { "item": "Consistent date format", "passed": true },
    { "item": "Resume length 1-2 pages", "passed": true },
    { "item": "Professional summary or objective", "passed": true },
    { "item": "No first-person pronouns (I, me, my)", "passed": true },
    { "item": "ATS-friendly file format (PDF/DOCX)", "passed": true },
    { "item": "Professional filename", "passed": true }
  ],
  "rewriteSuggestions": [
    { "original": "<exact weak bullet from resume>", "improved": "<improved version starting with strong action verb>" },
    { "original": "<another weak bullet>", "improved": "<improved version>" }
  ]
}

RULES:
- suggestions: 5-8 specific items. Prioritize high-impact. Each description must reference actual resume content.
- checklist: Always include ALL 18 items. Evaluate each one based on what you actually see in the resume.
- strengths/criticalIssues: Specific to THIS resume. No generic tips.
- overallScore: Your holistic professional judgement, NOT an average of sub-scores.
- Return ONLY the JSON. No extra text before or after.`;

// --- Groq Client -------------------------------------------------------------

let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === '') return null;
  if (!groqClient) {
    groqClient = new Groq({ apiKey: apiKey.trim() });
  }
  return groqClient;
}

// --- Validators ---------------------------------------------------------------

function clampScore(val: unknown): number {
  return Math.max(0, Math.min(100, Math.round(Number(val) || 0)));
}

function ensureStringArray(val: unknown, maxLen = 4): string[] {
  if (!Array.isArray(val)) return [];
  return val.slice(0, maxLen).map(String);
}

function validateSuggestions(raw: unknown): AISuggestion[] {
  if (!Array.isArray(raw)) return [];
  const VALID_TYPES = new Set(['error', 'warning', 'info']);
  const VALID_IMPACTS = new Set(['high', 'medium', 'low']);
  const VALID_CATS = new Set(['format', 'content', 'ats', 'grammar']);
  return raw.slice(0, 10).map((s: Record<string, unknown>) => ({
    type: (VALID_TYPES.has(s?.type as string) ? s.type : 'info') as AISuggestion['type'],
    title: String(s?.title || 'Suggestion'),
    description: String(s?.description || ''),
    impact: (VALID_IMPACTS.has(s?.impact as string) ? s.impact : 'medium') as AISuggestion['impact'],
    category: (VALID_CATS.has(s?.category as string) ? s.category : 'content') as AISuggestion['category'],
  }));
}

function validateChecklist(raw: unknown): AIChecklistItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 25).map((c: Record<string, unknown>) => ({
    item: String(c?.item || ''),
    passed: Boolean(c?.passed),
    reason: c?.reason ? String(c.reason) : undefined,
  }));
}

// --- Main Export -------------------------------------------------------------

export async function analyzeWithAI(
  resumeText: string,
  heuristicContext: HeuristicContext
): Promise<AIFullAnalysis | null> {
  const client = getGroqClient();
  if (!client) {
    console.log('INFO: GROQ_API_KEY not set  skipping AI analysis, using heuristic scores');
    return null;
  }

  const truncatedText = resumeText.length > 24000
    ? resumeText.substring(0, 24000) + '\n[... resume truncated for length ...]'
    : resumeText;

  const userPrompt = `HEURISTIC CONTEXT (rule-based estimates � use only as rough calibration reference, do NOT copy these scores. Your scores should be STRICTER):
- Heuristic Format Score: ${heuristicContext.formatScore}/100
- Heuristic Content Score: ${heuristicContext.contentScore}/100
- Heuristic ATS Score: ${heuristicContext.atsScore}/100
- Heuristic Checklist Score: ${heuristicContext.checklistScore}/100
- Heuristic Overall: ${heuristicContext.heuristicOverallScore}/100

Note: Heuristic scores are often INFLATED because they can only detect positive signals, not weaknesses. Apply strict calibration.

RESUME TEXT:
${truncatedText}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 2000,
    });

    clearTimeout(timeout);

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('Groq returned empty content');
      return null;
    }

    const parsed = JSON.parse(content) as Record<string, unknown>;

    const result: AIFullAnalysis = {
      overallScore: clampScore(parsed.overallScore),
      formatScore: clampScore(parsed.formatScore),
      contentScore: clampScore(parsed.contentScore),
      atsScore: clampScore(parsed.atsScore),
      checklistScore: clampScore(parsed.checklistScore),
      rolePrediction: String(parsed.rolePrediction || 'Not determined'),
      industryPrediction: String(parsed.industryPrediction || 'Not determined'),
      strengths: ensureStringArray(parsed.strengths),
      criticalIssues: ensureStringArray(parsed.criticalIssues),
      tailoredAdvice: String(parsed.tailoredAdvice || ''),
      suggestions: validateSuggestions(parsed.suggestions),
      checklist: validateChecklist(parsed.checklist),
      rewriteSuggestions: Array.isArray(parsed.rewriteSuggestions)
        ? parsed.rewriteSuggestions.slice(0, 3).map((s: Record<string, unknown>) => ({
            original: String(s?.original || ''),
            improved: String(s?.improved || ''),
          }))
        : [],
    };

    console.log(
      `AI scoring complete � Overall: ${result.overallScore} | Format: ${result.formatScore} | Content: ${result.contentScore} | ATS: ${result.atsScore} | Checklist: ${result.checklistScore}`
    );

    return result;
  } catch (error: unknown) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Groq AI call timed out (30s) � falling back to heuristics');
    } else {
      console.error('Groq AI analysis failed:', error instanceof Error ? error.message : error);
    }
    return null;
  }
}

// --- On-Demand Bullet Rewrite -------------------------------------------------

export async function rewriteBulletWithAI(
  text: string,
  jobTitle?: string
): Promise<{ original: string; improved: string; explanation: string } | null> {
  const client = getGroqClient();
  if (!client) return null;

  const systemPrompt = `You are an expert resume writer. Rewrite the given resume bullet point to be more impactful.
Return ONLY a JSON object: { "improved": "...", "explanation": "..." }
Rules:
- Start with a strong action verb (Developed, Reduced, Increased, Designed, etc.)
- Be specific and concise (1-2 lines max)
- Add a quantification placeholder like [X%] or [N users] if implied but not stated
- Do NOT fabricate specific numbers not implied in the original
- explanation: 1 sentence explaining what you changed and why`;

  const userPrompt = jobTitle
    ? `Target Job Title: ${jobTitle}\n\nBullet to rewrite: "${text}"`
    : `Bullet to rewrite: "${text}"`;

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as Record<string, unknown>;
    return {
      original: text,
      improved: String(parsed.improved || ''),
      explanation: String(parsed.explanation || ''),
    };
  } catch (error) {
    console.error('Groq bullet rewrite failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

// --- Document Validation ---------------------------------------------------

export interface DocumentValidationResult {
  isValid: boolean;           // true = resume or portfolio
  documentType: string;       // e.g. "resume", "portfolio", "invoice", "academic paper"
  reason: string;             // human-readable explanation shown to user
  confidence: 'high' | 'medium' | 'low';
  source: 'ai' | 'heuristic'; // which engine made the decision
}

/**
 * Uses Groq to determine if the uploaded document is a resume or portfolio.
 * Fast prompt (10s timeout, low max_tokens) — designed to run BEFORE full analysis.
 * Returns null if Groq is unavailable (caller should fall back to heuristic).
 */
export async function validateDocumentWithAI(
  text: string
): Promise<DocumentValidationResult | null> {
  const client = getGroqClient();
  if (!client) return null;

  // Only send the first ~3000 chars — enough to identify the document type
  const preview = text.length > 3000
    ? text.substring(0, 3000) + '\n[... truncated ...]'
    : text;

  const systemPrompt = `You are a document classification expert. Your only job is to determine whether the given document text is a RESUME or PORTFOLIO.

A RESUME or PORTFOLIO includes: work experience, education, skills, projects, contact info, personal statement/summary, certifications.

A PORTFOLIO may have: project descriptions, case studies, screenshots references, design work descriptions, links to work samples — this is VALID.

INVALID documents include: invoices, receipts, academic papers/theses, book chapters, legal documents, terms & conditions, cover letters (standalone), recipes, news articles, etc.

Return ONLY this JSON:
{
  "isValid": true or false,
  "documentType": "<what the document actually is, e.g. resume, portfolio, invoice, academic paper, cover letter>",
  "reason": "<one sentence explaining why it is or is not valid. If invalid, be specific about what type of document it appears to be>",
  "confidence": "high" or "medium" or "low"
}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s — fast check

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Classify this document:\n\n${preview}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 150,
    });

    clearTimeout(timeout);

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as {
      isValid: boolean;
      documentType: string;
      reason: string;
      confidence: string;
    };

    return {
      isValid: Boolean(parsed.isValid),
      documentType: String(parsed.documentType || 'unknown'),
      reason: String(parsed.reason || ''),
      confidence: ['high', 'medium', 'low'].includes(parsed.confidence)
        ? (parsed.confidence as 'high' | 'medium' | 'low')
        : 'medium',
      source: 'ai',
    };
  } catch (error: unknown) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Document validation AI timed out — falling back to heuristic');
    } else {
      console.warn('Document validation AI failed — falling back to heuristic:', error instanceof Error ? error.message : error);
    }
    return null; // caller will use heuristic fallback
  }
}
