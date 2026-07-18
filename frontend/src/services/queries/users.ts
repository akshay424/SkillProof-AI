import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";

import { demoStore } from "@/mocks/demo-store";
import { MOCK_FRESHER, MOCK_PM } from "@/mocks/fixtures";
import { apiFetch, clearToken, getToken, setToken } from "@/services/api-client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { BackendAuthUser, BackendFresherProfile, UserProfile, UserRole } from "@/types/user";

function demoPersonaForPath(pathname: string): UserProfile {
  const persona = pathname.startsWith("/pm") ? MOCK_PM : MOCK_FRESHER;
  return demoStore.users.find((u) => u.id === persona.id) ?? persona;
}

function backendProfileToUserProfile(user: BackendAuthUser, profile: BackendFresherProfile | null): UserProfile {
  const metadata = profile?.profile_metadata ?? {};
  return {
    id: profile?.id ?? user.id,
    organization_id: null,
    full_name: user.name,
    avatar_url: null,
    role: user.role.toLowerCase() as UserRole,
    pm_id: null,
    job_title: typeof metadata.job_title === "string" ? metadata.job_title : null,
    target_role: profile?.target_role ?? null,
    gitlab_token: typeof metadata.gitlab_token === "string" ? metadata.gitlab_token : null,
    gitlab_repo_url: typeof metadata.gitlab_repo_url === "string" ? metadata.gitlab_repo_url : null,
    resume_text: typeof profile?.resume_summary === "string" ? profile.resume_summary : null,
    interview_notes: typeof profile?.interview_evaluation === "string" ? profile.interview_evaluation : null,
    created_at: profile?.created_at ?? new Date().toISOString(),
    updated_at: profile?.updated_at ?? new Date().toISOString(),
  };
}

export async function login(email: string, password: string) {
  const data = await apiFetch<{ access_token: string; user: BackendAuthUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  return data.user;
}

export function logout() {
  clearToken();
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

      if (!getToken()) return null;

      const user = await apiFetch<BackendAuthUser>("/api/auth/me");
      const profile =
        user.role === "FRESHER" ? await apiFetch<BackendFresherProfile>("/api/freshers/me/profile") : null;

      return { authId: user.id, email: user.email, profile: backendProfileToUserProfile(user, profile) };
    },
  });
}

function invalidateProfileQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["current-user"], refetchType: "all" });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; updates: Partial<UserProfile> }) => {
      if (DEMO_MODE) {
        const idx = demoStore.users.findIndex((u) => u.id === input.id);
        if (idx !== -1) {
          demoStore.users[idx] = { ...demoStore.users[idx], ...input.updates };
        }
        return;
      }

      // Merge with the cached current profile so a partial update (e.g. onboarding
      // only sending resume/notes) doesn't blank out unrelated profile_metadata
      // fields — PATCH replaces profile_metadata wholesale, not a deep merge.
      const cached = queryClient
        .getQueriesData<{ profile: UserProfile } | null>({ queryKey: ["current-user"] })
        .map(([, data]) => data)
        .find((data): data is { profile: UserProfile } => !!data);
      const current = cached?.profile;
      const merged = { ...current, ...input.updates };

      await apiFetch<BackendFresherProfile>("/api/freshers/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          target_role: merged.target_role ?? null,
          resume_summary: merged.resume_text ?? null,
          interview_evaluation: merged.interview_notes ?? null,
          profile_metadata: {
            job_title: merged.job_title ?? null,
            gitlab_token: merged.gitlab_token ?? null,
            gitlab_repo_url: merged.gitlab_repo_url ?? null,
          },
        }),
      });
    },
    onSuccess: () => invalidateProfileQueries(queryClient),
  });
}
