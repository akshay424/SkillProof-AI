import { redirect } from "next/navigation";

import { createClient } from "@/services/supabase/server";
import { DEMO_MODE } from "@/utils/demo-mode";

export default async function RootPage() {
  if (DEMO_MODE) {
    redirect("/employee");
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

  redirect(profile ? `/${profile.role}` : "/login");
}
