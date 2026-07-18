import { completeJSON } from "@/services/ai/openai-client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { FinalEvaluationOutput, RoadmapCompletionOutput, WeeklyEvaluationOutput } from "@/types/evaluation";
import type { RoadmapRecord } from "@/types/roadmap";

// Implements the Roadmap Completion Evaluation Agent from
// agents/roadmap-completion.md: the complete final fresher growth report after all
// required roadmap work is done, for PM review — a readiness recommendation, never
// an automatic hiring/promotion/salary/employment decision.
// The full output contract lives server-side under the "roadmap_completion" operation.

function buildDemoRoadmapCompletion(
  employeeId: string,
  employeeName: string,
  roadmap: RoadmapRecord,
  dailyReports: FinalEvaluationOutput[],
  weeklyReports: WeeklyEvaluationOutput[],
): RoadmapCompletionOutput {
  const scores = dailyReports.map((r) => r.overall_result.proposed_score ?? 0).filter((s) => s > 0);
  const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const competencyNames = Array.from(new Set(dailyReports.flatMap((r) => r.competencies.map((c) => c.name))));
  const now = new Date().toISOString();

  return {
    report_id: "ROADMAP-FINAL-EVAL-DEMO-001",
    report_type: "ROADMAP_COMPLETE",
    employee: { id: employeeId, name: employeeName, role: "AI Product Developer", level: "Fresher" },
    roadmap: {
      id: roadmap.id,
      title: roadmap.title ?? "Roadmap",
      goal: roadmap.title ?? "",
      target_role: roadmap.target_role ?? "AI Product Developer",
      completion_status: "completed",
      completion_percent: 100,
      start_date: roadmap.created_at,
      completion_date: now,
    },
    completion_evidence: {
      required_task_count: dailyReports.length,
      completed_task_count: dailyReports.length,
      blocked_task_count: 0,
      waived_task_count: 0,
      missing_task_count: 0,
      daily_report_ids: dailyReports.map((r) => r.report_id),
      weekly_report_ids: weeklyReports.map((r) => r.report_id),
      final_task_report_ids: dailyReports.map((r) => r.report_id),
      pm_override_ids: [],
    },
    competency_summary: competencyNames.map((name) => {
      const entries = dailyReports.flatMap((r) => r.competencies.filter((c) => c.name === name));
      const validScores = entries.map((e) => e.proposed_score).filter((s): s is number => s !== null);
      return {
        competency: name,
        roadmap_required: true,
        initial_status: entries[0]?.status ?? "insufficient_evidence",
        final_status: entries[entries.length - 1]?.status ?? "insufficient_evidence",
        initial_score: validScores[0] ?? null,
        final_score: validScores[validScores.length - 1] ?? null,
        target_score: entries[0]?.target_score ?? null,
        trend: validScores.length > 1 && validScores[validScores.length - 1] > validScores[0] ? "improving" : "stable",
        confidence: 0.75,
        demonstrated_independently: (validScores[validScores.length - 1] ?? 0) >= 3,
        evidence: entries.flatMap((e) => e.code_and_ci_evidence).slice(0, 3),
        remaining_gap: entries[entries.length - 1]?.gaps[0] ?? "",
      };
    }),
    demonstrated_strengths: dailyReports.flatMap((r) => r.final_strengths).slice(0, 5).map((s) => ({
      strength: s,
      evidence: [],
      source_report_ids: dailyReports.filter((r) => r.final_strengths.includes(s)).map((r) => r.report_id),
    })),
    remaining_development_gaps: dailyReports
      .flatMap((r) => r.development_gaps.map((g) => ({ ...g, source_report_ids: [r.report_id] })))
      .slice(0, 3)
      .map((g) => ({
        type: g.type === "not_required" ? ("outside_scope" as const) : g.type,
        gap: g.gap,
        priority: g.priority,
        evidence: g.evidence,
        source_report_ids: g.source_report_ids,
      })),
    overall_result: {
      average_final_task_score: average,
      overall_confidence: 0.75,
      readiness: average >= 70 ? "ready_for_pm_review" : average >= 40 ? "partially_ready" : "developing",
      summary: `Completed ${dailyReports.length} evaluated task(s) with an average score of ${average}/100. Demonstrated growth across ${competencyNames.length} competencies.`,
      evidence_limitations: dailyReports.length < 3 ? ["Limited evaluation history — readiness based on a small number of tasks."] : [],
    },
    recommended_next_stage: {
      title: "Begin adaptive multi-week roadmap",
      objective: "Continue building toward full AI Product Developer readiness with broader competency coverage.",
      reason: "First roadmap stage complete with demonstrated core-competency evidence.",
      expected_evidence: ["Completed branch/PR per task", "Weekly evaluation reports"],
    },
    mentor_recommendation: {
      required: average < 60,
      reason: average < 60 ? "Average score below the on-track threshold — mentor check-in recommended." : "No mentor intervention needed at this stage.",
      discussion_points: average < 60 ? ["Review recurring gaps across evaluated tasks"] : [],
    },
    pm_review: {
      required: true,
      recommended_decision: average >= 70 ? "approve_readiness" : "extend_roadmap",
      reason: average >= 70
        ? "Evidence supports readiness for the next roadmap stage."
        : "Additional evidence recommended before confirming readiness.",
      available_actions: [
        "Approve readiness recommendation",
        "Extend roadmap",
        "Assign mentor",
        "Request additional evidence",
        "Reject AI report",
      ],
    },
    audit: {
      agent_name: "Roadmap Completion Evaluation Agent",
      prompt_version: "roadmap-completion-agent@demo",
      generated_at: now,
      source_daily_reports: dailyReports.map((r) => r.report_id),
      source_weekly_reports: weeklyReports.map((r) => r.report_id),
      source_final_task_reports: dailyReports.map((r) => r.report_id),
      human_review_required: true,
    },
  };
}

export async function runRoadmapCompletionAgent(input: {
  employeeId: string;
  employeeName: string;
  roadmap: RoadmapRecord;
  dailyReports: FinalEvaluationOutput[];
  weeklyReports: WeeklyEvaluationOutput[];
}): Promise<RoadmapCompletionOutput> {
  if (DEMO_MODE) {
    return buildDemoRoadmapCompletion(input.employeeId, input.employeeName, input.roadmap, input.dailyReports, input.weeklyReports);
  }

  const user = `Employee: ${input.employeeName} (id: ${input.employeeId})
Roadmap: ${JSON.stringify({ id: input.roadmap.id, title: input.roadmap.title, target_role: input.roadmap.target_role })}
Daily Final Evaluation Reports: ${JSON.stringify(input.dailyReports)}
Weekly Evaluation Reports: ${JSON.stringify(input.weeklyReports)}`;

  return completeJSON<RoadmapCompletionOutput>("roadmap_completion", user);
}
