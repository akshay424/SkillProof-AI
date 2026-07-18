"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useUser } from "@/hooks/use-user";
import { DEMO_MODE } from "@/utils/demo-mode";
import { ROLE_HOME_PATH } from "@/utils/constants";

export default function RootPage() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (DEMO_MODE) {
      router.replace("/fresher");
      return;
    }
    if (isLoading) return;
    router.replace(user ? ROLE_HOME_PATH[user.profile.role] : "/login");
  }, [isLoading, user, router]);

  return null;
}
