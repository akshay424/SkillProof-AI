import { BookOpen, FileText, LayoutDashboard, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { UserRole } from "@/types/user";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  fresher: [
    { label: "Dashboard", href: "/fresher", icon: LayoutDashboard },
    { label: "Roadmap", href: "/fresher/roadmap", icon: BookOpen },
    { label: "Reports", href: "/fresher/reports", icon: FileText },
    { label: "Profile", href: "/fresher/settings/profile", icon: Settings },
  ],
  pm: [{ label: "Dashboard", href: "/pm", icon: LayoutDashboard }],
};
