import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { MOCK_AI_CONFIGURATION } from "@/mocks/fixtures";
import { createClient } from "@/services/supabase/client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { AIConfiguration } from "@/types/report";

export function useAIConfiguration(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["ai-configuration", organizationId],
    enabled: DEMO_MODE || !!organizationId,
    queryFn: async (): Promise<AIConfiguration | null> => {
      if (DEMO_MODE) return MOCK_AI_CONFIGURATION;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("ai_configuration")
        .select("*")
        .eq("organization_id", organizationId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as AIConfiguration | null;
    },
  });
}

export function useUpdateAIConfiguration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; updates: Partial<AIConfiguration> }) => {
      if (DEMO_MODE) return;
      const supabase = createClient();
      const { error } = await supabase
        .from("ai_configuration")
        .update(input.updates)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-configuration"] }),
  });
}
