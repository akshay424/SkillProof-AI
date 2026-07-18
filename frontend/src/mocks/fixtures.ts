import type { UserProfile } from "@/types/user";

export const MOCK_ORG_ID = "11111111-1111-1111-1111-111111111111";

export const MOCK_PM: UserProfile = {
  id: "aaaaaaaa-0000-0000-0000-000000000002",
  organization_id: MOCK_ORG_ID,
  full_name: "Priya PM",
  avatar_url: null,
  role: "pm",
  pm_id: null,
  job_title: "Engineering Team Lead",
  gitlab_token: null,
  resume_text: null,
  interview_notes: null,
  created_at: "2026-03-01T09:00:00Z",
  updated_at: "2026-03-01T09:00:00Z",
};

export const MOCK_FRESHER: UserProfile = {
  id: "aaaaaaaa-0000-0000-0000-000000000001",
  organization_id: MOCK_ORG_ID,
  full_name: "Aarav Fresher",
  avatar_url: null,
  role: "fresher",
  pm_id: MOCK_PM.id,
  job_title: "Flutter Developer Trainee",
  gitlab_token: null,
  resume_text:
    "Aarav Kumar — B.Tech Computer Science. Projects: a Flutter expense tracker app, a React portfolio site. Skills: Dart, Flutter, Git, basic REST API consumption.",
  interview_notes:
    "Strong fundamentals in Dart/Flutter widget composition. Limited exposure to REST APIs, state management, and testing. Recommend starting with basics and building up to architecture and testing.",
  created_at: "2026-05-01T09:00:00Z",
  updated_at: "2026-07-10T09:00:00Z",
};

export const MOCK_UNASSIGNED_FRESHER: UserProfile = {
  id: "aaaaaaaa-0000-0000-0000-000000000004",
  organization_id: MOCK_ORG_ID,
  full_name: "Diya New",
  avatar_url: null,
  role: "fresher",
  pm_id: null,
  job_title: null,
  gitlab_token: null,
  resume_text: null,
  interview_notes: null,
  created_at: "2026-07-17T09:00:00Z",
  updated_at: "2026-07-17T09:00:00Z",
};

export const MOCK_ORG_MEMBERS: UserProfile[] = [MOCK_PM, MOCK_FRESHER, MOCK_UNASSIGNED_FRESHER];
