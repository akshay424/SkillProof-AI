import { NextResponse } from "next/server";

import { createClient } from "@/services/supabase/server";
import type { UserRole } from "@/types/user";
import { ROLE_HOME_PATH } from "@/utils/constants";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectPath = searchParams.get("redirect");

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  if (redirectPath) {
    return NextResponse.redirect(`${origin}${redirectPath}`);
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = profile?.role as UserRole | undefined;
  const destination = role ? ROLE_HOME_PATH[role] : "/login";
  return NextResponse.redirect(`${origin}${destination}`);
}
