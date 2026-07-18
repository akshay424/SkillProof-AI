import { useQuery } from "@tanstack/react-query";

import { demoStore } from "@/mocks/demo-store";
import { apiFetch } from "@/services/api-client";
import { toEvaluationReport, type BackendReport, useEvaluationReports } from "@/services/queries/reports";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { EvaluationReport, SkillScore } from "@/types/report";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function kpisFromReport(report: EvaluationReport): Array<{ key: string; name: string; score: number }> {
  const payload = report.report_payload ?? {};
  const evaluation = record(payload.evaluation);
  const rawKpis = Array.isArray(evaluation.kpis)
    ? evaluation.kpis
    : Array.isArray(payload.kpis)
      ? payload.kpis
      : [];
  return rawKpis.flatMap((item) => {
    const kpi = record(item);
    if (typeof kpi.score !== "number" || kpi.score < 0 || kpi.score > 100) return [];
    const name = typeof kpi.name === "string" ? kpi.name : typeof kpi.key === "string" ? kpi.key : "Skill";
    const key = typeof kpi.key === "string" ? kpi.key : name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    return [{ key, name, score: kpi.score }];
  });
}

export function skillScoresFromReports(reports: EvaluationReport[]): SkillScore[] {
  return reports.flatMap((report) => kpisFromReport(report).map((kpi) => ({
    id: `${report.id}-${kpi.key}`,
    user_id: report.user_id,
    skill_name: kpi.name,
    score: kpi.score,
    source: report.report_type === "task" ? "task_evaluation" as const : "diagnostic" as const,
    recorded_at: report.generated_at,
  }))).sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
}

export function useSkillScores(userId: string | undefined) {
  const reports = useEvaluationReports(userId);
  return { ...reports, data: reports.data ? skillScoresFromReports(reports.data) : undefined };
}

export function useLatestSkillScores(userId: string | undefined) {
  const { data: scores, ...rest } = useSkillScores(userId);
  const latestBySkill = new Map<string, SkillScore>();
  for (const score of scores ?? []) {
    if (!latestBySkill.has(score.skill_name)) latestBySkill.set(score.skill_name, score);
  }
  return { data: Array.from(latestBySkill.values()), ...rest };
}

export function useSkillScoresForUsers(userIds: string[]) {
  return useQuery({
    queryKey: ["skill-scores-batch", userIds],
    enabled: DEMO_MODE || userIds.length > 0,
    refetchInterval: DEMO_MODE ? false : 20_000,
    queryFn: async (): Promise<SkillScore[]> => {
      if (DEMO_MODE) return demoStore.skillScores.filter((score) => userIds.includes(score.user_id));
      const reports = await Promise.all(userIds.map(async (userId) => {
        const response = await apiFetch<BackendReport[]>(`/api/pm/freshers/${userId}/reports?limit=500&offset=0`);
        return response.map(toEvaluationReport);
      }));
      return skillScoresFromReports(reports.flat());
    },
  });
}
