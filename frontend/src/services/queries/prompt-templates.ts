import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { MOCK_PROMPT_TEMPLATES } from "@/mocks/fixtures";
import { createClient } from "@/services/supabase/client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { PromptTemplate } from "@/types/report";

export function usePromptTemplates(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["prompt-templates", organizationId],
    enabled: DEMO_MODE || !!organizationId,
    queryFn: async (): Promise<PromptTemplate[]> => {
      if (DEMO_MODE) return MOCK_PROMPT_TEMPLATES;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("prompt_templates")
        .select("*")
        .eq("organization_id", organizationId!)
        .order("key");
      if (error) throw error;
      return data as unknown as PromptTemplate[];
    },
  });
}

export function useUpdatePromptTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; updates: Partial<PromptTemplate>; updatedBy: string }) => {
      if (DEMO_MODE) return;
      const supabase = createClient();
      const { error } = await supabase
        .from("prompt_templates")
        .update({ ...input.updates, updated_by: input.updatedBy })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prompt-templates"] }),
  });
}
