import { NextResponse, type NextRequest } from "next/server";

// Auth is a bearer JWT held in localStorage (from the real SkillFlow API), not a
// cookie session, so middleware can't inspect or refresh it server-side. Route
// protection happens client-side instead — see components/shared/role-guard.tsx.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
