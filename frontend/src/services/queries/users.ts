import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";

import { demoStore } from "@/mocks/demo-store";
import { MOCK_FRESHER, MOCK_PM } from "@/mocks/fixtures";
import { apiFetch } from "@/services/api-client";
import { normalizeBackendUser, type BackendUserResponse } from "@/services/backend/types";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { UserProfile } from "@/types/user";

interface BackendFresherProfile {
  user_id: string;
  target_role: string | null;
  resume_summary: unknown | null;
  interview_evaluation: unknown | null;
  profile_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PmFresherOverview {
  fresher: BackendUserResponse;
  profile: BackendFresherProfile | null;
  current_roadmap: {
    id: string;
    title: string | null;
    status: string;
    completion_pct: number;
    roadmap_payload: Record<string, unknown> | null;
  } | null;
  latest_daily_report: {
    overall_score: number | null;
    report_payload: Record<string, unknown> | null;
    created_at: string;
  } | null;
  latest_weekly_report: { overall_score: number | null; report_payload: Record<string, unknown> | null; created_at: string } | null;
  final_report: { overall_score: number | null; report_payload: Record<string, unknown> | null; created_at: string } | null;
  insights?: Record<string, unknown>;
}

function textFromValue(value: unknown, preferredKey?: string): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && preferredKey && typeof (value as Record<string, unknown>)[preferredKey] === "string") {
    return (value as Record<string, unknown>)[preferredKey] as string;
  }
  return null;
}

function backendProfileToUserProfile(
  user: { id: string; name: string; role: UserProfile["role"] },
  profile?: BackendFresherProfile | null,
): UserProfile {
  const now = new Date().toISOString();
  return {
    id: user.id,
    organization_id: null,
    full_name: user.name,
    avatar_url: null,
    role: user.role,
    pm_id: null,
    job_title: profile?.target_role ?? (user.role === "fresher" ? "AI Product Developer" : null),
    gitlab_token: null,
    resume_text: textFromValue(profile?.resume_summary, "resume_text"),
    interview_notes: textFromValue(profile?.interview_evaluation, "overall"),
    created_at: profile?.created_at ?? now,
    updated_at: profile?.updated_at ?? now,
  };
}

function demoPersonaForPath(pathname: string): UserProfile {
  const persona = pathname.startsWith("/pm") ? MOCK_PM : MOCK_FRESHER;
  return demoStore.users.find((u) => u.id === persona.id) ?? persona;
}

export function useCurrentUser() {
  const pathname = usePathname();

  return useQuery({
    queryKey: DEMO_MODE ? ["current-user", "demo", pathname] : ["current-user"],
    queryFn: async (): Promise<{ authId: string; email: string | null; profile: UserProfile } | null> => {
      if (DEMO_MODE) {
        const profile = demoPersonaForPath(pathname);
        return { authId: profile.id, email: `${profile.role}.demo@skillproof.ai`, profile };
      }

      try {
        const rawUser = await apiFetch<BackendUserResponse>("/api/auth/me");
        const user = normalizeBackendUser(rawUser);
        if (!user) throw new Error("The backend returned an unsupported user role");
        const profile = user.role === "fresher"
          ? await apiFetch<BackendFresherProfile>("/api/freshers/me/profile")
          : null;
        return {
          authId: user.id,
          email: user.email,
          profile: backendProfileToUserProfile(user, profile),
        };
      } catch (error) {
        if (error instanceof Error && "status" in error && error.status === 401) return null;
        throw error;
      }
    },
  });
}

export function useOrgMembers(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["org-members", organizationId],
    enabled: DEMO_MODE || !!organizationId,
    queryFn: async (): Promise<UserProfile[]> => {
      if (DEMO_MODE) return demoStore.users;
      // The v2 backend does not expose organization-wide membership.
      return [];
    },
  });
}

export function usePmFreshers(pmId: string | undefined) {
  return useQuery({
    queryKey: ["pm-freshers", pmId],
    enabled: DEMO_MODE || !!pmId,
    refetchInterval: DEMO_MODE ? false : 20_000,
    queryFn: async (): Promise<UserProfile[]> => {
      if (DEMO_MODE) return demoStore.users.filter((u) => u.role === "fresher" && u.pm_id === pmId);
      const freshers = await apiFetch<BackendUserResponse[]>("/api/pm/freshers");
      return freshers.flatMap((fresher) => {
        const user = normalizeBackendUser(fresher);
        return user ? [backendProfileToUserProfile(user)] : [];
      });
    },
  });
}

export function useUnassignedFreshers(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["unassigned-freshers", organizationId],
    enabled: DEMO_MODE || !!organizationId,
    queryFn: async (): Promise<UserProfile[]> => {
      if (DEMO_MODE) return demoStore.users.filter((u) => u.role === "fresher" && !u.pm_id);
      // Assignment is backend-owned and the supplied API has no unassigned list endpoint.
      return [];
    },
  });
}

export function useUserProfileById(id: string | undefined) {
  return useQuery({
    queryKey: ["user-profile", id],
    enabled: DEMO_MODE || !!id,
    queryFn: async (): Promise<UserProfile | null> => {
      if (DEMO_MODE) return demoStore.users.find((m) => m.id === id) ?? null;
      try {
        const overview = await apiFetch<{ fresher: BackendUserResponse; profile?: BackendFresherProfile }>(`/api/pm/freshers/${id}/overview`);
        const user = normalizeBackendUser(overview.fresher);
        return user ? backendProfileToUserProfile(user, overview.profile) : null;
      } catch (error) {
        if (error instanceof Error && "status" in error && error.status === 404) return null;
        throw error;
      }
    },
  });
}

export function usePmFresherOverview(id: string | undefined) {
  return useQuery({
    queryKey: ["pm-fresher-overview", id],
    enabled: !!id && !DEMO_MODE,
    refetchInterval: 20_000,
    queryFn: () => apiFetch<PmFresherOverview>(`/api/pm/freshers/${id}/overview`),
  });
}

function invalidateProfileQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["current-user"], refetchType: "all" });
  queryClient.invalidateQueries({ queryKey: ["org-members"], refetchType: "all" });
  queryClient.invalidateQueries({ queryKey: ["pm-freshers"], refetchType: "all" });
  queryClient.invalidateQueries({ queryKey: ["unassigned-freshers"], refetchType: "all" });
  queryClient.invalidateQueries({ queryKey: ["user-profile"], refetchType: "all" });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      updates: Partial<UserProfile>;
      resumeSummary?: unknown;
      interviewEvaluation?: unknown;
    }) => {
      if (!DEMO_MODE) {
        await apiFetch("/api/freshers/me/profile", {
          method: "PATCH",
          body: JSON.stringify({
            target_role: input.updates.job_title ?? "AI Product Developer",
            resume_summary: input.resumeSummary ?? (input.updates.resume_text ? { resume_text: input.updates.resume_text } : null),
            interview_evaluation: input.interviewEvaluation ?? (input.updates.interview_notes ? { overall: input.updates.interview_notes } : null),
          }),
        });
        return;
      }

      const idx = demoStore.users.findIndex((u) => u.id === input.id);
      if (idx !== -1) {
        demoStore.users[idx] = { ...demoStore.users[idx], ...input.updates };
      }
    },
    onSuccess: () => invalidateProfileQueries(queryClient),
  });
}

export function useClaimFresher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { fresherId: string; pmId: string }) => {
      if (!DEMO_MODE) throw new Error("The backend does not provide a fresher-assignment endpoint.");
      const idx = demoStore.users.findIndex((u) => u.id === input.fresherId);
      if (idx !== -1) {
        demoStore.users[idx] = { ...demoStore.users[idx], pm_id: input.pmId };
      }
    },
    onSuccess: () => invalidateProfileQueries(queryClient),
  });
}
