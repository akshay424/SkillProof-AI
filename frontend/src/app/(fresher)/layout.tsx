"use client";

import { AppShell } from "@/components/layout/app-shell";
import { RoleGuard } from "@/components/shared/role-guard";

export default function FresherLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="fresher">
      <AppShell role="fresher">{children}</AppShell>
    </RoleGuard>
  );
}
