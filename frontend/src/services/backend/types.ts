import type { UserRole } from "@/types/user";

export interface BackendUserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface BackendUser extends Omit<BackendUserResponse, "role"> {
  role: UserRole;
}

export function normalizeBackendUser(user: BackendUserResponse): BackendUser | null {
  const role = user.role.toLowerCase();
  if (role !== "fresher" && role !== "pm") return null;
  return { ...user, role };
}
