-- SkillProof AI — triggers

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_user_profiles_updated
  before update on user_profiles
  for each row execute function set_updated_at();

create trigger trg_learning_paths_updated
  before update on learning_paths
  for each row execute function set_updated_at();

create trigger trg_prompt_templates_updated
  before update on prompt_templates
  for each row execute function set_updated_at();

create trigger trg_ai_configuration_updated
  before update on ai_configuration
  for each row execute function set_updated_at();

-- Auto-provision a user_profiles row whenever a new auth.users row is created.
-- Runs as SECURITY DEFINER so it can insert regardless of the caller's RLS —
-- avoids a client-side insert racing against RLS on first login.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, full_name, role, organization_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'employee'),
    nullif(new.raw_user_meta_data->>'organization_id', '')::uuid
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
