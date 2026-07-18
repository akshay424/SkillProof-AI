import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { demoId, demoStore } from "@/mocks/demo-store";
import { createClient } from "@/services/supabase/client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { EvaluationReport } from "@/types/report";

export function useEvaluationReports(userId: string | undefined) {
  return useQuery({
    queryKey: ["evaluation-reports", userId],
    enabled: DEMO_MODE || !!userId,
    queryFn: async (): Promise<EvaluationReport[]> => {
      if (DEMO_MODE) {
        return demoStore.evaluationReports
          .filter((r) => r.user_id === userId)
          .sort((a, b) => b.generated_at.localeCompare(a.generated_at));
      }

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

/** Demo-mode only for now (writes to the in-memory demoStore) — real Supabase persistence is a later phase. */
export function useCreateEvaluationReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<EvaluationReport, "id" | "generated_at">) => {
      const report: EvaluationReport = {
        ...input,
        id: demoId("report"),
        generated_at: new Date().toISOString(),
      };
      demoStore.evaluationReports.push(report);
      return report;
    },
    onSuccess: (report) => {
      queryClient.setQueryData(
        ["evaluation-reports", report.user_id],
        demoStore.evaluationReports
          .filter((r) => r.user_id === report.user_id)
          .sort((a, b) => b.generated_at.localeCompare(a.generated_at)),
      );
    },
  });
}
