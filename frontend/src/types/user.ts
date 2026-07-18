export type UserRole = "fresher" | "pm";

export interface UserProfile {
  id: string;
  organization_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  pm_id: string | null;
  job_title: string | null;
  gitlab_token: string | null;
  gitlab_repo_url: string | null;
  resume_text: string | null;
  interview_notes: string | null;
  created_at: string;
  updated_at: string;
}
