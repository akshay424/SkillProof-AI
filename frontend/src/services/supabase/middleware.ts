import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database.types";
import type { UserRole } from "@/types/user";

const ROLE_HOME: Record<UserRole, string> = {
  employee: "/employee",
  supervisor: "/supervisor",
  admin: "/admin",
};

function roleForPath(pathname: string): UserRole | null {
  if (pathname.startsWith("/employee")) return "employee";
  if (pathname.startsWith("/supervisor")) return "supervisor";
  if (pathname.startsWith("/admin")) return "admin";
  return null;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth/callback");
  const requiredRole = roleForPath(pathname);
  const isProtectedRoute = requiredRole !== null;

  if (!user && isProtectedRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (isAuthRoute || pathname === "/")) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role as UserRole | undefined;
    if (role) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
    }
  }

  if (user && requiredRole) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role as UserRole | undefined;
    const allowed = role === requiredRole || (requiredRole === "supervisor" && role === "admin");

    if (!allowed) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return response;
}
