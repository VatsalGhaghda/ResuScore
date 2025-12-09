# ResuScore Frontend Project Structure

This document describes the structure of the **resu-score-frontend** React + TypeScript app.

```text
resu-score-frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/
│   └── favicon and static assets
└── src/
    ├── main.tsx              # React entry point
    ├── App.tsx               # App shell and routes
    ├── index.css             # Global styles & Tailwind layers
    ├── components/
    │   ├── Navbar.tsx
    │   ├── BackgroundEffects.tsx
    │   ├── SuggestionList.tsx
    │   ├── ChecklistSection.tsx
    │   ├── MetricCard.tsx
    │   └── ui/               # Reusable shadcn/ui-style components
    ├── pages/
    │   ├── Index.tsx         # Upload / landing page
    │   ├── Results.tsx       # Analysis results view
    │   └── History.tsx       # History of previous analyses
    ├── services/
    │   └── api.ts            # REST API client (upload, analysis, history)
    ├── types/
    │   └── index.ts          # Shared TypeScript types (AnalysisResponse, etc.)
    ├── utils/
    │   └── clientId.ts       # Anonymous per-browser client ID for history scoping
    └── lib/ (if present)     # Utility helpers such as cn() for classNames
```

The frontend is a Vite + React SPA that talks to the backend via `VITE_API_BASE_URL` and scopes history per browser using the `X-Client-Id` header.
