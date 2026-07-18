import { redirect } from "next/navigation";

import { createClient } from "@/services/supabase/server";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { UserRole } from "@/types/user";

export default async function RootPage() {
  if (DEMO_MODE) {
    redirect("/fresher");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile as { role: UserRole } | null)?.role;
  redirect(role ? `/${role}` : "/login");
}
