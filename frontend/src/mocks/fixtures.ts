import type { AIConfiguration, EvaluationReport, PromptTemplate, SkillScore } from "@/types/report";
import type { LearningPath, Roadmap, RoadmapWeek } from "@/types/roadmap";
import type { Task } from "@/types/task";
import type { UserProfile } from "@/types/user";

export const MOCK_ORG_ID = "11111111-1111-1111-1111-111111111111";
const MOCK_LEARNING_PATH_ID = "22222222-2222-2222-2222-222222222222";
const MOCK_ROADMAP_ID = "33333333-3333-3333-3333-333333333333";

export const MOCK_EMPLOYEE: UserProfile = {
  id: "aaaaaaaa-0000-0000-0000-000000000001",
  organization_id: MOCK_ORG_ID,
  full_name: "Aarav Employee",
  avatar_url: null,
  role: "employee",
  supervisor_id: "aaaaaaaa-0000-0000-0000-000000000002",
  job_title: "Flutter Developer Trainee",
  created_at: "2026-05-01T09:00:00Z",
  updated_at: "2026-07-10T09:00:00Z",
};

export const MOCK_SUPERVISOR: UserProfile = {
  id: "aaaaaaaa-0000-0000-0000-000000000002",
  organization_id: MOCK_ORG_ID,
  full_name: "Priya Supervisor",
  avatar_url: null,
  role: "supervisor",
  supervisor_id: null,
  job_title: "Engineering Team Lead",
  created_at: "2026-03-01T09:00:00Z",
  updated_at: "2026-03-01T09:00:00Z",
};

export const MOCK_ADMIN: UserProfile = {
  id: "aaaaaaaa-0000-0000-0000-000000000003",
  organization_id: MOCK_ORG_ID,
  full_name: "Rohan Admin",
  avatar_url: null,
  role: "admin",
  supervisor_id: null,
  job_title: "Platform Administrator",
  created_at: "2026-01-01T09:00:00Z",
  updated_at: "2026-01-01T09:00:00Z",
};

export const MOCK_ORG_MEMBERS: UserProfile[] = [MOCK_ADMIN, MOCK_SUPERVISOR, MOCK_EMPLOYEE];

const WEEK_THEMES: { theme: string; status: RoadmapWeek["status"]; summary: string }[] = [
  { theme: "Flutter Basics", status: "completed", summary: "Widgets, layouts, and navigation fundamentals." },
  { theme: "REST API", status: "active", summary: "Consuming REST APIs with Dio and error handling." },
  { theme: "Firebase", status: "locked", summary: "Auth, Firestore, and push notifications." },
  { theme: "Architecture", status: "locked", summary: "Clean Architecture and Repository Pattern." },
  { theme: "State Management", status: "locked", summary: "Provider, Riverpod, and Bloc." },
  { theme: "Testing", status: "locked", summary: "Unit, widget, and integration tests." },
  { theme: "Performance", status: "locked", summary: "Profiling and optimizing render performance." },
  { theme: "Capstone", status: "locked", summary: "End-to-end project combining every skill so far." },
];

export const MOCK_ROADMAP_WEEKS: RoadmapWeek[] = WEEK_THEMES.map((w, i) => ({
  id: `wk-${i + 1}`,
  roadmap_id: MOCK_ROADMAP_ID,
  week_number: i + 1,
  theme: w.theme,
  summary: w.summary,
  unlock_date: null,
  status: w.status,
}));

export const MOCK_ROADMAP: Roadmap = {
  id: MOCK_ROADMAP_ID,
  user_id: MOCK_EMPLOYEE.id,
  learning_path_id: MOCK_LEARNING_PATH_ID,
  title: "Flutter Project Readiness Track",
  total_weeks: 8,
  status: "in_progress",
  started_at: "2026-06-01T09:00:00Z",
  target_completion_date: "2026-07-27",
  created_at: "2026-06-01T09:00:00Z",
};

export const MOCK_TASKS: Task[] = [
  {
    id: "task-1",
    roadmap_week_id: "wk-1",
    title: "Build a Login Screen",
    description: "Implement a Flutter login screen with form validation and a loading state on submit.",
    requirements: ["TextFormField validation", "Loading state on submit"],
    acceptance_criteria: ["Invalid email shows inline error", "Submit button disables while loading"],
    difficulty: "beginner",
    estimated_hours: 4,
    resources: [],
    deadline: "2026-06-08T00:00:00Z",
    status: "completed",
    created_at: "2026-06-01T09:00:00Z",
  },
  {
    id: "task-2",
    roadmap_week_id: "wk-2",
    title: "Build a Weather REST API Client",
    description: "Consume a public weather REST API and render current conditions in a Flutter screen.",
    requirements: ["Use Dio for networking", "Handle loading and error states", "Cache the last successful response"],
    acceptance_criteria: [
      "App shows a loading indicator while fetching",
      "Network errors show a retry button",
      "Unit test covers the API client's error path",
    ],
    difficulty: "intermediate",
    estimated_hours: 6,
    resources: [{ label: "Dio documentation", url: "https://pub.dev/packages/dio" }],
    deadline: "2026-07-25T00:00:00Z",
    status: "in_progress",
    created_at: "2026-06-08T09:00:00Z",
  },
];

export const MOCK_EVALUATION_REPORTS: EvaluationReport[] = [
  {
    id: "report-1",
    submission_id: "submission-1",
    user_id: MOCK_EMPLOYEE.id,
    architecture: { pattern: "MVC", verdict: "Reasonable for a single screen" },
    folder_structure: { verdict: "Clear separation of widgets and services" },
    problem_solving: { verdict: "Handled edge cases for empty fields" },
    code_quality: { verdict: "Consistent naming, minor duplication in validators" },
    ai_usage: { detected: false },
    evidence: { files_reviewed: ["lib/screens/login_screen.dart", "lib/services/auth_service.dart"] },
    suggestions: ["Extract form validators into a shared utility"],
    confidence: 0.82,
    overall_score: 78,
    generated_at: "2026-06-09T14:00:00Z",
  },
];

export const MOCK_SKILL_SCORES: SkillScore[] = [
  { id: "skill-1", user_id: MOCK_EMPLOYEE.id, skill_name: "Flutter", score: 72, source: "task_evaluation", recorded_at: "2026-07-01T00:00:00Z" },
  { id: "skill-2", user_id: MOCK_EMPLOYEE.id, skill_name: "Dart", score: 68, source: "task_evaluation", recorded_at: "2026-07-01T00:00:00Z" },
  { id: "skill-3", user_id: MOCK_EMPLOYEE.id, skill_name: "Git", score: 80, source: "diagnostic", recorded_at: "2026-06-01T00:00:00Z" },
  { id: "skill-4", user_id: MOCK_EMPLOYEE.id, skill_name: "REST API", score: 55, source: "diagnostic", recorded_at: "2026-06-01T00:00:00Z" },
  { id: "skill-5", user_id: MOCK_EMPLOYEE.id, skill_name: "Clean Architecture", score: 40, source: "diagnostic", recorded_at: "2026-06-01T00:00:00Z" },
  { id: "skill-6", user_id: MOCK_EMPLOYEE.id, skill_name: "Problem Solving", score: 65, source: "diagnostic", recorded_at: "2026-06-01T00:00:00Z" },
  { id: "skill-7", user_id: MOCK_EMPLOYEE.id, skill_name: "Flutter", score: 58, source: "diagnostic", recorded_at: "2026-06-01T00:00:00Z" },
  { id: "skill-8", user_id: MOCK_EMPLOYEE.id, skill_name: "Dart", score: 52, source: "diagnostic", recorded_at: "2026-06-01T00:00:00Z" },
];

export const MOCK_LEARNING_PATHS: LearningPath[] = [
  {
    id: MOCK_LEARNING_PATH_ID,
    organization_id: MOCK_ORG_ID,
    name: "Flutter Project Readiness Track",
    description:
      "8-week roadmap covering Flutter basics, REST APIs, Firebase, architecture, state management, testing, performance, and a capstone project.",
    is_active: true,
    created_at: "2026-01-05T00:00:00Z",
    updated_at: "2026-01-05T00:00:00Z",
  },
];

export const MOCK_PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "prompt-1",
    organization_id: MOCK_ORG_ID,
    key: "code_review.architecture",
    name: "Architecture Review",
    template_body:
      "Review the architecture of the following {{project_type}} project. Folder structure: {{folder_structure}}. Detected patterns: {{detected_patterns}}. Provide a JSON verdict on architecture quality, evidence, and suggestions.",
    variables: ["project_type", "folder_structure", "detected_patterns"],
    version: 1,
    is_active: true,
    updated_at: "2026-01-05T00:00:00Z",
  },
];

export const MOCK_AI_CONFIGURATION: AIConfiguration = {
  id: "ai-config-1",
  organization_id: MOCK_ORG_ID,
  provider: "openai",
  model_name: "gpt-4o",
  temperature: 0.3,
  max_tokens: 2000,
  extra_settings: {},
  updated_at: "2026-01-05T00:00:00Z",
};
