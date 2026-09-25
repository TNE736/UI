# LeadOps Studio

A second, redesigned dashboard for the LeadOps consultant pipeline. It runs
**alongside** the classic dashboard in
[leadops-platform](https://github.com/TNE736/leadops-platform) and reuses its
services unchanged: uploads go to the existing ingest API, live updates come
from the existing gateway, and the data lives in the same MongoDB
(`bench_outreach.consultants`) that bench-outreach works from.

The UI follows [Emil Kowalski's design-engineering skills](https://github.com/emilkowalski/skills):
strong custom easing, sub-300 ms motion on `transform`/`opacity` only, press
feedback on every control, origin-aware and interruptible transitions, no
animation on keyboard-driven actions, reduced-motion support, and libraries
from his curated list (motion, recharts, sonner, NumberFlow, cmdk, Base UI).

| | Classic dashboard | LeadOps Studio |
|---|---|---|
| Repo | leadops-platform | this repo |
| Port | 3000 | **3100** |
| Reads data via | ingest API | its own read-only API routes → MongoDB |
| Uploads via | ingest API (:8000) | the same ingest API (:8000) |

## Screens

| Page | What it shows |
|---|---|
| **Home** `/` | Slow, flowing warm waves behind the headline (ambient, transform-only, stops for reduced motion), live counts, how the pipeline flows, and a way into every page |
| **Overview** `/overview` | Animated KPIs, the pipeline funnel, where everyone is right now (donut), top technologies, newest consultants, live activity |
| **Upload** `/upload` | Drag-and-drop CSV, in-browser row count and type check, save via the ingest API with a progress toast, full result and rejected rows |
| **Consultants** `/consultants` | Search, stage and decision-maker filters, sortable columns, pagination, CSV export, detail side sheet |
| **Funnel** `/funnel` | Stage-by-stage conversion and drop-off, headline conversion, closed-early stages, email status |
| **Journey** `/journey` | Any consultant's path through the seven stages, linkable (`/journey?id=…`) |
| **Insights** `/insights` | Technology, title, seniority and visa breakdowns, split by decision makers |

Plus a **Ctrl/⌘ K command menu** (search consultants, jump to pages).

**Look:** "Forest and linen", an editorial theme: linen canvas, forest-ink
text and a single forest-green accent; Fraunces serif headlines (with one
italic accent word) over Inter body text; white cards with hairline borders;
ink pill buttons. Colour is kept for meaning: one linen → sage → forest → ink
scale for pipeline stages. Every colour is a token in `app/globals.css`, so a
new palette is a one-file change.

## Running it

Needs the leadops-platform services running first (see that repo's README):
the MongoDB relay, the ingest API on 8000 and the live-updates gateway on 4100.

```bash
cp .env.example .env.local   # first time only
npm install                  # first time only
npm run dev                  # http://localhost:3100 (home), /overview for the dashboard
```

`.env.local` is git-ignored. For MongoDB Atlas, set `MONGODB_URI` to the Atlas
connection string there; nothing else changes.

## Configuration

| Variable | Where it's used | Default |
|---|---|---|
| `MONGODB_URI` | server — read-only API routes | *(required)* |
| `MONGODB_DB` | server | `bench_outreach` |
| `MONGODB_COLLECTION` | server | `consultants` |
| `NEXT_PUBLIC_INGEST_API_URL` | browser — uploads | `http://127.0.0.1:8000` |
| `NEXT_PUBLIC_LIVE_UPDATES_URL` | browser — live events (SSE) | `http://127.0.0.1:4100/events` |

## How it fits together

```
Browser (Next.js :3100)
  ├─ GET /api/overview | /api/consultants | /api/breakdowns ─▶ this app's API routes ─▶ MongoDB (read-only)
  ├─ POST /leads/ingest ───────────────────────────────────▶ ingest API :8000 (leadops-platform) ─▶ MongoDB
  └─ GET /events (SSE) ────────────────────────────────────▶ live-updates gateway :4100 (leadops-platform)
```

Views refetch when a live event arrives (bursts are batched into one refetch),
right after an upload, and every 15 seconds — bench-outreach advances
consultants without publishing events, so polling keeps the numbers current.

## Project structure

```
app/
  page.tsx               Home (waves hero)
  overview/              Overview
  upload/ consultants/ funnel/ journey/ insights/   the other pages
  api/                   read-only routes: overview, consultants, breakdowns
  globals.css            editorial theme tokens, typography, easing curves, motion utilities
components/
  shell/                 top navigation bar, command menu, live badge
  dashboard/             KPI card, funnel bars, stage donut, activity feed
  home/                  flowing background waves
  consultants/           detail side sheet, journey timeline
  charts/                breakdown chart, themed tooltip
  ui/                    card, button, stage pill, avatar, skeleton, states
lib/
  stages.ts              bench-outreach's pipeline stages, labels and colours
  server/                MongoDB client and queries (server only)
  live.tsx               live-updates connection (SSE) and refresh signal
  useResource.ts         fetch + refetch-on-event + polling
  upload.ts              CSV checks and the call to the ingest API
```

## Scripts

`npm run dev` · `npm run build` · `npm run start` · `npm run lint` · `npm run typecheck`
