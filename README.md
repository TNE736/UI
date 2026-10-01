# LeadOps Studio

The LeadOps consultant pipeline as one self-contained system: the dashboard
(Next.js), the CSV **ingest API** and the **live-updates gateway** (Python /
FastAPI) all live in this repo. Data lives in MongoDB
(`bench_outreach.consultants`), the same collection bench-outreach's Email
Agent works from, so this repo needs nothing from leadops-platform.

```
Browser (Next.js :3100)
  ├─ GET /api/overview | /api/consultants | /api/breakdowns | /api/health ─▶ this app's routes ─▶ MongoDB (read-only)
  ├─ POST /leads/ingest  (+ traceparent) ─▶ ingest API :8000 (backend/integrations) ─insert, trace_id─▶ MongoDB
  └─ GET /events (SSE) ───────────────────▶ live-updates gateway :4100 (backend/gateway) ◀── POST /publish
MongoDB ──▶ bench-outreach (Email Agent) — picks up each consultant's trace_id
```

Views refetch when a live event arrives (bursts are batched into one refetch),
right after an upload, and every 15 seconds — bench-outreach advances
consultants without publishing events, so polling keeps the numbers current.

## Screens

| Page | What it shows |
|---|---|
| **Home** `/` | Headline, live preview of the pipeline, shortcuts to the overview and upload |
| **Overview** `/overview` | Total, approval rate, stage-by-stage progress, email status, closed paths, newest, live activity |
| **Upload** `/upload` | 5-step upload: browser pre-checks (missing fields, malformed and duplicate emails), preview table, import, result |
| **Consultants** `/consultants` | Search; filters for stage, decision maker, technology, seniority, visa, email status; sort; pagination; export; profile sheet |
| **Funnel** `/funnel` | Stage-by-stage funnel with conversion and drop-off, email status, closed paths |
| **Journey** `/journey` | One consultant's path, timeline and next step, linkable (`/journey?id=…`) |
| **Insights** `/insights` | Technology, title, seniority and visa mix; field completeness; approval rate by technology |

Plus a **Ctrl/⌘ K command menu**, a **system status** popover (MongoDB, ingest
API, gateway — checked live) and a Refresh control in the top bar.

## Running it (Windows)

MongoDB runs inside WSL Ubuntu as replica set `rs0`. One command starts
everything, each in its own window — the MongoDB relay (only if Windows can't
reach mongod by itself), the ingest API, the gateway and the UI:

```powershell
cd C:\Users\StephenMiller\leadops-ui
copy .env.example .env                   # first time only, then review the values
.\scripts\start-dev.ps1                  # first run also creates backend\.venv and installs everything
.\scripts\start-dev.ps1 -StubDatabase    # ingest API writes to bench_outreach_stub instead
.\scripts\start-dev.ps1 -Relay           # always start the relay
```

Open http://localhost:3100. If PowerShell blocks scripts:
`powershell -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1`.

Run each service by hand instead (from the repo root, with `backend\.venv` active):

```powershell
python backend\scripts\wsl_mongo_relay.py                                   # only if MongoDB is unreachable
cd backend\integrations; uvicorn main:app --port 8000                       # ingest API
cd backend\gateway; uvicorn main:app --port 4100 --timeout-graceful-shutdown 2   # gateway
npm run dev                                                                 # UI on :3100
```

For a demo, use the production build (pages are compiled once, not on first
visit): stop `npm run dev`, then `npm run build` and `npm run start`. Never run
`npm run build` while `npm run dev` is running — both write `.next`.

## Configuration

One `.env` at the repo root, read by the UI and by `backend/integrations/main.py`.
It is git-ignored; `.env.example` lists every name. For MongoDB Atlas, set
`MONGODB_URI` to the Atlas connection string; nothing else changes.

| Variable | Used by | Default |
|---|---|---|
| `MONGODB_URI` | UI routes, ingest API | *(required for the UI)* |
| `MONGODB_DB` | UI routes, ingest API | `bench_outreach` |
| `MONGODB_COLLECTION` | UI routes, ingest API | `consultants` |
| `NEXT_PUBLIC_INGEST_API_URL` | browser — uploads | `http://127.0.0.1:8000` |
| `NEXT_PUBLIC_LIVE_UPDATES_URL` | browser — live events (SSE) | `http://127.0.0.1:4100/events` |
| `ALLOWED_WEB_ORIGINS` | ingest API, gateway (CORS) | `http://localhost:3100,http://127.0.0.1:3100` |
| `LOG_CONSOLE` / `NEXT_PUBLIC_LOG_CONSOLE` | backend / browser logging | `rendered` |

## Logging and tracing

Every upload is one trace (OpenTelemetry). The Upload page opens the run in the
browser (`lib/frontend_logging.ts`) and its request carries `traceparent` to the
ingest API, which adopts it (`backend/integrations/integrations_logging.py`) and
writes the trace id onto every new consultant as `trace_id`. bench-outreach's
Email Agent reads that field, so the same id appears from the click to the email.

Where to look: the browser console and `logs/frontend.jsonl` (posted via
`/api/logs`), the ingest API window and `backend/integrations/logs/`.

## Project structure

```
app/                      the pages, plus api/ (read-only data routes, health, browser log sink)
components/               shell (top bar, command menu, status), ui, charts, consultants, overview, home
lib/
  server/                 MongoDB client and queries for the UI routes (server only)
  frontend_logging.ts     browser tracing for the upload run
  stages.ts               bench-outreach's pipeline stages, labels and colours
  live.tsx, useResource.ts, useSystemStatus.ts, upload.ts
backend/
  integrations/           ingest API :8000 — CSV validation, MongoDB insert, logging
  gateway/                live-updates gateway :4100 — SSE fan-out
  scripts/wsl_mongo_relay.py
  pyproject.toml          Python dependencies
scripts/start-dev.ps1     starts everything
```

## Scripts

`npm run dev` · `npm run build` · `npm run start` · `npm run lint` · `npm run typecheck`
