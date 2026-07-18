import { useQuery } from "@tanstack/react-query";

import { MOCK_EMPLOYEE, MOCK_EVALUATION_REPORTS } from "@/mocks/fixtures";
import { createClient } from "@/services/supabase/client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { EvaluationReport } from "@/types/report";

export function useEvaluationReports(userId: string | undefined) {
  return useQuery({
    queryKey: ["evaluation-reports", userId],
    enabled: DEMO_MODE || !!userId,
    queryFn: async (): Promise<EvaluationReport[]> => {
      if (DEMO_MODE) return userId === MOCK_EMPLOYEE.id ? MOCK_EVALUATION_REPORTS : [];

      const supabase = createClient();
      const { data, error } = await supabase
        .from("evaluation_reports")
        .select("*")
        .eq("user_id", userId!)
        .order("generated_at", { ascending: false });
      if (error) throw error;
      return data as EvaluationReport[];
    },
  });
}
