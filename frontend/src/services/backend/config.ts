export const BACKEND_URL = (
  process.env.SKILLFLOW_BACKEND_URL
  ?? process.env.NEXT_PUBLIC_API_URL
  ?? "http://10.0.128.20:8000"
).replace(/\/$/, "");

export const BACKEND_SESSION_COOKIE = "skillflow_backend_session";
