import { NextResponse } from "next/server";

import { BACKEND_SESSION_COOKIE, BACKEND_URL } from "@/services/backend/config";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const ALLOWED_PATHS = [
  /^\/api\/auth\/me$/,
  /^\/api\/freshers\/me(?:\/(?:profile|roadmaps(?:\/.+)?|reports(?:\/.+)?))?$/,
  /^\/api\/pm(?:\/(?:dashboard|freshers(?:\/.+)?))?$/,
];

async function forward(request: Request, { params }: RouteContext) {
  const token = request.headers.get("cookie")
    ?.split("; ")
    .find((part) => part.startsWith(`${BACKEND_SESSION_COOKIE}=`))
    ?.slice(BACKEND_SESSION_COOKIE.length + 1);
  if (!token) return NextResponse.json({ detail: "Authentication required" }, { status: 401 });

  const { path } = await params;
  const upstreamPath = `/${path.join("/")}`;
  if (!ALLOWED_PATHS.some((pattern) => pattern.test(upstreamPath))) {
    return NextResponse.json({ detail: "This backend route is not available to the dashboard" }, { status: 403 });
  }
  const requestUrl = new URL(request.url);
  const backendUrl = new URL(upstreamPath, BACKEND_URL);
  backendUrl.search = requestUrl.search;

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${decodeURIComponent(token)}`);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  try {
    const backendResponse = await fetch(backendUrl, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    });
    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers: { "Content-Type": backendResponse.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "Unable to reach the backend service" }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const PUT = forward;
export const DELETE = forward;
