import { completeJSON, hasOpenAIKey } from "@/services/ai/openai-client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { WorkEvidence } from "@/services/gitlab/fetch-work-evidence";
import type { DiagnosticTask } from "@/types/roadmap";
import type { FinalEvaluationOutput, QuestionAnswerInput, WorkEvaluationOutput } from "@/types/evaluation";

// Implements the Final Evaluation Agent from agents/final-evaluation.md: combine the
// Work Evaluation Report with the fresher's question answers into one PM-ready report.
// The code/Git evidence is preserved unchanged; answers are evaluated separately and
// never used to erase a code gap or as proof a code gap didn't exist.
const SYSTEM_PROMPT = `You are the Final Evaluation Agent. Combine the Work Evaluation Report, the generated
question(s), and the fresher's answer(s) into one complete PM-ready report. Preserve the original Work
Evaluation Report's code/CI evidence unchanged. Evaluate each answer separately from the code evidence —
propose score/confidence changes only when the answer provides relevant, understandable evidence; never let
a good answer erase a code gap, and never let a weak answer be used as proof the code itself was poor
(record it as an understanding gap instead). Recalculate the overall score only after documenting the
proposed competency updates. Generate one highest-priority next task from the combined evidence. Require
human review for overrides, disagreement, low confidence, missing answers, or high-risk topics.
Respond with strict JSON matching this exact shape, no prose outside JSON:
{
  "report_id": string,
  "report_type": "DAY_WORK_FINAL",
  "employee": { "id": string, "name": string, "role": string, "level": string },
  "roadmap": { "id": string, "task_id": string, "task_title": string, "objective": string, "complexity": string, "evaluation_date": string, "timezone": string },
  "work_summary": { "repository": string, "branch": string, "pull_request_id": string|null, "base_commit": string, "head_commit": string, "commits_observed": string[], "files_changed": string[], "build_status": "passed"|"failed"|"blocked", "tests": { "passed": number, "failed": number, "new_tests": number }, "coverage": { "before": number|null, "after": number|null }, "review_summary": string, "employee_explanation": string },
  "task_expectation": { "acceptance_criteria": string[], "in_scope_competencies": string[], "out_of_scope_competencies": string[] },
  "acceptance_criteria_assessment": [{ "criterion": string, "status": "met"|"partially_met"|"not_met"|"blocked_by_dependency"|"not_verifiable", "evidence": string[], "confidence": number }],
  "competencies": [{ "name": string, "status": "evaluated"|"not_required"|"insufficient_evidence", "previous_score": number|null, "proposed_score": number|null, "target_score": number|null, "weight": number, "previous_confidence": number, "proposed_confidence": number, "code_and_ci_evidence": string[], "answer_evidence": string[], "strengths": string[], "gaps": string[], "score_change_reason": string }],
  "questions_and_answers": [{ "question_id": string, "competency": string, "question": string, "answer": string, "answer_status": "answered"|"partially_answered"|"unanswered", "understanding_assessment": string, "answer_evidence": string[], "confidence": number }],
  "overall_result": { "previous_score": number|null, "proposed_score": number|null, "risk_level": "low"|"medium"|"high", "strongest_competency": string, "priority_gap": string, "summary": string },
  "final_strengths": string[],
  "development_gaps": [{ "type": "code_gap"|"understanding_gap"|"evidence_gap"|"not_required", "gap": string, "evidence": string[], "priority": "low"|"medium"|"high" }],
  "recommended_next_task": { "title": string, "objective": string, "deliverables": string[], "target_competency": string, "estimated_minutes": number, "expected_evidence": string[] },
  "pm_action": { "recommended_decision": "approve"|"approve_with_changes"|"request_rework"|"mentor_review"|"reject_ai_evaluation", "reason": string, "options": string[] },
  "human_review": { "required": boolean, "reason": string, "source_evaluation_id": string, "question_generator_id": string, "prompt_versions": string[] }
}`;

function buildDemoFinalEvaluation(
  employeeId: string,
  employeeName: string,
  task: DiagnosticTask,
  evaluation: WorkEvaluationOutput,
  rawAnswers: QuestionAnswerInput[],
): FinalEvaluationOutput {
  const answers = rawAnswers.map((a) => ({
    ...a,
    answer_status: a.answer.trim().length > 0 ? ("answered" as const) : ("unanswered" as const),
    understanding_assessment: a.answer.trim().length > 0
      ? "Answer demonstrates correct understanding of the gap identified in the Work Evaluation Report."
      : "No answer provided.",
    answer_evidence: a.answer.trim().length > 0 ? [a.answer] : [],
    confidence: a.answer.trim().length > 0 ? 0.75 : 0,
  }));

  return {
    report_id: "FINAL-EVAL-DEMO-001",
    report_type: "DAY_WORK_FINAL",
    employee: { id: employeeId, name: employeeName, role: "AI Product Developer", level: "Fresher" },
    roadmap: {
      id: evaluation.roadmap_task_id,
      task_id: evaluation.roadmap_task_id,
      task_title: task.task_title,
      objective: task.task_description,
      complexity: task.difficulty,
      evaluation_date: evaluation.evaluation_date,
      timezone: evaluation.timezone,
    },
    work_summary: {
      repository: evaluation.repository,
      branch: evaluation.branch,
      pull_request_id: null,
      base_commit: evaluation.base_commit,
      head_commit: evaluation.head_commit,
      commits_observed: evaluation.included_commit_ids,
      files_changed: evaluation.git_activity_summary.files_touched,
      build_status: "passed",
      tests: { passed: 0, failed: 0, new_tests: 0 },
      coverage: { before: null, after: null },
      review_summary: "No reviewer comments yet.",
      employee_explanation: answers[0]?.answer ?? "",
    },
    task_expectation: {
      acceptance_criteria: task.acceptance_criteria,
      in_scope_competencies: evaluation.task_brief.in_scope_competencies,
      out_of_scope_competencies: evaluation.task_brief.out_of_scope,
    },
    acceptance_criteria_assessment: evaluation.acceptance_criteria_results,
    competencies: evaluation.competencies.map((c) => ({
      name: c.name,
      status: c.status,
      previous_score: null,
      proposed_score: c.score,
      target_score: c.target_score,
      weight: c.weight,
      previous_confidence: 0,
      proposed_confidence: c.confidence,
      code_and_ci_evidence: c.evidence.map((e) => e.support),
      answer_evidence: answers.length > 0 && c.name === evaluation.priority_gap ? [answers[0].answer] : [],
      strengths: c.strengths,
      gaps: c.gaps,
      score_change_reason:
        answers.length > 0 && c.name === evaluation.priority_gap
          ? "Follow-up answer showed correct understanding of the gap, confirming the code-level assessment."
          : "No new evidence beyond the Work Evaluation Report.",
    })),
    questions_and_answers: answers,
    overall_result: {
      previous_score: null,
      proposed_score: evaluation.overall_task_score,
      risk_level: evaluation.risk_level,
      strongest_competency: evaluation.strongest_competency,
      priority_gap: evaluation.priority_gap,
      summary: `Delivered the assigned task with ${evaluation.strongest_competency} as the clear strength; ${evaluation.priority_gap} still needs practice.`,
    },
    final_strengths: evaluation.competencies.flatMap((c) => c.strengths),
    development_gaps: evaluation.competencies
      .flatMap((c) => c.gaps.map((gap) => ({ type: "code_gap" as const, gap, evidence: [] as string[], priority: "medium" as const })))
      .slice(0, 3),
    recommended_next_task: {
      title: `Follow-up: ${evaluation.recommended_next_focus}`,
      objective: `Build on the current task with a focus on ${evaluation.recommended_next_focus}.`,
      deliverables: ["A small task-specific implementation demonstrating the focus competency"],
      target_competency: evaluation.priority_gap,
      estimated_minutes: 180,
      expected_evidence: ["Completed branch/PR", "Employee explanation of the approach"],
    },
    pm_action: {
      recommended_decision: "approve",
      reason: "Acceptance criteria are substantially met and the follow-up answer confirmed understanding.",
      options: ["Approve", "Approve with changes", "Request rework", "Mentor review", "Reject AI evaluation"],
    },
    human_review: {
      required: evaluation.requires_human_review,
      reason: evaluation.human_review_reason || "Routine first task — PM review still required before finalizing.",
      source_evaluation_id: evaluation.evaluation_id,
      question_generator_id: "",
      prompt_versions: ["work-evaluation-agent@demo", "question-generator-agent@demo", "final-evaluation-agent@demo"],
    },
  };
}

export async function runFinalEvaluationAgent(input: {
  employeeId: string;
  employeeName: string;
  task: DiagnosticTask;
  evidence: WorkEvidence;
  evaluation: WorkEvaluationOutput;
  answers: QuestionAnswerInput[];
}): Promise<FinalEvaluationOutput> {
  if (DEMO_MODE || !hasOpenAIKey()) {
    return buildDemoFinalEvaluation(input.employeeId, input.employeeName, input.task, input.evaluation, input.answers);
  }

  const user = `Employee: ${input.employeeName} (id: ${input.employeeId})
Roadmap task: ${JSON.stringify(input.task)}
Work Evaluation Report: ${JSON.stringify(input.evaluation)}
Questions and answers: ${JSON.stringify(input.answers)}
Build status: ${input.evidence.buildStatus}`;

  return completeJSON<FinalEvaluationOutput>(SYSTEM_PROMPT, user);
}
