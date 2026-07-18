import type { UserRole } from "@/types/user";

export function canManage(viewerRole: UserRole, targetRole: UserRole): boolean {
  if (viewerRole === "admin") return true;
  if (viewerRole === "supervisor") return targetRole === "employee";
  return false;
}

export function isAtLeastSupervisor(role: UserRole | undefined): boolean {
  return role === "supervisor" || role === "admin";
}
