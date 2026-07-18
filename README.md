# SkillProof AI

**Transform Learning into Project Readiness.**

An AI-powered platform for onboarding freshers and evaluating their real
project readiness — AI-generated learning roadmaps, GitLab code review,
real-time AI viva interviews, and weekly/final readiness reports for their PM.

## Roles

- **Fresher** — onboards with a resume + interview notes, gets an AI-generated
  8-week roadmap, works through tasks, and clicks **Evaluate** to get an
  AI code review + real-time viva Q&A for each task. Can also generate
  weekly and final AI summary reports.
- **PM** — claims unassigned freshers, and gets a read-only view of their
  team's roadmap progress, skill heatmap, readiness trend, and reports.

## How AI is wired up

All AI calls (roadmap generation, code evaluation, viva questions/follow-ups,
weekly/final report synthesis, resume image transcription) go **directly from
the browser to OpenAI** (`src/services/ai/*`), using `NEXT_PUBLIC_OPENAI_API_KEY`.

This means the OpenAI key ships in the client bundle and is readable via
devtools by anyone using the app — a known, explicit tradeoff for this phase
(no backend proxy exists yet). Do not use a production/unrestricted key.

There is currently **no backend/database** — the app runs entirely on
**demo mode** against a mutable in-memory store (`src/mocks/demo-store.ts`),
seeded from `src/mocks/fixtures.ts`. Every action (generating a roadmap,
evaluating a task, claiming a fresher, generating reports) mutates this store
so the demo feels real for the session, but nothing persists across a page
reload. Supabase can be reintroduced later — every query hook under
`src/services/queries/` already branches on `DEMO_MODE` with a real-Supabase
code path stubbed in.

## Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS,
  shadcn/ui, Framer Motion, React Hook Form + Zod, TanStack Query, React
  Dropzone, Recharts, Lucide React.
- **AI**: OpenAI (`openai` npm package, browser-direct), `pdfjs-dist` for
  client-side PDF resume parsing, OpenAI vision for image resume parsing.
- **Not yet wired up**: Supabase (Postgres/Auth/Storage), any backend.

## Project layout

```
frontend/src/
  app/(fresher)/fresher/**       Fresher dashboard, roadmap, reports, profile
  app/(pm)/pm/**                 PM dashboard, fresher drill-down
  features/fresher-dashboard/    Onboarding card, Evaluate dialog, widgets
  features/pm-dashboard/         Team table, heatmap, trend, claim list
  services/ai/                   OpenAI client + roadmap/evaluation/viva/report agents
  services/pdf/, services/gitlab/  Resume PDF parsing, GitLab repo fetch
  mocks/                         demo-store.ts (mutable) + fixtures.ts (seed data)
```

## Running locally (demo mode)

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:3000` and redirects straight to the Fresher
dashboard. `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local` bypasses auth
entirely:

- **Fresher**: http://localhost:3000/fresher
- **PM**: http://localhost:3000/pm

The demo fresher already has a resume + interview notes filled in, so you can
go straight to **Generate My Roadmap with AI** on first load. Click
**Evaluate** on the active task to walk through the full fetch → AI code
review → viva Q&A → final score flow. In demo mode these use canned
responses — no real OpenAI/GitLab calls are made, so it works with zero API
keys.

`npm run build` / `npm run lint` both pass cleanly.

**Don't run `npm run build` while `npm run dev` is running** — they share the
`.next` cache and will corrupt each other's build output. Stop one before
running the other.

## Using real AI (still demo/no-backend, but real OpenAI calls)

Set `NEXT_PUBLIC_OPENAI_API_KEY` in `frontend/.env.local` and keep
`NEXT_PUBLIC_DEMO_MODE=false`. Roadmap generation, evaluation, viva, and
report synthesis will call OpenAI for real; GitLab fetches will hit the real
GitLab API. Data still only lives in the in-memory demo store (no backend),
so it resets on reload.

## Turning demo mode off / adding a real backend later

Every query hook under `src/services/queries/` already branches on
`DEMO_MODE` with a Supabase code path alongside the demo-store path — wiring
up a real Supabase project (or other backend) means filling in
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` and writing the
schema/RLS to match what those code paths expect (see git history for the
Foundation-phase schema this project started from).
