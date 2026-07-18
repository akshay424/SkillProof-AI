import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/services/supabase/middleware";
import { DEMO_MODE } from "@/utils/demo-mode";

export async function middleware(request: NextRequest) {
  if (DEMO_MODE) {
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
