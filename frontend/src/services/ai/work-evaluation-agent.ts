import { completeJSON } from "@/services/ai/openai-client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { WorkEvidence } from "@/services/gitlab/fetch-work-evidence";
import type { DiagnosticTask } from "@/types/roadmap";
import type { WorkEvaluationOutput } from "@/types/evaluation";

// Implements the Work Evaluation Agent from agents/work-evaluation.md: evaluate the
// assigned roadmap task against Git evidence (commits, diff, CI, reviews) and the
// employee's own explanation — never from commit count/lines-changed/PR count.
// The full output contract lives server-side under the "work_evaluation" operation.

const DEMO_WORK_EVALUATION: WorkEvaluationOutput = {
  evaluation_id: "EVAL-DEMO-001",
  roadmap_task_id: "TASK-DEMO-001",
  evaluation_date: new Date().toISOString().slice(0, 10),
  timezone: "UTC",
  repository: "demo/flutter-login-task",
  branch: "evaluate",
  base_commit: "a1b2c3d",
  head_commit: "e4f5g6h",
  included_commit_ids: ["a1b2c3d", "e4f5g6h"],
  task_brief: {
    objective: "Implement a Flutter login screen with form validation and a loading state on submit.",
    expected_delivery: "A working login screen that validates input and shows a loading state during the mock sign-in call.",
    in_scope_competencies: ["Dart/Flutter widget composition", "REST API consumption"],
    out_of_scope: ["State management architecture", "Automated testing"],
  },
  acceptance_criteria_results: [
    { criterion: "Form validates empty/invalid email and password before submit", status: "met", evidence: ["Validator added in commit a1b2c3d"], confidence: 0.9 },
    { criterion: "Loading state shows while the mock call is in flight", status: "met", evidence: ["_isLoading toggled around signIn() call"], confidence: 0.85 },
    { criterion: "Success and error responses are both handled distinctly", status: "partially_met", evidence: ["try/catch added in e4f5g6h but error message is generic"], confidence: 0.6 },
  ],
  overall_task_score: 78,
  risk_level: "low",
  competencies: [
    {
      name: "Dart/Flutter widget composition",
      status: "evaluated",
      score: 3,
      target_score: 3,
      weight: 60,
      evidence: [{ source: "diff", claim: "Widget composition follows conventions", support: "StatefulWidget + validation wired correctly", impact: "supports", confidence: 0.85 }],
      strengths: ["Clean separation of form state and submit logic"],
      gaps: [],
      confidence: 0.85,
    },
    {
      name: "REST API consumption",
      status: "evaluated",
      score: 2,
      target_score: 3,
      weight: 40,
      evidence: [{ source: "diff", claim: "Error handling added but not differentiated by error type", support: "catch block sets one generic error message", impact: "gap", confidence: 0.7 }],
      strengths: ["Added try/catch around the async call"],
      gaps: ["Doesn't distinguish network timeout from invalid-credentials errors"],
      confidence: 0.7,
    },
  ],
  strongest_competency: "Dart/Flutter widget composition",
  priority_gap: "REST API consumption",
  question_needed: true,
  recommended_next_focus: "Differentiate error types (network vs auth) in API error handling",
  requires_human_review: false,
  human_review_reason: "",
  git_activity_summary: {
    commits_observed: 2,
    files_touched: ["lib/screens/login_screen.dart", "lib/services/auth_service.dart"],
    criteria_addressed: ["Form validation", "Loading state", "Error handling (partial)"],
    review_driven_corrections: [],
    reverted_or_incomplete_attempts: [],
    co_authored_or_automated_changes: [],
    evidence_limitations: ["No CI pipeline configured on this demo repo"],
  },
};

export async function runWorkEvaluationAgent(input: {
  task: DiagnosticTask;
  evidence: WorkEvidence;
  employeeExplanation: string;
}): Promise<WorkEvaluationOutput> {
  if (DEMO_MODE) {
    return { ...DEMO_WORK_EVALUATION, roadmap_task_id: input.task.task_id };
  }

  const user = JSON.stringify({
    roadmap_task: input.task,
    git_evidence: { ...input.evidence, diff: input.evidence.diff.slice(0, 6000) },
    employee_explanation: input.employeeExplanation,
  });

  return completeJSON<WorkEvaluationOutput>("work_evaluation", user);
}
