import type { UserRole } from "@/types/user";

export const ROLE_LABELS: Record<UserRole, string> = {
  employee: "Employee",
  supervisor: "Supervisor",
  admin: "Admin",
};

export const ROLE_HOME_PATH: Record<UserRole, string> = {
  employee: "/employee",
  supervisor: "/supervisor",
  admin: "/admin",
};

export const SKILL_SCORE_BANDS = [
  { min: 80, label: "Strong", colorVar: "--success" },
  { min: 50, label: "Developing", colorVar: "--warning" },
  { min: 0, label: "Needs focus", colorVar: "--danger" },
] as const;
