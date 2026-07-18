import { completeJSON } from "@/services/ai/openai-client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { FinalEvaluationOutput, WeeklyEvaluationOutput } from "@/types/evaluation";

// Implements the Weekly Evaluation Agent from agents/weekly-evaluation.md: aggregate
// the week's daily Final Evaluation Reports into a growth/performance trend report,
// comparing the fresher with their own prior evidence — never ranking against peers,
// never using commit count/hours/PR count as a metric.
// The full output contract lives server-side under the "weekly_evaluation" operation.

function buildDemoWeeklyEvaluation(
  employeeId: string,
  employeeName: string,
  roadmapId: string,
  roadmapTitle: string,
  dailyReports: FinalEvaluationOutput[],
): WeeklyEvaluationOutput {
  const scores = dailyReports.map((r) => r.overall_result.proposed_score ?? 0).filter((s) => s > 0);
  const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const competencyNames = Array.from(new Set(dailyReports.flatMap((r) => r.competencies.map((c) => c.name))));

  return {
    report_id: "WEEKLY-EVAL-DEMO-001",
    report_type: "WEEKLY",
    employee: { id: employeeId, name: employeeName, role: "AI Product Developer", level: "Fresher" },
    roadmap: { id: roadmapId, title: roadmapTitle, progress_percent: 0 },
    period: {
      start: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      end: new Date().toISOString().slice(0, 10),
      timezone: "UTC",
      daily_reports_included: dailyReports.map((r) => r.report_id),
      daily_reports_missing: [],
    },
    work_summary: {
      completed_evaluations: dailyReports.length,
      practical_outputs_completed: dailyReports.length,
      average_task_score: average,
      first_task_score: scores[0] ?? null,
      latest_task_score: scores[scores.length - 1] ?? null,
      score_trend: scores.length > 1 && scores[scores.length - 1] > scores[0] ? "improving" : "stable",
      average_confidence: 0.75,
      confidence_trend: "stable",
    },
    competency_tracking: competencyNames.map((name) => {
      const entries = dailyReports.flatMap((r) => r.competencies.filter((c) => c.name === name));
      const validScores = entries.map((e) => e.proposed_score).filter((s): s is number => s !== null);
      return {
        competency: name,
        tasks_evaluated: entries.length,
        first_score: validScores[0] ?? null,
        latest_score: validScores[validScores.length - 1] ?? null,
        average_score: validScores.length ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10 : null,
        target_score: entries[0]?.target_score ?? null,
        trend: validScores.length > 1 && validScores[validScores.length - 1] > validScores[0] ? "improving" : "stable",
        guidance_level: "guided",
        confidence: 0.75,
        evidence: entries.flatMap((e) => e.code_and_ci_evidence).slice(0, 3),
        next_focus: entries[entries.length - 1]?.gaps[0] ?? "Continue building on current strengths.",
      };
    }),
    strengths: dailyReports.flatMap((r) => r.final_strengths).slice(0, 3).map((s) => ({
      strength: s,
      evidence: [],
      source_daily_reports: dailyReports.filter((r) => r.final_strengths.includes(s)).map((r) => r.report_id),
    })),
    development_gaps: dailyReports
      .flatMap((r) => r.development_gaps.map((g) => ({ ...g, source_daily_reports: [r.report_id] })))
      .slice(0, 3)
      .map((g) => ({
        type: g.type === "not_required" ? ("evidence_gap" as const) : g.type,
        gap: g.gap,
        frequency: 1,
        priority: g.priority,
        evidence: g.evidence,
        source_daily_reports: g.source_daily_reports,
      })),
    attendance_and_blockers: {
      attendance_status: "present",
      skill_score_changed: true,
      roadmap_paused: false,
      ci_or_repository_failures: [],
      employee_blockers: [],
    },
    weekly_status: average >= 85 ? "ahead" : average >= 60 ? "on_track" : average >= 40 ? "needs_support" : "behind",
    mentor_review: { required: false, reason: "No repeated gaps yet this week.", discussion_points: [] },
    next_week_plan: {
      focus_competency: dailyReports[dailyReports.length - 1]?.overall_result.priority_gap ?? "General competency growth",
      recommended_task: dailyReports[dailyReports.length - 1]?.recommended_next_task.title ?? "Continue current roadmap task",
      reason: "Builds directly on this week's evaluated evidence.",
      expected_evidence: ["Completed branch/PR", "Employee explanation of the approach"],
    },
    human_review: {
      required: true,
      reason: "Routine weekly report — PM review required before finalizing.",
      source_daily_reports: dailyReports.map((r) => r.report_id),
      previous_weekly_report: null,
    },
  };
}

export async function runWeeklyEvaluationAgent(input: {
  employeeId: string;
  employeeName: string;
  roadmapId: string;
  roadmapTitle: string;
  dailyReports: FinalEvaluationOutput[];
}): Promise<WeeklyEvaluationOutput> {
  if (DEMO_MODE) {
    return buildDemoWeeklyEvaluation(input.employeeId, input.employeeName, input.roadmapId, input.roadmapTitle, input.dailyReports);
  }

  const user = `Employee: ${input.employeeName} (id: ${input.employeeId})
Roadmap: ${input.roadmapTitle} (id: ${input.roadmapId})
This week's daily Final Evaluation Reports: ${JSON.stringify(input.dailyReports)}`;

  return completeJSON<WeeklyEvaluationOutput>("weekly_evaluation", user);
}
