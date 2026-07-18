import { NextResponse } from "next/server";

import { BACKEND_SESSION_COOKIE } from "@/services/backend/config";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(BACKEND_SESSION_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" });
  return response;
}
