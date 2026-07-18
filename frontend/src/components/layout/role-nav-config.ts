import {
  BarChart3,
  BookOpen,
  Brain,
  FileText,
  LayoutDashboard,
  Settings,
  Sparkles,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { UserRole } from "@/types/user";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  employee: [
    { label: "Dashboard", href: "/employee", icon: LayoutDashboard },
    { label: "Roadmap", href: "/employee/roadmap", icon: BookOpen },
    { label: "Reports", href: "/employee/reports", icon: FileText },
    { label: "Profile", href: "/employee/settings/profile", icon: Settings },
  ],
  supervisor: [
    { label: "Dashboard", href: "/supervisor", icon: LayoutDashboard },
  ],
  admin: [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: UsersRound },
    { label: "Learning Paths", href: "/admin/learning-paths", icon: BookOpen },
    { label: "Prompt Templates", href: "/admin/prompt-templates", icon: Sparkles },
    { label: "AI Configuration", href: "/admin/ai-configuration", icon: Brain },
  ],
};

export const ROLE_ICON: Record<UserRole, LucideIcon> = {
  employee: LayoutDashboard,
  supervisor: BarChart3,
  admin: Brain,
};
