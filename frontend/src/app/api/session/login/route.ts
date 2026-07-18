import { NextResponse } from "next/server";

import { BACKEND_SESSION_COOKIE, BACKEND_URL } from "@/services/backend/config";
import { normalizeBackendUser, type BackendUserResponse } from "@/services/backend/types";

type LoginPayload = {
  email?: string;
  password?: string;
};

type BackendLoginResponse = {
  access_token: string;
  token_type: string;
  user: BackendUserResponse;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as LoginPayload | null;
  if (!body?.email?.trim() || !body.password) {
    return NextResponse.json({ detail: "Email and password are required" }, { status: 400 });
  }

  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email.trim(), password: body.password }),
      cache: "no-store",
    });
    const responseBody = await backendResponse.json().catch(() => ({})) as BackendLoginResponse & { detail?: string };

    const user = responseBody.user ? normalizeBackendUser(responseBody.user) : null;
    if (!backendResponse.ok || !responseBody.access_token || !user) {
      return NextResponse.json(
        { detail: responseBody.detail ?? "Backend login failed" },
        { status: backendResponse.status || 502 },
      );
    }

    const response = NextResponse.json({ user });
    response.cookies.set(BACKEND_SESSION_COOKIE, responseBody.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ detail: "Unable to reach the backend login service" }, { status: 502 });
  }
}
