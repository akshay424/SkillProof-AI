import "server-only";

import { cookies } from "next/headers";

import { BACKEND_SESSION_COOKIE, BACKEND_URL } from "@/services/backend/config";
import { normalizeBackendUser, type BackendUser, type BackendUserResponse } from "@/services/backend/types";

export async function getBackendSessionUser(): Promise<BackendUser | null> {
  const token = (await cookies()).get(BACKEND_SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const user = await response.json() as BackendUserResponse;
    return normalizeBackendUser(user);
  } catch {
    return null;
  }
}
