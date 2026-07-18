import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CodeEvaluationResult } from "@/services/ai/evaluation-agent";
import type { TaskReportSynthesis } from "@/services/ai/report-agent";
import { apiFetch } from "@/services/api-client";
import { DEMO_MODE } from "@/utils/demo-mode";
import { demoId, demoStore } from "@/mocks/demo-store";
import type { EvaluationReport, VivaQuestion } from "@/types/report";
import type { Task } from "@/types/task";

type BackendReportType = "DAILY" | "WEEKLY" | "FINAL";

export interface BackendReport {
  id: string;
  fresher_id: string;
  roadmap_id: string | null;
  report_type: BackendReportType;
  report_date: string | null;
  period_start: string | null;
  period_end: string | null;
  overall_score: number | null;
  needs_human_interaction: boolean;
  report_payload: Record<string, unknown> | null;
  created_at: string;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function reportType(type: BackendReportType): EvaluationReport["report_type"] {
  if (type === "WEEKLY") return "weekly";
  if (type === "FINAL") return "final";
  return "task";
}

export function toEvaluationReport(report: BackendReport): EvaluationReport {
  const payload = report.report_payload ?? {};
  const evaluation = record(payload.evaluation);
  const qna = record(payload.qna);
  return {
    id: report.id,
    submission_id: null,
    user_id: report.fresher_id,
    report_type: reportType(report.report_type),
    architecture: record(evaluation.architecture),
    folder_structure: record(evaluation.folder_structure),
    problem_solving: record(evaluation.problem_solving),
    code_quality: record(evaluation.code_quality),
    ai_usage: record(payload.ai_usage_disclosure),
    evidence: { items: strings(evaluation.evidence) },
    suggestions: strings(evaluation.suggestions).length ? strings(evaluation.suggestions) : strings(payload.weaknesses),
    summary: typeof payload.summary === "string"
      ? payload.summary
      : typeof qna.summary === "string"
        ? qna.summary
        : null,
    confidence: typeof evaluation.confidence === "number" ? evaluation.confidence : null,
    overall_score: report.overall_score,
    generated_at: report.created_at,
    roadmap_id: report.roadmap_id,
    report_payload: payload,
    needs_human_interaction: report.needs_human_interaction,
  };
}

function clientReportId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function useEvaluationReports(userId: string | undefined) {
  return useQuery({
    queryKey: ["evaluation-reports", userId],
    enabled: DEMO_MODE || !!userId,
    queryFn: async (): Promise<EvaluationReport[]> => {
      if (DEMO_MODE) {
        return demoStore.evaluationReports
          .filter((report) => report.user_id === userId)
          .sort((a, b) => b.generated_at.localeCompare(a.generated_at));
      }
      const reports = await apiFetch<BackendReport[]>("/api/freshers/me/reports?limit=500&offset=0");
      return reports.map(toEvaluationReport).sort((a, b) => b.generated_at.localeCompare(a.generated_at));
    },
  });
}

export function useSubmitDailyReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      userId: string;
      roadmapId: string;
      task: Task;
      skillName: string;
      evaluation: CodeEvaluationResult;
      synthesis: TaskReportSynthesis;
      qaItems: VivaQuestion[];
      aiUsageDisclosure: { usedAi: boolean; details: string };
    }) => {
      if (DEMO_MODE) {
        const report: EvaluationReport = {
          id: demoId("report"),
          submission_id: null,
          user_id: input.userId,
          report_type: "task",
          architecture: input.evaluation.architecture,
          folder_structure: input.evaluation.folderStructure,
          problem_solving: input.evaluation.problemSolving,
          code_quality: input.evaluation.codeQuality,
          ai_usage: {
            used_ai: input.aiUsageDisclosure.usedAi,
            details: input.aiUsageDisclosure.details || "Employee declared no AI assistance.",
            review_signal: input.evaluation.aiUsage.verdict,
          },
          evidence: input.evaluation.evidence,
          suggestions: input.synthesis.finalSuggestions,
          summary: input.synthesis.communicationVerdict,
          confidence: input.synthesis.confidence,
          overall_score: input.synthesis.overallScore,
          generated_at: new Date().toISOString(),
        };
        demoStore.evaluationReports.push(report);
        return report;
      }

      const report = await apiFetch<BackendReport>("/api/freshers/me/reports/daily", {
        method: "POST",
        body: JSON.stringify({
          client_report_id: clientReportId("web-daily"),
          roadmap_id: input.roadmapId,
          report_date: new Date().toISOString().slice(0, 10),
          overall_score: input.synthesis.overallScore,
          needs_human_interaction: input.synthesis.overallScore < 50
            || input.synthesis.confidence < 0.6
            || input.evaluation.confidence < 0.6,
          report_payload: {
            schema_version: "1.0",
            task_id: input.task.id,
            submission: {
              summary: `Repository work submitted for: ${input.task.title}`,
              reference: input.task.id,
            },
            ai_usage_disclosure: {
              used_ai: input.aiUsageDisclosure.usedAi,
              tools: [],
              what_ai_generated: input.aiUsageDisclosure.details || "Employee declared no AI assistance.",
              what_employee_corrected: "Not provided.",
              review_signal: input.evaluation.aiUsage.verdict,
            },
            evaluation: {
              architecture: input.evaluation.architecture,
              folder_structure: input.evaluation.folderStructure,
              problem_solving: input.evaluation.problemSolving,
              code_quality: input.evaluation.codeQuality,
              confidence: input.synthesis.confidence,
              suggestions: input.synthesis.finalSuggestions,
              verified_skills: input.synthesis.overallScore >= 70 && input.synthesis.confidence >= 0.7
                ? [input.skillName]
                : [],
              weak_areas: input.synthesis.finalSuggestions.slice(0, 3),
              evidence: input.evaluation.evidence.filesReviewed,
              dashboard_update: {
                next_focus: input.synthesis.finalSuggestions[0] ?? "Continue the roadmap task sequence.",
                improvement_pct: 0,
              },
              kpis: [{
                key: input.skillName.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
                name: input.skillName,
                score: input.synthesis.overallScore,
                confidence: input.synthesis.confidence,
              }],
            },
            qna: {
              questions: input.qaItems.map((item) => ({
                question: item.question,
                answer: item.answer,
                follow_up: item.followUp,
                follow_up_answer: item.followUpAnswer,
              })),
              summary: input.synthesis.communicationVerdict,
            },
          },
        }),
      });
      return toEvaluationReport(report);
    },
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-reports", report.user_id] });
      queryClient.invalidateQueries({ queryKey: ["skill-scores", report.user_id] });
      queryClient.invalidateQueries({ queryKey: ["pm-dashboard"] });
    },
  });
}

export function useSubmitPeriodReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      userId: string;
      roadmapId: string;
      type: "weekly" | "final";
      summary: string;
      overallScore: number;
      sourceReports: EvaluationReport[];
    }) => {
      if (DEMO_MODE) {
        const report: EvaluationReport = {
          id: demoId("report"), submission_id: null, user_id: input.userId, report_type: input.type,
          architecture: null, folder_structure: null, problem_solving: null, code_quality: null,
          ai_usage: null, evidence: null, suggestions: [], summary: input.summary, confidence: null,
          overall_score: input.overallScore, generated_at: new Date().toISOString(),
        };
        demoStore.evaluationReports.push(report);
        return report;
      }

      const today = new Date();
      const end = today.toISOString().slice(0, 10);
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      const strengths = input.sourceReports
        .flatMap((report) => strings(record(report.report_payload?.evaluation).verified_skills));
      const weaknesses = input.sourceReports
        .flatMap((report) => strings(record(report.report_payload?.evaluation).weak_areas));
      const endpoint = input.type === "weekly" ? "/api/freshers/me/reports/weekly" : "/api/freshers/me/reports/final";
      const report = await apiFetch<BackendReport>(endpoint, {
        method: "POST",
        body: JSON.stringify({
          client_report_id: clientReportId(`web-${input.type}`),
          roadmap_id: input.roadmapId,
          ...(input.type === "weekly" ? { period_start: start.toISOString().slice(0, 10), period_end: end } : { report_date: end }),
          overall_score: input.overallScore,
          needs_human_interaction: input.overallScore < 50,
          report_payload: {
            schema_version: "1.0",
            summary: input.summary,
            strengths: [...new Set(strengths)].slice(0, 5),
            weaknesses: [...new Set(weaknesses)].slice(0, 5),
            kpis: [{
              key: input.type === "weekly" ? "learning_velocity" : "technical_proficiency",
              name: input.type === "weekly" ? "Learning Velocity" : "Technical Proficiency",
              score: input.overallScore,
              confidence: 0.7,
            }],
          },
        }),
      });
      return toEvaluationReport(report);
    },
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-reports", report.user_id] });
      queryClient.invalidateQueries({ queryKey: ["pm-dashboard"] });
    },
  });
}
