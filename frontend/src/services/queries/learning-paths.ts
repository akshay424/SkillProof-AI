import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { MOCK_LEARNING_PATHS } from "@/mocks/fixtures";
import { createClient } from "@/services/supabase/client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { LearningPath } from "@/types/roadmap";

export function useLearningPaths(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["learning-paths", organizationId],
    enabled: DEMO_MODE || !!organizationId,
    queryFn: async (): Promise<LearningPath[]> => {
      if (DEMO_MODE) return MOCK_LEARNING_PATHS;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("learning_paths")
        .select("*")
        .eq("organization_id", organizationId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LearningPath[];
    },
  });
}

export function useCreateLearningPath() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { organization_id: string; name: string; description: string }) => {
      if (DEMO_MODE) return;
      const supabase = createClient();
      const { error } = await supabase.from("learning_paths").insert(input);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learning-paths"] }),
  });
}

export function useUpdateLearningPath() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; updates: Partial<LearningPath> }) => {
      if (DEMO_MODE) return;
      const supabase = createClient();
      const { error } = await supabase
        .from("learning_paths")
        .update(input.updates)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learning-paths"] }),
  });
}

export function useDeleteLearningPath() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (DEMO_MODE) return;
      const supabase = createClient();
      const { error } = await supabase.from("learning_paths").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learning-paths"] }),
  });
}
