import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";

import { MOCK_ADMIN, MOCK_EMPLOYEE, MOCK_ORG_MEMBERS, MOCK_SUPERVISOR } from "@/mocks/fixtures";
import { createClient } from "@/services/supabase/client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { UserProfile } from "@/types/user";

function demoPersonaForPath(pathname: string): UserProfile {
  if (pathname.startsWith("/admin")) return MOCK_ADMIN;
  if (pathname.startsWith("/supervisor")) return MOCK_SUPERVISOR;
  return MOCK_EMPLOYEE;
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
      if (DEMO_MODE) return MOCK_ORG_MEMBERS;

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

export function useDirectReports(supervisorId: string | undefined) {
  return useQuery({
    queryKey: ["direct-reports", supervisorId],
    enabled: DEMO_MODE || !!supervisorId,
    queryFn: async (): Promise<UserProfile[]> => {
      if (DEMO_MODE) return supervisorId === MOCK_SUPERVISOR.id ? [MOCK_EMPLOYEE] : [];

      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("supervisor_id", supervisorId!)
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
      if (DEMO_MODE) return MOCK_ORG_MEMBERS.find((m) => m.id === id) ?? null;

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

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; updates: Partial<UserProfile> }) => {
      if (DEMO_MODE) return;

      const supabase = createClient();
      const { error } = await supabase
        .from("user_profiles")
        .update(input.updates)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      queryClient.invalidateQueries({ queryKey: ["org-members"] });
      queryClient.invalidateQueries({ queryKey: ["direct-reports"] });
    },
  });
}
