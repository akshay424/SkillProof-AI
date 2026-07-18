"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useUser } from "@/hooks/use-user";
import type { UserRole } from "@/types/user";

export function useRequireRole(...allowedRoles: UserRole[]) {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!allowedRoles.includes(user.profile.role)) {
      router.replace("/unauthorized");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user, router]);

  return { user, isLoading };
}
