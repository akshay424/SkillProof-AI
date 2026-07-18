import { NextResponse, type NextRequest } from "next/server";

import { BACKEND_SESSION_COOKIE } from "@/services/backend/config";

function isProtectedPath(pathname: string) {
  return pathname.startsWith("/fresher") || pathname.startsWith("/pm");
}

export async function updateSession(request: NextRequest) {
  if (isProtectedPath(request.nextUrl.pathname) && !request.cookies.get(BACKEND_SESSION_COOKIE)?.value) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  return NextResponse.next({ request });
}
