# ResuScore

ResuScore is an ATS‑friendly resume checker that analyzes PDF/DOCX resumes for format, content quality, and ATS compatibility, then gives you a clear score, actionable suggestions, and a history of previous analyses.

- **Frontend:** `resu-score-frontend/` – React + TypeScript (Vite), styled with Tailwind and custom UI components.
- **Backend:** `resu-score-backend/` – Node.js + Express + TypeScript, storing data in MongoDB.

Each browser gets an anonymous `clientId` so that history is **scoped per user/device** without a login system.

---

## Features

- **Resume upload** – PDF and DOCX support.
- **ATS‑style scoring**
  - Overall score
  - Format, Content, and ATS sub‑scores
- **Improvement Suggestions**
  - Deduplicated suggestions across format, content, and ATS checks
  - Clear messages like missing skills section, inconsistent dates, etc.
- **Resume Checklist**
  - Contact info, experience, education, skills, layout, images/tables, action verbs, quantified results
  - Completion percentage and visual checklist
- **Detailed Metrics**
  - Word count, bullet points, keywords and density, page count, layout details
- **Grammar & Spelling block** (when enabled)
- **History view**
  - Cards showing scores and key checks
  - Click through to full detailed analysis
  - History is **per browser** via anonymous `clientId`.

---

## Repository Layout

Top‑level structure:

```text
ResuScore/
├── resu-score-frontend/          # React + Vite frontend
├── resu-score-backend/           # Express + MongoDB backend
├── PROJECT_STRUCTURE.md          # High‑level overview
├── resu-score-frontend/PROJECT_STRUCTURE_FRONTEND.md
└── resu-score-backend/PROJECT_STRUCTURE_BACKEND.md
```

For more detail, see the structure files inside each folder.

---

## Prerequisites

- Node.js **18+**
- npm (or yarn/pnpm)
- A MongoDB instance (local MongoDB or MongoDB Atlas)

---

## Backend Setup (`resu-score-backend`)

### 1. Install dependencies

```bash
cd resu-score-backend
npm install
```

### 2. Configure environment

Create a `.env` file in `resu-score-backend/` (use `.env.example` if present) with at least:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster-url/db-name
PORT=3001
```

Other env vars (if you add them later) should also go here.

### 3. Run the backend in development

```bash
npm run dev
```

This starts the API on:

- `http://localhost:3001/api`

Key endpoints:

- `POST /api/upload` – upload and analyze a resume
- `GET  /api/analysis` – list previous analyses for the current `clientId`
- `GET  /api/analysis/:id` – get full analysis details by ID
- `GET  /api/analysis/:id/benchmark` – benchmark scores against reference values

The backend:

- Runs format, content, ATS, and checklist analysis
- Computes `overallScore` and sub‑scores
- Stores both a compact `analysisResults` and a full `fullResponse` in MongoDB

---

## Frontend Setup (`resu-score-frontend`)

### 1. Install dependencies

```bash
cd resu-score-frontend
npm install
```

### 2. Configure environment

Create a `.env` or `.env.local` file in `resu-score-frontend/`:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

This tells the frontend where to find the backend API.

### 3. Run the dev server

```bash
npm run dev
```

Vite will print a URL such as:

- `http://localhost:5173`

Open that in your browser while the backend (`npm run dev` in `resu-score-backend`) is also running.

---

## How the App Works (End‑to‑End)

1. **User uploads a resume** on the main page.
   - Frontend sends the file to `POST /api/upload` with a header `X-Client-Id` (anonymous ID stored in `localStorage`).

2. **Backend processes the file**:
   - Extracts text from PDF/DOCX.
   - Runs:
     - `formatAnalysis` – layout, columns, images, tables.
     - `contentAnalysis` – sections present, skill counts, experience/education entries.
     - `atsAnalysis` – keywords, density, bullet style, ATS metrics.
     - `checklistValidation` – consolidated checklist with compliance score.
     - `grammarCheck` – (optional) grammar/spelling issues.
   - Calculates `overallScore` via weighted combination of sub‑scores.
   - Saves a `ResumeAnalysis` document with:
     - `clientId` (anonymous browser ID)
     - `analysisResults` (compact summary)
     - `fullResponse` (complete `AnalysisResponse` payload used by the frontend)
   - Returns the `AnalysisResponse` to the frontend.

3. **Results page** (`/results`)
   - Displays:
     - Overall score gauge
     - Format, Content, ATS, and Checklist cards
     - Improvement Suggestions (merged and deduplicated)
     - Resume Checklist (9 key items)
     - Detailed Metrics sections
     - Grammar and keyword blocks when present

4. **History page** (`/history`)
   - Calls `GET /api/analysis` with `X-Client-Id`.
   - Shows a list of cards using `analysisResults`:
     - Overall score
     - Format/Content/ATS sub‑scores
     - Quick checklist (contact, experience, education, skills)
   - **Per‑browser history**: only records with the same `clientId` appear.

5. **History → detailed view**
   - Clicking a History card navigates to `/results?id=<analysisId>`.
   - Frontend calls `GET /api/analysis/:id` with `X-Client-Id`.
   - Backend returns the stored `fullResponse`, so the detailed view matches what was shown right after upload.

---

## Environment Variables Summary

### Backend (`resu-score-backend/.env`)

- `MONGODB_URI` – MongoDB connection string.
- `PORT` – Port for the Express server (default 3001).

### Frontend (`resu-score-frontend/.env` or `.env.local`)

- `VITE_API_BASE_URL` – Base URL for the API, e.g.:

  ```env
  VITE_API_BASE_URL=http://localhost:3001/api
  # or in production
  VITE_API_BASE_URL=https://your-backend-host.example.com/api
  ```

---

## Deployment

### Backend Deployment

You can deploy `resu-score-backend` to any Node host (Render, Railway, Fly.io, VPS, etc.):

1. Push the backend code to a Git repository.
2. Create a service/app on your host pointing to `resu-score-backend`.
3. Set environment variables:
   - `MONGODB_URI`
   - `PORT` (or use the host‑provided port variable if required)
4. Configure the start command (usually `npm run start` or a build + start step if you compile TypeScript ahead of time).

Your public API base URL should look like:

```text
https://your-backend-host.example.com/api
```

### Frontend Deployment (Vercel recommended)

1. In Vercel, create a new project and select the `resu-score-frontend` folder as the root.
2. Set build settings:
   - **Framework:** Vite / React
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
3. In Vercel project settings → Environment Variables, add:

   ```env
   VITE_API_BASE_URL=https://your-backend-host.example.com/api
   ```

4. Deploy. Vercel will host the SPA at a URL like:

   ```text
   https://your-frontend-project.vercel.app
   ```

The deployed frontend will communicate with the deployed backend using `VITE_API_BASE_URL`, and history will remain scoped per browser via `clientId`.

---

## Troubleshooting

- **Frontend can’t reach backend (CORS / network errors)**
  - Check that `VITE_API_BASE_URL` is correct and includes `/api`.
  - Confirm the backend is running and accessible from your browser.

- **History is empty even after uploads**
  - Make sure both upload and history requests include `X-Client-Id` (handled by `utils/clientId.ts` in the frontend).
  - If you clear `localStorage`, you’ll get a new `clientId` and won’t see old history from that browser.

- **Scores or details don’t match for very old entries**
  - Older analyses created before the latest code changes may not have full stored responses.
  - Re‑upload the resume to generate a new, fully consistent analysis.

- **Tailwind CSS @import error in dev**
  - Ensure any `@import url(...)` for fonts is at the very top of `src/index.css`, before `@tailwind` directives.

---

## License

This project is provided for personal / educational use. Add your own license text here if you intend to open‑source or redistribute it.
