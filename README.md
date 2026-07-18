# SkillProof AI

**Transform Learning into Project Readiness.**

An AI-powered platform that evaluates whether employees are actually ready for
real client projects — AI learning roadmaps, GitLab/ZIP project analysis, AI
code review, real-time AI viva interviews, and project readiness scoring.

This repository currently contains the **frontend Foundation phase**:
authentication UI, role-based dashboards (Employee / Supervisor / Admin), and
a design system — running in **demo mode** against static fixture data so it
can be reviewed without any backend or database setup. The Supabase schema,
FastAPI backend, and AI phases (diagnostic, roadmap generation, project
upload/parsing, code review, AI viva) will be reintroduced in a later pass.

## Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS,
  shadcn/ui, Framer Motion, React Hook Form + Zod, TanStack Query, React
  Dropzone, Recharts, Lucide React.
- **Planned (removed for now)**: Python FastAPI backend, Supabase
  (Postgres/Auth/Storage), OpenAI/Gemini AI integration.

## Project layout

```
frontend/   Next.js app (src/app, components, features, services, hooks, types, utils, styles)
```

## Running locally (demo mode)

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:3000` and redirects straight to the Employee
dashboard. `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local` bypasses auth
entirely and serves static fixture data (`src/mocks/fixtures.ts`) for all
three dashboards:

- **Employee**: http://localhost:3000/employee
- **Supervisor**: http://localhost:3000/supervisor
- **Admin**: http://localhost:3000/admin

`npm run build` / `npm run lint` both pass cleanly.

## Turning demo mode off later

Once Supabase and the backend are reintroduced, set
`NEXT_PUBLIC_DEMO_MODE=false` in `frontend/.env.local` and fill in
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — every query
hook under `src/services/queries/` already branches on `DEMO_MODE` and falls
through to real Supabase queries, so no other code changes are needed.
