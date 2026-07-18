import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/services/supabase/server";
import { DEMO_MODE } from "@/utils/demo-mode";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
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
    if (!profile) redirect("/login");
    if (profile.role !== "employee") redirect("/unauthorized");
  }

  return <AppShell role="employee">{children}</AppShell>;
}
