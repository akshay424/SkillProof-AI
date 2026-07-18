"use client";

import { AppShell } from "@/components/layout/app-shell";
import { RoleGuard } from "@/components/shared/role-guard";

export default function PmLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="pm">
      <AppShell role="pm">{children}</AppShell>
    </RoleGuard>
  );
}
