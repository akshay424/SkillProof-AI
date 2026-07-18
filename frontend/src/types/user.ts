export type UserRole = "fresher" | "pm";

export interface UserProfile {
  id: string;
  organization_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  pm_id: string | null;
  job_title: string | null;
  target_role: string | null;
  gitlab_token: string | null;
  gitlab_repo_url: string | null;
  resume_text: string | null;
  interview_notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Shape returned by the real backend's /api/auth/login and /api/auth/me. */
export interface BackendAuthUser {
  id: string;
  email: string;
  name: string;
  role: "FRESHER" | "PM";
  is_active: boolean;
}

/** Shape returned by the real backend's /api/freshers/me/profile. */
export interface BackendFresherProfile {
  id: string;
  user_id: string;
  target_role: string | null;
  joining_date: string | null;
  resume_summary: unknown;
  interview_evaluation: unknown;
  current_roadmap_id: string | null;
  profile_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}
