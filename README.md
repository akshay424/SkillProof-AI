# SkillProof AI

**Transform Learning into Project Readiness.**

An AI-powered platform that evaluates whether employees are actually ready for
real client projects — AI learning roadmaps, GitLab/ZIP project analysis, AI
code review, real-time AI viva interviews, and project readiness scoring.

This repository currently implements the **Foundation phase**: authentication,
role-based dashboards (Employee / Supervisor / Admin), the database schema,
and a FastAPI backend skeleton. The AI diagnostic, roadmap generation, project
upload/parsing pipeline, static analysis, AI code review, and AI viva are
future phases — the schema and backend folder structure already leave typed,
contract-defined room for them (see `backend/app/{ai,parser,git,interview,evaluation}`).

## Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS,
  shadcn/ui, Framer Motion, React Hook Form + Zod, TanStack Query, React
  Dropzone, Recharts, Lucide React.
- **Backend**: Python FastAPI.
- **Database / Auth / Storage**: Supabase (Postgres, Supabase Auth, Supabase
  Storage).
- **AI**: OpenAI (default) or Gemini, called only from the backend — API keys
  never reach the frontend.

## Project layout

```
frontend/   Next.js app (src/app, components, features, services, hooks, types, utils, styles)
backend/    FastAPI app (app/routers, services, ai, parser, git, interview, evaluation, database, models, schemas, prompts)
supabase/   SQL migrations, RLS policies, storage bucket setup, seed data
```

## Prerequisites

- Node.js 20+
- Python 3.12+ (3.14 also verified)
- A Supabase project (free tier is fine)
- An OpenAI or Gemini API key (only needed once you build the AI phases —
  not required to run Foundation)

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the migrations in order:
   - `supabase/migrations/0001_init_schema.sql`
   - `supabase/migrations/0002_rls_policies.sql`
   - `supabase/migrations/0003_triggers.sql`
   - `supabase/migrations/0004_storage.sql`
3. Run `supabase/seed.sql` to create the base organization, learning path,
   prompt template, and AI configuration row.
4. Under **Authentication → Providers**, enable **Google** and **GitHub**
   OAuth (add your own client id/secret) alongside the default Email
   provider. Set the redirect URL to `http://localhost:3000/auth/callback`
   (and your production URL later).
5. Copy your project's URL, anon key, service role key, and JWT secret —
   you'll need them below.

## 2. Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET
uvicorn app.main:app --reload
```

Runs on `http://localhost:8000`. `GET /health` should return `{"status": "ok"}`
even before you configure Supabase; `/auth/me` and `/admin/ping` require a
valid Supabase-issued bearer token.

Run tests: `pytest`

Seed 3 demo accounts (employee / supervisor / admin) with sample roadmap,
task, submission, evaluation report, and skill score data, once your `.env`
has real Supabase keys:

```bash
python -m scripts.seed_demo_users
```

Demo logins (all use password `SkillProof!Demo1`):

| Role | Email |
|---|---|
| Employee | employee.demo@skillproof.ai |
| Supervisor | supervisor.demo@skillproof.ai |
| Admin | admin.demo@skillproof.ai |

## 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Runs on `http://localhost:3000`. Without real Supabase credentials, public
pages (`/login`, `/signup`, etc.) render normally; anything under
`/employee`, `/supervisor`, or `/admin` redirects to `/login` as expected.

`npm run build` / `npm run lint` should both pass cleanly.

## What's real vs. stubbed in this phase

- **Real**: Supabase Auth (email/password + Google + GitHub OAuth),
  role-based route protection, all 3 dashboards backed by live Supabase
  queries, admin CRUD (users/roles, learning paths, prompt templates, AI
  configuration), profile settings with avatar upload, and a FastAPI JWT
  verification bridge (`/auth/me`, `/admin/ping`) proving the "AI requests go
  through the backend" pattern end to end.
- **Stubbed (future phases)**: `POST /roadmaps/generate`, `POST /tasks/generate`,
  `POST /submissions`, `GET /reports/{id}/regenerate`, `POST /interview/start`
  all return `501 Not Implemented` with a docstring pointing at the phase that
  will implement them. `app/ai`, `app/parser`, `app/git`, `app/interview`,
  `app/evaluation` define the contracts (return shapes, abstract classes)
  those phases will fill in.
