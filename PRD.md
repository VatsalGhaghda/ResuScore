# Project Requirements Document (PRD)

## Project Overview
ResuScore is an ATS-friendly resume checker that analyzes PDF and DOCX resumes for format quality, content completeness, and ATS (Applicant Tracking System) compatibility. It produces a clear overall score and sub-scores, actionable improvement suggestions, a detailed checklist, keyword insights, AI-powered narrative feedback, and a per-browser history of previous analyses — all without requiring a user account.

**Developed by**: Vatsal Ghaghda

## Problem Statement
Job seekers spend hours polishing their resumes without knowing whether they will pass ATS filters used by recruiters. Most professional ATS checkers are expensive, subscription-locked, or limited to a single job-description match. There is no free, self-hostable, full-stack tool that combines format, content, and ATS scoring with AI-generated insights and a persistent analysis history in a single open-source application.

## Goals
- Provide instant, multi-dimensional resume scoring (Format, Content, ATS, Checklist) from a single file upload.
- Surface actionable, deduplicated suggestions so users know exactly what to fix.
- Offer AI-powered narrative analysis (via Groq LLM) as an upgrade over purely rule-based feedback.
- Store analysis history per browser so users can track improvement over time without signing up.

## Business Objectives
- Build a complete MVP covering file extraction, five independent analysis engines, AI scoring, keyword suggestion, and grammar checking.
- Establish a two-service architecture (React SPA + Express/MongoDB API) that is deployable to free-tier cloud services.
- Serve as a credible open alternative to paid tools like Jobscan and Resume Worded.

## Target Users
- **Job Seekers**: Recent graduates and career switchers preparing resumes for competitive roles.
- **Career Coaches**: Professionals who review and critique resumes for clients and need a quick objective score.
- **Developers**: Engineers who want a self-hostable resume analysis tool or want to study the scoring pipeline.

## User Personas
- **Zara the Graduate**: Applying for her first job and unsure if her resume will pass ATS filters at large companies. She needs a free, clear score and a list of things to fix.
- **Carlos the Career Coach**: Reviews 10+ resumes per week and wants a quick ATS health check to supplement his qualitative feedback.
- **Dev the Developer**: Wants to run a self-hosted resume checker for an internal HR prototype and needs a well-documented REST API.

## User Stories
- As a user, I want to upload my PDF or DOCX resume and receive an instant overall ATS score.
- As a user, I want to see separate Format, Content, and ATS sub-scores so I know which dimension needs the most work.
- As a user, I want a consolidated checklist of key resume items (contact info, experience, education, skills, etc.) so I can see what is present and what is missing.
- As a user, I want a list of actionable, non-duplicated suggestions telling me exactly what to improve.
- As a user, I want to see keyword density and top keywords detected in my resume.
- As a user, I want AI-generated narrative insights about my resume beyond rule-based checks.
- As a user, I want to view my analysis history so I can track improvement across multiple uploads.
- As a user, I want to click a history entry and see the full analysis exactly as it appeared originally.
- As a user, I want my history to be private to my browser without needing to log in.

## Functional Requirements

### File Processing (COMPLETE)
- **Resume Upload** (`POST /api/upload`): Accepts PDF and DOCX files up to 10 MB via `multipart/form-data` with field name `resume`.
- **Text Extraction**: `fileProcessor.ts` extracts plain text from PDF (`pdf-parse`) and DOCX (`mammoth`); file is deleted from disk after processing.
- Anonymous `clientId` is read from the `X-Client-Id` request header and stored with each analysis for per-browser history scoping.

### Analysis Pipeline (COMPLETE)
Five independent analyzers run sequentially on the extracted resume text:

- **Format Analysis** (`formatAnalyzer.ts`): Detects single/multi-column layout, images, tables, headers/footers, and font consistency. Produces a `formatScore` via deduction from 100.
- **Content Analysis** (`contentAnalyzer.ts`): Detects presence and quality of Contact, Experience, Education, and Skills sections; validates date formats, experience/education entry count, and skills list format. Produces a `contentScore`.
- **ATS Analysis** (`atsAnalyzer.ts`): Scores keyword presence and density (30%), bullet point style (25%), resume length (20%), and quantified achievements (25%). Produces an `atsScore`. Includes an optional job description matching path.
- **Checklist Validation** (`checklistValidator.ts`): Validates 50+ checklist items across contact info, work experience, education, skills, layout, action verbs, and quantified results. Produces a `checklistScore` and a per-item compliance list.
- **Grammar Check** (`grammarChecker.ts`): Detects spelling and grammar issues using the `natural` NLP library; flags issues with line-level context.

### Scoring (COMPLETE)
- **Overall Score** is a weighted combination: Format 20% + Content 30% + ATS 30% + Checklist 20%.
- All scores are integers from 0 to 100.
- A full `AnalysisResponse` payload (scores, suggestions, checklist, metrics, grammar results) is stored in MongoDB as `fullResponse` alongside a compact `analysisResults` summary.

### AI Analysis (COMPLETE)
- **AI Analyzer** (`aiAnalyzer.ts`): Sends extracted resume text to the Groq LLM API (model: `llama3-70b-8192` or equivalent) and returns structured AI insights covering overall impression, strengths, weaknesses, and recommendations.
- **AI Route** (`POST /api/ai/analyze`): Accepts `{ text, mode }` and returns AI-generated analysis.
- Mode switching between heuristic-only and AI-augmented scoring.

### Keyword Suggestion (COMPLETE)
- **Keyword Suggester** (`keywordSuggester.ts`): Analyzes resume text to extract top keywords, calculate keyword density, and suggest missing high-value keywords for common tech and professional roles.
- **Keywords Route** (`POST /api/keywords/suggest`): Returns keyword analysis for a given resume text.

### History & Retrieval (COMPLETE)
- **History** (`GET /api/analysis`): Returns the 50 most recent analyses matching the requesting `clientId`; returns compact `analysisResults` summary only.
- **Single Analysis** (`GET /api/analysis/:id`): Returns the full stored `fullResponse` for a given analysis ID, scoped by `clientId`.
- **Benchmark** (`GET /api/analysis/:id/benchmark`): Compares scores against industry benchmark values from `atsBenchmark.ts` (Format avg 85, Content avg 80, ATS avg 75, Overall avg 78).

### Frontend Pages (COMPLETE)
- **Upload Page** (`/`): `UploadZone` component with drag-and-drop and click-to-browse; Framer Motion animations; feature cards highlighting key capabilities.
- **Results Page** (`/results`): Displays overall score gauge, Format/Content/ATS/Checklist sub-score cards, `SuggestionList`, `ChecklistSection`, `MetricCard` blocks (word count, bullet points, page count, keyword density), `GrammarCheckResults`, and `AIInsightsCard`.
- **History Page** (`/history`): Lists previous analysis cards with scores and quick checklist summary; click-through to `/results?id=<analysisId>` for full detail view.

## Non-Functional Requirements
- **Performance**: Text extraction and full 5-engine analysis pipeline completes in under 3 seconds for typical resumes.
- **Security**: Files are deleted from disk immediately after text extraction. `clientId` header scopes history access without authentication. CORS restricted to configured origins.
- **Usability**: Framer Motion animated loading screen during analysis; responsive dark-mode UI; clear per-error messages for wrong file type, oversized files, and missing fields.
- **Reliability**: MongoDB connection failure is non-fatal — the server starts and serves requests without a DB; analyses requiring storage return a graceful error.
- **Privacy**: No user accounts. History is browser-scoped via an anonymous `clientId` stored in `localStorage`. Clearing `localStorage` resets history.

## Core Features
- **5-engine analysis pipeline**: Format, Content, ATS, Checklist, Grammar.
- **AI-powered insights** via Groq LLM (optional, configurable).
- **Keyword suggester** with density analysis and missing-keyword recommendations.
- **Industry benchmark comparison** against real ATS platform averages.
- **Per-browser history** without authentication, scoped by anonymous `clientId`.
- **Full response replay**: stored `fullResponse` enables exact recreation of any historical results view.

## Future Features
- **Job Description Matching**: Prominent UI for JD input; detailed keyword match percentage and skill gap analysis.
- **PDF Export** of the analysis report (via Puppeteer or jsPDF).
- **ATS Parsing Simulation**: Compatibility checks for specific ATS systems (Taleo, Workday, Greenhouse).
- **Shareable report links** for coaches to share results with clients.
- **Resume version comparison**: side-by-side score diff across multiple uploads.
- **Email report delivery**.
- **ATS weight re-calibration**: increase ATS weight to 45% to match industry standard.

## Out of Scope (for MVP)
- User authentication and persistent accounts.
- Real-time collaboration or shared workspaces.
- Resume builder or template generator.
- Grammar check via external paid API (uses `natural` NLP library in MVP).

## Success Metrics
- Full analysis pipeline returns results in under 3 seconds for a typical 1–2 page resume.
- History correctly scopes entries per browser; switching browsers shows no cross-contamination.
- AI analysis route returns structured Groq response within 5 seconds.
- Benchmark route returns calibrated comparison against industry averages (Format 85, Content 80, ATS 75, Overall 78).

## Assumptions
- Users upload standard PDF or DOCX resumes (not scanned images or password-protected files).
- A MongoDB instance (Atlas or local) is available for history persistence.
- Groq API credentials are optional; the app functions fully with heuristic-only mode when no API key is set.

## Constraints
- Maximum file size is 10 MB per upload.
- Supported formats are PDF and DOCX only.
- History is limited to the 50 most recent analyses per `clientId`.
- Groq LLM calls are subject to Groq API rate limits and may incur costs at scale.

## Risks
- **LLM Latency**: Groq API calls may be slow under load. (Mitigated by making AI analysis a separate optional route, not blocking the main upload response.)
- **Privacy**: Anonymous `clientId` is not cryptographically secure — anyone who obtains a `clientId` can read that user's history. (Acceptable for MVP; user authentication planned for v2.)
- **Scoring Drift**: Rule-based scoring weights (Format 20%, Content 30%, ATS 30%, Checklist 20%) differ from industry standard (ATS 45%). (Documented in `ATS_COMPARISON_REPORT.md`; re-calibration planned.)

## Acceptance Criteria
- A user can upload a PDF resume and receive an overall score, sub-scores, checklist, and suggestions within 3 seconds.
- Uploading a non-PDF/DOCX file returns a `400` error with a clear message.
- Uploading a file over 10 MB returns a `400` error.
- The History page shows only entries uploaded from the same browser.
- Clicking a history card navigates to the Results page and shows the exact same scores and suggestions as when the analysis was first run.
- When `GROQ_API_KEY` is set, the AI Insights card on the Results page renders with structured LLM feedback.
