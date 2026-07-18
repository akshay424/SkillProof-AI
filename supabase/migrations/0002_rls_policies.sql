-- SkillProof AI — Row Level Security
-- Helper functions run as SECURITY DEFINER so policies can consult user_profiles
-- without triggering recursive RLS evaluation on user_profiles itself.

create or replace function current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from user_profiles where id = auth.uid();
$$;

create or replace function current_user_org()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id from user_profiles where id = auth.uid();
$$;

create or replace function is_supervisor_of(target_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from user_profiles
    where id = target_user_id and supervisor_id = auth.uid()
  );
$$;

create or replace function owns_or_manages(target_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select target_user_id = auth.uid()
     or is_supervisor_of(target_user_id)
     or current_user_role() = 'admin';
$$;

-- ============================================================
-- ENABLE RLS
-- ============================================================
alter table organizations enable row level security;
alter table user_profiles enable row level security;
alter table learning_paths enable row level security;
alter table roadmaps enable row level security;
alter table roadmap_weeks enable row level security;
alter table tasks enable row level security;
alter table submissions enable row level security;
alter table evaluation_reports enable row level security;
alter table viva_sessions enable row level security;
alter table viva_questions enable row level security;
alter table viva_answers enable row level security;
alter table diagnostic_results enable row level security;
alter table skill_scores enable row level security;
alter table prompt_templates enable row level security;
alter table ai_configuration enable row level security;

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
create policy "org members can view their org"
  on organizations for select
  using (id = current_user_org());

create policy "admins can update their org"
  on organizations for update
  using (id = current_user_org() and current_user_role() = 'admin');

-- ============================================================
-- USER PROFILES
-- ============================================================
create policy "self can view own profile"
  on user_profiles for select
  using (id = auth.uid());

create policy "supervisors can view direct reports"
  on user_profiles for select
  using (supervisor_id = auth.uid());

create policy "admins can view org members"
  on user_profiles for select
  using (current_user_role() = 'admin' and organization_id = current_user_org());

create policy "self can update own profile"
  on user_profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "admins can update org members"
  on user_profiles for update
  using (current_user_role() = 'admin' and organization_id = current_user_org())
  with check (organization_id = current_user_org());

-- ============================================================
-- LEARNING PATHS
-- ============================================================
create policy "org members can view learning paths"
  on learning_paths for select
  using (organization_id = current_user_org());

create policy "admins can manage learning paths"
  on learning_paths for all
  using (current_user_role() = 'admin' and organization_id = current_user_org())
  with check (current_user_role() = 'admin' and organization_id = current_user_org());

-- ============================================================
-- ROADMAPS
-- ============================================================
create policy "owner/supervisor/admin can view roadmaps"
  on roadmaps for select
  using (owns_or_manages(user_id));

create policy "admins can manage roadmaps"
  on roadmaps for all
  using (current_user_role() = 'admin' and exists (
    select 1 from user_profiles up where up.id = user_id and up.organization_id = current_user_org()
  ))
  with check (current_user_role() = 'admin');

-- ============================================================
-- ROADMAP WEEKS
-- ============================================================
create policy "owner/supervisor/admin can view roadmap weeks"
  on roadmap_weeks for select
  using (owns_or_manages((select user_id from roadmaps where id = roadmap_id)));

create policy "admins can manage roadmap weeks"
  on roadmap_weeks for all
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- ============================================================
-- TASKS
-- ============================================================
create policy "owner/supervisor/admin can view tasks"
  on tasks for select
  using (owns_or_manages((
    select r.user_id from roadmaps r
    join roadmap_weeks rw on rw.roadmap_id = r.id
    where rw.id = roadmap_week_id
  )));

create policy "admins can manage tasks"
  on tasks for all
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- ============================================================
-- SUBMISSIONS
-- ============================================================
create policy "owner can view own submissions"
  on submissions for select
  using (owns_or_manages(user_id));

create policy "owner can insert own submissions"
  on submissions for insert
  with check (user_id = auth.uid());

-- ============================================================
-- EVALUATION REPORTS / VIVA / DIAGNOSTIC / SKILL SCORES
-- AI/backend-generated only: no INSERT/UPDATE policy for `authenticated`,
-- only the service_role (used exclusively by the backend) can write these.
-- ============================================================
create policy "owner/supervisor/admin can view evaluation reports"
  on evaluation_reports for select
  using (owns_or_manages(user_id));

create policy "owner/supervisor/admin can view viva sessions"
  on viva_sessions for select
  using (owns_or_manages(user_id));

create policy "owner/supervisor/admin can view viva questions"
  on viva_questions for select
  using (owns_or_manages((select user_id from viva_sessions where id = viva_session_id)));

create policy "owner/supervisor/admin can view viva answers"
  on viva_answers for select
  using (owns_or_manages((
    select vs.user_id from viva_sessions vs
    join viva_questions vq on vq.viva_session_id = vs.id
    where vq.id = viva_question_id
  )));

create policy "owner/supervisor/admin can view diagnostic results"
  on diagnostic_results for select
  using (owns_or_manages(user_id));

create policy "owner/supervisor/admin can view skill scores"
  on skill_scores for select
  using (owns_or_manages(user_id));

-- ============================================================
-- PROMPT TEMPLATES / AI CONFIGURATION — admin only
-- ============================================================
create policy "admins can manage prompt templates"
  on prompt_templates for all
  using (current_user_role() = 'admin' and organization_id = current_user_org())
  with check (current_user_role() = 'admin' and organization_id = current_user_org());

create policy "admins can manage ai configuration"
  on ai_configuration for all
  using (current_user_role() = 'admin' and organization_id = current_user_org())
  with check (current_user_role() = 'admin' and organization_id = current_user_org());
