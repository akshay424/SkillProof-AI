import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/services/supabase/server";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { UserRole } from "@/types/user";

export default async function FresherLayout({ children }: { children: React.ReactNode }) {
  if (!DEMO_MODE) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const role = (profile as { role: UserRole } | null)?.role;
    if (!role) redirect("/login");
    if (role !== "fresher") redirect("/unauthorized");
  }

  return <AppShell role="fresher">{children}</AppShell>;
}
