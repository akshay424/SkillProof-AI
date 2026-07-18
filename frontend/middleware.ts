import { NextResponse, type NextRequest } from "next/server";

// Auth is an HttpOnly cookie session (see services/backend/session.ts). Route
// protection is enforced server-side inside each route group's layout via
// getBackendSessionUser(), so middleware is a passthrough.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
