import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { demoId, demoStore } from "@/mocks/demo-store";
import { apiFetch } from "@/services/api-client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { EvaluationReport } from "@/types/report";
import type { FinalEvaluationOutput, RoadmapCompletionOutput, WeeklyEvaluationOutput } from "@/types/evaluation";

interface BackendReportOut {
  id: string;
  client_report_id: string;
  fresher_id: string;
  roadmap_id: string | null;
  report_type: string;
  report_date: string | null;
  period_start: string | null;
  period_end: string | null;
  overall_score: number | null;
  needs_human_interaction: boolean;
  report_payload: unknown;
  created_at: string;
  updated_at: string;
}

function mapBackendReport(r: BackendReportOut): EvaluationReport {
  const type = r.report_type.toUpperCase();
  const payload = type === "DAILY" ? (r.report_payload as FinalEvaluationOutput | null) : null;
  const weeklyPayload = type === "WEEKLY" ? (r.report_payload as WeeklyEvaluationOutput | null) : null;
  const finalPayload = type === "FINAL" ? (r.report_payload as RoadmapCompletionOutput | null) : null;

  return {
    id: r.id,
    submission_id: null,
    user_id: r.fresher_id,
    report_type: type === "DAILY" ? "task" : type === "WEEKLY" ? "weekly" : "final",
    architecture: null,
    folder_structure: null,
    problem_solving: null,
    code_quality: null,
    ai_usage: null,
    evidence: null,
    suggestions: payload?.recommended_next_task ? [payload.recommended_next_task.title] : null,
    summary: payload?.overall_result.summary ?? weeklyPayload?.next_week_plan.reason ?? finalPayload?.overall_result.summary ?? null,
    confidence: payload
      ? payload.competencies.reduce((sum, c) => sum + c.proposed_confidence, 0) / (payload.competencies.length || 1)
      : finalPayload?.overall_result.overall_confidence ?? null,
    overall_score: r.overall_score,
    generated_at: r.created_at,
  };
}

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

      const reports = await apiFetch<BackendReportOut[]>("/api/freshers/me/reports");
      return reports.map(mapBackendReport).sort((a, b) => b.generated_at.localeCompare(a.generated_at));
    },
  });
}

/** The full Final Evaluation Agent output for each daily report this fresher has —
 * needed by the Weekly/Roadmap Completion agents, which read the rich contract
 * (competencies, gaps, strengths), not just the flat EvaluationReport summary. */
export function useDailyReportPayloads(userId: string | undefined) {
  return useQuery({
    queryKey: ["daily-report-payloads", userId],
    enabled: DEMO_MODE || !!userId,
    queryFn: async (): Promise<FinalEvaluationOutput[]> => {
      if (DEMO_MODE) {
        return demoStore.dailyReportPayloads.filter((r) => r.userId === userId).map((r) => r.payload);
      }

      const reports = await apiFetch<BackendReportOut[]>("/api/freshers/me/reports/daily");
      return reports.map((r) => r.report_payload as FinalEvaluationOutput);
    },
  });
}

/** The full Weekly Evaluation Agent output for each weekly report this fresher has
 * — needed by the Roadmap Completion agent's evidence history. */
export function useWeeklyReportPayloads(userId: string | undefined) {
  return useQuery({
    queryKey: ["weekly-report-payloads", userId],
    enabled: DEMO_MODE || !!userId,
    queryFn: async (): Promise<WeeklyEvaluationOutput[]> => {
      if (DEMO_MODE) {
        return demoStore.weeklyReportPayloads.filter((r) => r.userId === userId).map((r) => r.payload);
      }

      const reports = await apiFetch<BackendReportOut[]>("/api/freshers/me/reports/weekly");
      return reports.map((r) => r.report_payload as WeeklyEvaluationOutput);
    },
  });
}

function invalidateReportQueries(queryClient: ReturnType<typeof useQueryClient>, userId: string) {
  queryClient.invalidateQueries({ queryKey: ["evaluation-reports", userId], refetchType: "all" });
  queryClient.invalidateQueries({ queryKey: ["daily-report-payloads", userId], refetchType: "all" });
  queryClient.invalidateQueries({ queryKey: ["weekly-report-payloads", userId], refetchType: "all" });
}

/**
 * Submits the Final Evaluation Agent's PM-ready report (see
 * agents/final-evaluation.md "Backend handoff") to the real backend, or mirrors
 * it into the demo store in demo mode so Recent Reports still populates.
 */
export function useCreateDailyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      userId: string;
      roadmapId: string;
      report: FinalEvaluationOutput;
    }): Promise<EvaluationReport> => {
      const reportDate = input.report.roadmap.evaluation_date;
      const overallScore = input.report.overall_result.proposed_score ?? 0;

      if (DEMO_MODE) {
        const report: EvaluationReport = {
          id: demoId("report"),
          submission_id: null,
          user_id: input.userId,
          report_type: "task",
          architecture: null,
          folder_structure: null,
          problem_solving: null,
          code_quality: null,
          ai_usage: null,
          evidence: null,
          suggestions: [input.report.recommended_next_task.title],
          summary: input.report.overall_result.summary,
          confidence:
            input.report.competencies.reduce((sum, c) => sum + c.proposed_confidence, 0) /
            (input.report.competencies.length || 1),
          overall_score: overallScore,
          generated_at: new Date().toISOString(),
        };
        demoStore.evaluationReports.push(report);
        demoStore.dailyReportPayloads.push({ userId: input.userId, payload: input.report });
        return report;
      }

      // The backend validates report_payload.task_id against the roadmap's
      // current_task and enriches report_payload.evaluation with the task's own
      // acceptance/evaluation criteria — task_id/submission/evaluation are the
      // keys it looks for; the rest of our richer FinalEvaluationOutput rides
      // along unchanged for our own PM-report rendering.
      const created = await apiFetch<BackendReportOut>("/api/freshers/me/reports/daily", {
        method: "POST",
        body: JSON.stringify({
          client_report_id: input.report.report_id,
          roadmap_id: input.roadmapId,
          report_date: reportDate,
          overall_score: overallScore,
          needs_human_interaction: input.report.human_review.required,
          report_payload: {
            task_id: input.report.roadmap.task_id,
            submission: {
              repository: input.report.work_summary.repository,
              branch: input.report.work_summary.branch,
              base_commit: input.report.work_summary.base_commit,
              head_commit: input.report.work_summary.head_commit,
            },
            evaluation: { score: overallScore },
            ...input.report,
          },
        }),
      });
      return mapBackendReport(created);
    },
    onSuccess: (report) => invalidateReportQueries(queryClient, report.user_id),
  });
}

/** Submits the Weekly Evaluation Agent's report (agents/weekly-evaluation.md
 * "Backend handoff") to POST /api/freshers/me/reports/weekly. */
export function useCreateWeeklyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      userId: string;
      roadmapId: string;
      report: WeeklyEvaluationOutput;
    }): Promise<EvaluationReport> => {
      const overallScore = input.report.work_summary.average_task_score ?? 0;

      if (DEMO_MODE) {
        const report: EvaluationReport = {
          id: demoId("report"),
          submission_id: null,
          user_id: input.userId,
          report_type: "weekly",
          architecture: null,
          folder_structure: null,
          problem_solving: null,
          code_quality: null,
          ai_usage: null,
          evidence: null,
          suggestions: [input.report.next_week_plan.recommended_task],
          summary: input.report.next_week_plan.reason,
          confidence: input.report.work_summary.average_confidence,
          overall_score: overallScore,
          generated_at: new Date().toISOString(),
        };
        demoStore.evaluationReports.push(report);
        demoStore.weeklyReportPayloads.push({ userId: input.userId, payload: input.report });
        return report;
      }

      const created = await apiFetch<BackendReportOut>("/api/freshers/me/reports/weekly", {
        method: "POST",
        body: JSON.stringify({
          client_report_id: input.report.report_id,
          roadmap_id: input.roadmapId,
          period_start: input.report.period.start,
          period_end: input.report.period.end,
          overall_score: overallScore,
          needs_human_interaction: input.report.human_review.required,
          report_payload: input.report,
        }),
      });
      return mapBackendReport(created);
    },
    onSuccess: (report) => invalidateReportQueries(queryClient, report.user_id),
  });
}

/** Submits the Roadmap Completion Agent's report (agents/roadmap-completion.md
 * "PM handoff sequence") to POST /api/freshers/me/reports/final. Caller must call
 * useCompleteRoadmap first, per the agent doc's sequence. */
export function useCreateFinalReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      userId: string;
      roadmapId: string;
      report: RoadmapCompletionOutput;
    }): Promise<EvaluationReport> => {
      const overallScore = input.report.overall_result.average_final_task_score ?? 0;

      if (DEMO_MODE) {
        const report: EvaluationReport = {
          id: demoId("report"),
          submission_id: null,
          user_id: input.userId,
          report_type: "final",
          architecture: null,
          folder_structure: null,
          problem_solving: null,
          code_quality: null,
          ai_usage: null,
          evidence: null,
          suggestions: [input.report.recommended_next_stage.title],
          summary: input.report.overall_result.summary,
          confidence: input.report.overall_result.overall_confidence,
          overall_score: overallScore,
          generated_at: new Date().toISOString(),
        };
        demoStore.evaluationReports.push(report);
        demoStore.roadmapCompletionPayloads.push({ userId: input.userId, payload: input.report });
        return report;
      }

      const created = await apiFetch<BackendReportOut>("/api/freshers/me/reports/final", {
        method: "POST",
        body: JSON.stringify({
          client_report_id: input.report.report_id,
          roadmap_id: input.roadmapId,
          report_date: input.report.roadmap.completion_date.slice(0, 10),
          overall_score: overallScore,
          needs_human_interaction: input.report.pm_review.required,
          report_payload: input.report,
        }),
      });
      return mapBackendReport(created);
    },
    onSuccess: (report) => invalidateReportQueries(queryClient, report.user_id),
  });
}
