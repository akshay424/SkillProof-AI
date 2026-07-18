-- SkillProof AI — Foundation schema
create extension if not exists "pgcrypto";

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- USER PROFILES (1:1 with auth.users)
-- ============================================================
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  full_name text,
  avatar_url text,
  role text not null default 'employee'
    check (role in ('employee', 'supervisor', 'admin')),
  supervisor_id uuid references user_profiles(id) on delete set null,
  job_title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_user_profiles_org on user_profiles(organization_id);
create index idx_user_profiles_supervisor on user_profiles(supervisor_id);

-- ============================================================
-- LEARNING PATHS (admin-authored roadmap templates)
-- ============================================================
create table learning_paths (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_learning_paths_org on learning_paths(organization_id);

-- ============================================================
-- ROADMAPS (assigned instance per employee)
-- ============================================================
create table roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  learning_path_id uuid references learning_paths(id) on delete set null,
  title text not null,
  total_weeks int not null default 8,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed')),
  started_at timestamptz,
  target_completion_date date,
  created_at timestamptz not null default now()
);
create index idx_roadmaps_user on roadmaps(user_id);

-- ============================================================
-- ROADMAP WEEKS
-- ============================================================
create table roadmap_weeks (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references roadmaps(id) on delete cascade,
  week_number int not null,
  theme text not null,
  summary text,
  unlock_date date,
  status text not null default 'locked'
    check (status in ('locked', 'active', 'completed')),
  unique (roadmap_id, week_number)
);
create index idx_roadmap_weeks_roadmap on roadmap_weeks(roadmap_id);

-- ============================================================
-- TASKS
-- ============================================================
create table tasks (
  id uuid primary key default gen_random_uuid(),
  roadmap_week_id uuid not null references roadmap_weeks(id) on delete cascade,
  title text not null,
  description text,
  requirements jsonb not null default '[]',
  acceptance_criteria jsonb not null default '[]',
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  estimated_hours numeric,
  resources jsonb not null default '[]',
  deadline timestamptz,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'submitted', 'completed')),
  created_at timestamptz not null default now()
);
create index idx_tasks_week on tasks(roadmap_week_id);

-- ============================================================
-- SUBMISSIONS (GitLab URL or ZIP upload)
-- ============================================================
create table submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references user_profiles(id) on delete cascade,
  submission_type text not null check (submission_type in ('gitlab_url', 'zip_upload')),
  gitlab_url text,
  storage_path text,
  detected_project_type text
    check (detected_project_type in ('flutter', 'react', 'node', 'python', 'java', 'android', 'ios') or detected_project_type is null),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'analyzed', 'failed')),
  submitted_at timestamptz not null default now()
);
create index idx_submissions_user on submissions(user_id);
create index idx_submissions_task on submissions(task_id);

-- ============================================================
-- EVALUATION REPORTS (AI code review output)
-- ============================================================
create table evaluation_reports (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  user_id uuid not null references user_profiles(id) on delete cascade,
  architecture jsonb,
  folder_structure jsonb,
  problem_solving jsonb,
  code_quality jsonb,
  ai_usage jsonb,
  evidence jsonb,
  suggestions jsonb,
  confidence numeric,
  overall_score numeric,
  raw_report jsonb,
  generated_at timestamptz not null default now()
);
create index idx_eval_reports_user on evaluation_reports(user_id);
create index idx_eval_reports_submission on evaluation_reports(submission_id);

-- ============================================================
-- VIVA (AI interview)
-- ============================================================
create table viva_sessions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  user_id uuid not null references user_profiles(id) on delete cascade,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'completed')),
  started_at timestamptz,
  ended_at timestamptz,
  overall_communication_score numeric
);
create index idx_viva_sessions_user on viva_sessions(user_id);

create table viva_questions (
  id uuid primary key default gen_random_uuid(),
  viva_session_id uuid not null references viva_sessions(id) on delete cascade,
  sequence_number int not null,
  question_text text not null,
  source_reference jsonb,
  created_at timestamptz not null default now()
);
create index idx_viva_questions_session on viva_questions(viva_session_id);

create table viva_answers (
  id uuid primary key default gen_random_uuid(),
  viva_question_id uuid not null references viva_questions(id) on delete cascade,
  answer_text text,
  follow_up_generated boolean not null default false,
  ai_feedback jsonb,
  answered_at timestamptz not null default now()
);
create index idx_viva_answers_question on viva_answers(viva_question_id);

-- ============================================================
-- DIAGNOSTIC RESULTS (first-login AI diagnostic)
-- ============================================================
create table diagnostic_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  competency_graph jsonb,
  raw_answers jsonb,
  generated_roadmap_id uuid references roadmaps(id) on delete set null,
  taken_at timestamptz not null default now()
);
create index idx_diagnostic_results_user on diagnostic_results(user_id);

-- ============================================================
-- SKILL SCORES (drives heatmaps + readiness trend)
-- ============================================================
create table skill_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  skill_name text not null,
  score numeric not null check (score >= 0 and score <= 100),
  source text not null check (source in ('diagnostic', 'task_evaluation', 'viva')),
  recorded_at timestamptz not null default now()
);
create index idx_skill_scores_user on skill_scores(user_id);
create index idx_skill_scores_user_skill on skill_scores(user_id, skill_name, recorded_at);

-- ============================================================
-- PROMPT TEMPLATES (admin-configurable AI prompts)
-- ============================================================
create table prompt_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  key text not null,
  name text not null,
  template_body text not null,
  variables jsonb not null default '[]',
  version int not null default 1,
  is_active boolean not null default true,
  updated_by uuid references user_profiles(id),
  updated_at timestamptz not null default now()
);
create unique index idx_prompt_templates_org_key on prompt_templates(organization_id, key);

-- ============================================================
-- AI CONFIGURATION (per-org, swappable provider)
-- ============================================================
create table ai_configuration (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  provider text not null default 'openai' check (provider in ('openai', 'gemini')),
  model_name text not null default 'gpt-4o',
  temperature numeric not null default 0.3,
  max_tokens int not null default 2000,
  extra_settings jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
create unique index idx_ai_config_org on ai_configuration(organization_id);
