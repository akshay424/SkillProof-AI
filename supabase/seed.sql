-- SkillProof AI — base seed data (no auth.users rows here; run
-- backend/scripts/seed_demo_users.py separately to create demo accounts
-- and their dependent rows once real Supabase keys are configured).

insert into organizations (id, name, slug)
values ('11111111-1111-1111-1111-111111111111', 'Vasundhara Infotech', 'vasundhara-infotech')
on conflict (id) do nothing;

insert into learning_paths (id, organization_id, name, description, is_active)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Flutter Project Readiness Track',
  '8-week roadmap covering Flutter basics, REST APIs, Firebase, architecture, state management, testing, performance, and a capstone project.',
  true
)
on conflict (id) do nothing;

insert into prompt_templates (organization_id, key, name, template_body, variables)
values (
  '11111111-1111-1111-1111-111111111111',
  'code_review.architecture',
  'Architecture Review',
  'Review the architecture of the following {{project_type}} project. Folder structure: {{folder_structure}}. Detected patterns: {{detected_patterns}}. Provide a JSON verdict on architecture quality, evidence, and suggestions.',
  '["project_type", "folder_structure", "detected_patterns"]'
)
on conflict (organization_id, key) do nothing;

insert into ai_configuration (organization_id, provider, model_name, temperature, max_tokens)
values ('11111111-1111-1111-1111-111111111111', 'openai', 'gpt-4o', 0.3, 2000)
on conflict (organization_id) do nothing;
