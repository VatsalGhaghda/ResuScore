<div align="center">

# ResuScore

### ATS-Friendly Resume Checker & Analyzer

Upload your PDF or DOCX resume and get an instant ATS score, sub-scores, actionable suggestions,
a detailed checklist, keyword insights, and AI-powered narrative feedback — with a full history of past analyses.

**Developed by Vatsal Ghaghda**

[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue?style=flat-square&logo=react)](https://react.dev)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?style=flat-square&logo=nodedotjs)](https://expressjs.com)
[![Database](https://img.shields.io/badge/Database-MongoDB-47A248?style=flat-square&logo=mongodb)](https://mongodb.com)
[![AI](https://img.shields.io/badge/AI-Groq%20LLM-orange?style=flat-square&logo=openai)](https://groq.com)

</div>

---

## Table of Contents

1. [Features](#features)
2. [How It Works](#how-it-works)
3. [Project Structure](#project-structure)
4. [Tech Stack](#tech-stack)
5. [Local Development Setup](#local-development-setup)
6. [Environment Variables](#environment-variables)
7. [Uploading to GitHub](#uploading-to-github)
8. [Deploying the Frontend (Vercel)](#deploying-the-frontend-vercel)
9. [Deploying the Backend (Render)](#deploying-the-backend-render)
10. [Post-Deployment Configuration](#post-deployment-configuration)
11. [API Reference](#api-reference)

---

## Features

### Resume Upload & Parsing
- **PDF and DOCX** support — up to 10 MB per file
- Drag-and-drop upload via **react-dropzone** with animated Framer Motion UI
- Text extracted server-side (`pdf-parse` for PDF, `mammoth` for DOCX); file deleted after processing

### Multi-Dimensional Scoring
- **Overall Score** — weighted combination: Format 20% + Content 30% + ATS 30% + Checklist 20%
- **Format Score** — layout (single/multi-column), images, tables, headers/footers, font consistency
- **Content Score** — sections present (Contact, Experience, Education, Skills), date format, entry counts
- **ATS Score** — keyword density (30%), bullet style (25%), resume length (20%), quantified achievements (25%)
- **Checklist Score** — 50+ checklist items validated across all resume dimensions

### Improvement Suggestions
- Deduplicated suggestions merged from all five analysis engines
- Clear, actionable messages: "Missing skills section", "Inconsistent date formats", "No quantified results found", etc.

### Resume Checklist (9 Key Items)
- Contact Info · Work Experience · Education · Skills · Consistent Layout · No Images/Tables · Action Verbs · Quantified Results · ATS-Friendly Format
- Visual completion percentage and per-item pass/fail indicators

### Keyword Analysis
- Top unique keywords extracted from resume text
- Keyword density score and frequency breakdown
- Missing high-value keyword suggestions via `keywordSuggester.ts`

### AI-Powered Insights
- Groq LLM (Llama 3 70B) generates structured narrative feedback:
  - Overall impression
  - Key strengths
  - Areas for improvement
  - Specific recommendations
- Rendered in the `AIInsightsCard` component on the Results page

### Grammar & Spelling Check
- `natural` NLP library detects spelling and grammar issues
- Issues shown with line-level context in `GrammarCheckResults` component

### Per-Browser History (No Login Required)
- Anonymous `clientId` auto-generated and stored in `localStorage`
- History page shows all previous analyses for the current browser
- Click any history card to replay the full original results view
- History is automatically scoped — switching browsers shows separate histories

### Industry Benchmark Comparison
- Compares your scores against industry-standard averages:
  - Format: 85 · Content: 80 · ATS: 75 · Overall: 78
- Benchmark endpoint available for programmatic comparisons

---

## How It Works

1. **User uploads a resume** on the landing page (`/`).
   - Frontend sends the file to `POST /api/upload` with an `X-Client-Id` header (from `localStorage`).

2. **Backend processes the file**:
   - Extracts text from PDF/DOCX.
   - Runs 5 analyzers: `formatAnalysis` → `contentAnalysis` → `atsAnalysis` → `checklistValidation` → `grammarCheck`.
   - Calculates `overallScore` as a weighted combination of sub-scores.
   - Saves a `ResumeAnalysis` MongoDB document with both a compact `analysisResults` summary and a full `fullResponse` payload.
   - Returns the full `AnalysisResponse` to the frontend.

3. **Results page** (`/results`) displays:
   - Overall score gauge
   - Format / Content / ATS / Checklist sub-score cards
   - Improvement Suggestions (merged and deduplicated)
   - Resume Checklist (9 key items)
   - Detailed Metrics (word count, bullet count, keyword density, page count)
   - Grammar check block
   - AI Insights card (if Groq API key is configured)

4. **History page** (`/history`) calls `GET /api/analysis` with `X-Client-Id` and shows summary cards. Clicking a card navigates to `/results?id=<analysisId>` which fetches and replays the stored `fullResponse`.

---

## Project Structure

```
ResuScore/
├── resu-score-frontend/            # React + Vite SPA (deployed to Vercel)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn/ui + Radix UI primitives
│   │   │   ├── UploadZone.tsx      # Drag-and-drop resume upload
│   │   │   ├── AIInsightsCard.tsx  # Groq LLM analysis display
│   │   │   ├── ChecklistSection.tsx
│   │   │   ├── GrammarCheckResults.tsx
│   │   │   ├── SuggestionList.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── LoadingScreen.tsx   # Framer Motion animated loading
│   │   │   ├── BackgroundEffects.tsx
│   │   │   ├── FeatureCard.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   ├── pages/
│   │   │   ├── Index.tsx           # Upload / landing page
│   │   │   ├── Results.tsx         # Full analysis results view
│   │   │   └── History.tsx         # Per-browser analysis history
│   │   ├── services/
│   │   │   └── api.ts              # REST API client (upload, analysis, history, AI, keywords)
│   │   ├── types/
│   │   │   └── index.ts            # Shared TypeScript types (AnalysisResponse, etc.)
│   │   ├── utils/
│   │   │   └── clientId.ts         # Anonymous clientId generator (localStorage)
│   │   └── App.tsx                 # React Router routes
│   └── package.json
│
├── resu-score-backend/             # Node.js + Express API (deployed to Render)
│   ├── src/
│   │   ├── index.ts                # Express setup, routes, error handling
│   │   ├── config/
│   │   │   └── database.ts         # Mongoose connection helper
│   │   ├── models/
│   │   │   └── ResumeAnalysis.ts   # Mongoose model (clientId, analysisResults, fullResponse)
│   │   ├── routes/
│   │   │   ├── health.ts           # GET /api/health, GET /api/health/db
│   │   │   ├── upload.ts           # POST /api/upload — main analysis pipeline
│   │   │   ├── analysis.ts         # GET /api/analysis, GET /api/analysis/:id, benchmark
│   │   │   ├── keywords.ts         # POST /api/keywords/suggest
│   │   │   └── ai.ts               # POST /api/ai/analyze
│   │   ├── services/
│   │   │   ├── fileProcessor.ts    # PDF/DOCX text extraction
│   │   │   ├── formatAnalyzer.ts   # Format scoring engine
│   │   │   ├── contentAnalyzer.ts  # Content scoring engine
│   │   │   ├── atsAnalyzer.ts      # ATS scoring engine
│   │   │   ├── checklistValidator.ts # 50+ checklist validation
│   │   │   ├── grammarChecker.ts   # NLP grammar/spelling check
│   │   │   ├── aiAnalyzer.ts       # Groq LLM integration
│   │   │   ├── keywordSuggester.ts # Keyword density & suggestions
│   │   │   └── atsBenchmark.ts     # Industry benchmark reference values
│   │   └── utils/                  # File validation, text preprocessing helpers
│   └── package.json
│
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, TypeScript |
| Styling | Tailwind CSS v3 |
| UI Components | shadcn/ui + Radix UI |
| Animations | Framer Motion |
| File Upload | react-dropzone |
| State / Data Fetching | TanStack React Query v5 |
| Icons | Lucide React |
| Theme | next-themes |
| Backend | Node.js 18+, Express 5, TypeScript |
| File Uploads | Multer |
| PDF Parsing | pdf-parse |
| DOCX Parsing | mammoth |
| NLP | natural (grammar/spelling) |
| Database | MongoDB + Mongoose |
| AI / LLM | Groq SDK (Llama 3 70B) |
| Dev Server | nodemon + ts-node |

---

## Local Development Setup

### Prerequisites

Make sure you have the following installed:
- **Node.js** 18+ — https://nodejs.org
- **Git** — https://git-scm.com
- **MongoDB** — a local instance or a free [MongoDB Atlas](https://cloud.mongodb.com) cluster
- **Groq API Key** (optional) — https://console.groq.com — only needed for AI insights

### Step 1 — Clone the repository

```bash
git clone https://github.com/VatsalGhaghda/ResuScore.git
cd ResuScore
```

### Step 2 — Set up the Backend

```bash
cd resu-score-backend
npm install
```

Create a `.env` file inside `resu-score-backend/`:
```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/resuscore
PORT=3001
CORS_ORIGIN=http://localhost:5173
GROQ_API_KEY=your_groq_api_key_here
```

Then start the backend:
```bash
npm run dev
```
Backend API runs at: **http://localhost:3001**

### Step 3 — Set up the Frontend

Open a new terminal:

```bash
cd resu-score-frontend
npm install
```

Create a `.env` (or `.env.local`) file inside `resu-score-frontend/`:
```
VITE_API_BASE_URL=http://localhost:3001/api
```

Then start the frontend:
```bash
npm run dev
```
Frontend runs at: **http://localhost:5173**

### Verify Everything Works

Open http://localhost:5173, drag a PDF resume onto the upload zone, and click **Analyze**. You should see a loading animation followed by the Results page with scores and suggestions. If the Results page loads with data, all services are wired correctly.

---

## Environment Variables

### Frontend (`resu-score-frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL (must include `/api`) | `http://localhost:3001/api` |

> In production (Vercel), set `VITE_API_BASE_URL` to your Render backend URL with `/api` suffix.

### Backend (`resu-score-backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | _(required for history)_ |
| `PORT` | Port for the Express server | `3001` |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins | `http://localhost:5173` |
| `GROQ_API_KEY` | Groq LLM API key for AI analysis | _(optional)_ |

> If `MONGODB_URI` is not set, the server starts without a database. Upload and analysis still work but history is not persisted.
> If `GROQ_API_KEY` is not set, the AI Insights card will not render on the Results page.

---

## Uploading to GitHub

### Step 1 — Create a new GitHub repository

1. Go to https://github.com/new
2. Set the repository name to `ResuScore` (or any name you prefer)
3. Keep it **Public** or **Private** — your choice
4. **Do NOT** initialize with a README, .gitignore, or license (the project already has these)
5. Click **Create repository**

### Step 2 — Initialize Git and push

Open a terminal in the `ResuScore` root folder and run:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create your first commit
git commit -m "Initial commit — ResuScore v0.1"

# Connect to your GitHub repository (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

> If you are prompted for credentials, use your GitHub username and a **Personal Access Token** (not your password).
> Create one at: GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)

### Step 3 — Verify

Visit `https://github.com/YOUR_USERNAME/ResuScore` — you should see all your files uploaded.

---

## Deploying the Frontend (Vercel)

Vercel is the easiest platform for deploying React/Vite apps. Deploy takes ~2 minutes.

### Step 1 — Sign up / Log in

Go to https://vercel.com and sign in with your GitHub account.

### Step 2 — Import the project

1. Click **"Add New"** → **"Project"**
2. Select your `ResuScore` GitHub repository
3. Vercel will detect it is a Vite project automatically

### Step 3 — Configure build settings

| Setting | Value |
|---|---|
| **Framework Preset** | Vite |
| **Root Directory** | `resu-score-frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Step 4 — Add environment variables

In the **Environment Variables** section, add:

| Name | Value |
|---|---|
| `VITE_API_BASE_URL` | Your Render backend URL + `/api` (e.g. `https://resuscore-api.onrender.com/api`) |

> You can add this after deploying the backend — just redeploy the frontend once you have the URL.

### Step 5 — Deploy

Click **Deploy**. Vercel will build and publish your frontend in ~2 minutes.

Your frontend will be live at a URL like: `https://resuscore-xyz.vercel.app`

### Step 6 — Configure SPA routing (if needed)

If you get 404 errors when refreshing non-root pages, create a `resu-score-frontend/public/vercel.json` file:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Then commit and push — Vercel will redeploy automatically.

---

## Deploying the Backend (Render)

### Step 1 — Sign up / Log in

Go to https://render.com and sign in with your GitHub account.

### Step 2 — Create a new Web Service

1. Click **"New"** → **"Web Service"**
2. Connect your `ResuScore` GitHub repository
3. Click **Connect**

### Step 3 — Configure the service

| Setting | Value |
|---|---|
| **Name** | `resuscore-api` |
| **Root Directory** | `resu-score-backend` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (for testing) or Starter (for production) |

### Step 4 — Add environment variables

In the **Environment** tab, add:

| Key | Value |
|---|---|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `PORT` | `3001` |
| `CORS_ORIGIN` | Your Vercel frontend URL (e.g. `https://resuscore.vercel.app`) |
| `GROQ_API_KEY` | Your Groq API key (optional) |

### Step 5 — Deploy

Click **Create Web Service**. Render will build and deploy your backend.

Your backend will be live at: `https://resuscore-api.onrender.com`

Test it by visiting: `https://resuscore-api.onrender.com/api/health`
You should see: `{"status":"OK","timestamp":"..."}`

---

## Post-Deployment Configuration

Once both services are deployed, connect them:

### 1. Update the Frontend's `VITE_API_BASE_URL`
- Go to your project on **Vercel** → Settings → Environment Variables
- Update `VITE_API_BASE_URL` to `https://resuscore-api.onrender.com/api`
- Go to **Deployments** → click the three-dot menu → **Redeploy**

### 2. Update Backend CORS
- On Render, update `CORS_ORIGIN` to your actual Vercel URL
- Render will redeploy automatically after saving

### 3. Final Smoke Test

1. Open your Vercel URL (e.g. `https://resuscore.vercel.app`)
2. Upload a PDF resume
3. You should see the loading animation, then a Results page with scores, checklist, and suggestions
4. Navigate to `/history` — your upload should appear as the first entry

---

## API Reference

All endpoints are prefixed with `/api`. Backend runs on port `3001` by default.

### `GET /api/health`
Server health check.

**Response:**
```json
{ "status": "OK", "timestamp": "2026-08-10T20:00:00.000Z" }
```

---

### `GET /api/health/db`
MongoDB connection health check.

**Response:**
```json
{ "mongodb": { "status": "connected", "readyState": 1 }, "timestamp": "..." }
```

---

### `POST /api/upload`
Upload a resume for analysis. This is the main endpoint — it runs the full 5-engine analysis pipeline and stores the result in MongoDB.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `resume` | File | ✅ | PDF or DOCX file, max 10 MB |

**Headers:**
| Header | Description |
|---|---|
| `X-Client-Id` | Anonymous browser ID for history scoping (generated by `clientId.ts`) |

**Response:**
```json
{
  "message": "File uploaded and processed successfully",
  "analysisId": "507f1f77bcf86cd799439011",
  "filename": "resume-1234567890-123.pdf",
  "originalName": "MyResume.pdf",
  "fileType": "pdf",
  "size": 245678,
  "wordCount": 450,
  "overallScore": 72,
  "formatScore": 85,
  "contentScore": 78,
  "atsScore": 65,
  "checklistScore": 70,
  "suggestions": ["Add quantified results to experience entries", "..."],
  "checklist": { "hasContact": true, "hasExperience": true, "hasEducation": true, "hasSkills": false, "..." : "..." },
  "metrics": { "wordCount": 450, "bulletPoints": 18, "pageCount": 1, "keywordDensity": 3.2 },
  "grammarIssues": []
}
```

**Error codes:**
| Code | Meaning |
|---|---|
| `400` | No file uploaded, wrong file type, or file over 10 MB |
| `500` | Internal processing error |

---

### `GET /api/analysis`
List previous analyses for the current `clientId` (50 most recent).

**Headers:**
| Header | Description |
|---|---|
| `X-Client-Id` | Anonymous browser ID |

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "originalName": "MyResume.pdf",
    "fileType": "pdf",
    "fileSize": 245678,
    "uploadDate": "2026-08-10T20:00:00.000Z",
    "analysisResults": {
      "overallScore": 72,
      "formatScore": 85,
      "contentScore": 78,
      "atsScore": 65,
      "checklistScore": 70
    }
  }
]
```

---

### `GET /api/analysis/:id`
Get the full analysis for a specific ID. Returns the stored `fullResponse` — identical to what was shown immediately after upload.

**Headers:**
| Header | Description |
|---|---|
| `X-Client-Id` | Must match the `clientId` the analysis was created with |

**Response:** Full `AnalysisResponse` object (same structure as the `POST /api/upload` response body).

**Error codes:**
| Code | Meaning |
|---|---|
| `404` | Analysis not found or `clientId` mismatch |

---

### `GET /api/analysis/:id/benchmark`
Compare a stored analysis against industry benchmark averages.

**Response:**
```json
{
  "scores": { "overall": 72, "format": 85, "content": 78, "ats": 65 },
  "benchmarks": { "overall": 78, "format": 85, "content": 80, "ats": 75 },
  "deltas": { "overall": -6, "format": 0, "content": -2, "ats": -10 }
}
```

---

### `POST /api/keywords/suggest`
Analyze resume text for keyword density and suggest missing high-value keywords.

**Request Body:** `application/json`
```json
{ "text": "Software Engineer with 5 years experience in React, Node.js..." }
```

**Response:**
```json
{
  "topKeywords": ["react", "node.js", "typescript", "api"],
  "keywordDensity": 3.2,
  "suggestions": ["Consider adding: docker, kubernetes, ci/cd", "..."]
}
```

---

### `POST /api/ai/analyze`
Generate AI-powered resume analysis using the Groq LLM.

> Requires `GROQ_API_KEY` to be set in the backend environment.

**Request Body:** `application/json`
```json
{
  "text": "John Doe\nSoftware Engineer\n...",
  "mode": "ai"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `text` | string | ✅ | Extracted resume text |
| `mode` | string | ❌ | `"ai"` (default) or `"heuristic"` |

**Response:**
```json
{
  "overallImpression": "Strong technical resume with good keyword density...",
  "strengths": ["Clear section structure", "Quantified achievements in experience"],
  "areasForImprovement": ["Missing skills section", "No summary statement"],
  "recommendations": ["Add a 2-3 sentence professional summary", "..."],
  "atsScore": 68,
  "overallScore": 74
}
```

**Error codes:**
| Code | Meaning |
|---|---|
| `503` | Groq API key not configured |
| `500` | LLM API error |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request on GitHub

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ by **Vatsal Ghaghda**

[GitHub](https://github.com/VatsalGhaghda) · [LinkedIn](https://linkedin.com/in/vatsalghaghda)

</div>
