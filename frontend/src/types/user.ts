export type UserRole = "employee" | "supervisor" | "admin";

export interface UserProfile {
  id: string;
  organization_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  supervisor_id: string | null;
  job_title: string | null;
  created_at: string;
  updated_at: string;
}
