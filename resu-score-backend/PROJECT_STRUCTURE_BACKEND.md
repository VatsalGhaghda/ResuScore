# ResuScore Backend Project Structure

This document describes the structure of the **resu-score-backend** Node.js/Express + TypeScript API.

```text
resu-score-backend/
├── package.json
├── tsconfig.json
├── nodemon.json (if present)
├── .env               # Environment variables (not committed)
└── src/
    ├── index.ts       # Express app setup & server bootstrap
    ├── models/
    │   └── ResumeAnalysis.ts   # Mongoose model for stored analyses
    ├── routes/
    │   ├── upload.ts          # File upload + analysis pipeline
    │   └── analysis.ts        # History + single-analysis + benchmark routes
    ├── services/
    │   ├── fileProcessor.ts   # PDF/DOCX text extraction
    │   ├── formatAnalyzer.ts
    │   ├── contentAnalyzer.ts
    │   ├── atsAnalyzer.ts
    │   ├── grammarChecker.ts
    │   └── checklistValidator.ts
    ├── utils/
    │   └── textPreprocessor.ts, fileValidator.ts, etc.
    └── config/ (if present)   # DB connection or config helpers
```

The backend exposes a REST API under `/api` (e.g. `/api/upload`, `/api/analysis`) and stores analyses in MongoDB, including both a compact `analysisResults` summary and a full `fullResponse` object returned to the frontend.
