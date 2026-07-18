import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";

import { demoStore } from "@/mocks/demo-store";
import { MOCK_FRESHER, MOCK_PM } from "@/mocks/fixtures";
import { createClient } from "@/services/supabase/client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { UserProfile } from "@/types/user";

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

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;

      return { authId: user.id, email: user.email ?? null, profile: profile as UserProfile };
    },
  });
}

export function useOrgMembers(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["org-members", organizationId],
    enabled: DEMO_MODE || !!organizationId,
    queryFn: async (): Promise<UserProfile[]> => {
      if (DEMO_MODE) return demoStore.users;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("organization_id", organizationId!)
        .order("full_name");
      if (error) throw error;
      return data as UserProfile[];
    },
  });
}

export function usePmFreshers(pmId: string | undefined) {
  return useQuery({
    queryKey: ["pm-freshers", pmId],
    enabled: DEMO_MODE || !!pmId,
    queryFn: async (): Promise<UserProfile[]> => {
      if (DEMO_MODE) return demoStore.users.filter((u) => u.role === "fresher" && u.pm_id === pmId);

      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("pm_id", pmId!)
        .order("full_name");
      if (error) throw error;
      return data as UserProfile[];
    },
  });
}

export function useUnassignedFreshers(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["unassigned-freshers", organizationId],
    enabled: DEMO_MODE || !!organizationId,
    queryFn: async (): Promise<UserProfile[]> => {
      if (DEMO_MODE) return demoStore.users.filter((u) => u.role === "fresher" && !u.pm_id);

      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("organization_id", organizationId!)
        .eq("role", "fresher")
        .is("pm_id", null)
        .order("full_name");
      if (error) throw error;
      return data as UserProfile[];
    },
  });
}

export function useUserProfileById(id: string | undefined) {
  return useQuery({
    queryKey: ["user-profile", id],
    enabled: DEMO_MODE || !!id,
    queryFn: async (): Promise<UserProfile | null> => {
      if (DEMO_MODE) return demoStore.users.find((m) => m.id === id) ?? null;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as UserProfile | null;
    },
  });
}

function invalidateProfileQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["current-user"], refetchType: "all" });
  queryClient.invalidateQueries({ queryKey: ["org-members"], refetchType: "all" });
  queryClient.invalidateQueries({ queryKey: ["pm-freshers"], refetchType: "all" });
  queryClient.invalidateQueries({ queryKey: ["unassigned-freshers"], refetchType: "all" });
  queryClient.invalidateQueries({ queryKey: ["user-profile"], refetchType: "all" });
}

/** Demo-mode only for now (mutates the in-memory demoStore) — real Supabase persistence is a later phase. */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; updates: Partial<UserProfile> }) => {
      const idx = demoStore.users.findIndex((u) => u.id === input.id);
      if (idx !== -1) {
        demoStore.users[idx] = { ...demoStore.users[idx], ...input.updates };
      }
    },
    onSuccess: () => invalidateProfileQueries(queryClient),
  });
}

/** Demo-mode only for now (mutates the in-memory demoStore) — real Supabase persistence is a later phase. */
export function useClaimFresher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { fresherId: string; pmId: string }) => {
      const idx = demoStore.users.findIndex((u) => u.id === input.fresherId);
      if (idx !== -1) {
        demoStore.users[idx] = { ...demoStore.users[idx], pm_id: input.pmId };
      }
    },
    onSuccess: () => invalidateProfileQueries(queryClient),
  });
}
