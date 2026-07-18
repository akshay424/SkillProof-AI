"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useUser } from "@/hooks/use-user";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { UserRole } from "@/types/user";

export function RoleGuard({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (DEMO_MODE || isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.profile.role !== role) {
      router.replace("/unauthorized");
    }
  }, [isLoading, user, role, router]);

  if (!DEMO_MODE && (isLoading || !user || user.profile.role !== role)) {
    return null;
  }

  return <>{children}</>;
}
