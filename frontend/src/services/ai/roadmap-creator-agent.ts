import { completeJSON, hasOpenAIKey } from "@/services/ai/openai-client";
import { DEMO_MODE } from "@/utils/demo-mode";
import { generateUUID } from "@/utils/uuid";
import type { AdaptiveRoadmapPayload, DiagnosticTask, FirstDayRoadmapPayload, RoadmapPayload } from "@/types/roadmap";
import type { ResumeReaderOutput } from "@/types/resume";
import type { FinalEvaluationOutput } from "@/types/evaluation";

/** Task IDs are client-assigned, not part of the AI's own output — the real
 * backend validates report submissions against a task_id it looks up inside
 * roadmap_payload.current_task, so every generated task needs a stable id
 * regardless of what (if anything) the model returned for it. */
function withTaskId(task: DiagnosticTask): DiagnosticTask {
  return { ...task, task_id: generateUUID() };
}

// Implements Mode A — First Day Diagnostic from agents/roadmap-creator.md: a
// diagnostic roadmap (not an appraisal) for a fresher with no task history yet.
// Selects 1-3 foundation competencies to verify from the Resume Reader's
// roadmap_inputs and interview notes, and produces small, clear diagnostic tasks.
const SYSTEM_PROMPT = `You are the Roadmap Creator Agent operating in Mode A — First Day Diagnostic.
Use this mode only for a fresher with no previous task history. This is a diagnostic roadmap, not an
appraisal: resume skills are unverified claims, not facts to be scored. Compare claimed resume skills
with the target role's required competencies, identify matched claims, missing required skills, and
high-risk unverified claims. Select only 1-3 foundation competencies to verify first. Create small,
clear, employee-facing diagnostic tasks with enough context, sample input, resources, and acceptance
criteria for a fresher to start immediately. Estimate effort in minutes. Do not label the employee weak
for lacking first-day evidence. Never generate a roadmap solely from resume keywords.
Set generation_mode="diagnostic" and pace_status="no_evidence".
Respond with strict JSON matching this exact shape, no prose outside JSON:
{
  "employee_id": string,
  "employee_name": string,
  "department": string,
  "role": string,
  "employee_type": "fresher",
  "generation_mode": "diagnostic",
  "pace_status": "no_evidence",
  "confidence": number (0-1),
  "first_day_summary": string,
  "claimed_skills_note": "Resume skills are unverified claims.",
  "claimed_vs_required_skill_analysis": {
    "matched_claimed_skills": string[],
    "missing_required_skills": string[],
    "high_risk_unverified_claims": string[],
    "first_skills_to_verify": string[]
  },
  "first_day_roadmap": {
    "goal": string,
    "tasks": [
      {
        "task_id": string,
        "task_title": string,
        "task_description": string,
        "employee_facing_instruction": string,
        "focus_competency": string,
        "difficulty": "beginner"|"intermediate"|"advanced",
        "estimated_effort_minutes": number,
        "estimated_span_days": number,
        "can_complete_less_than_one_day": boolean,
        "is_multi_day_task": boolean,
        "checkpoints": [{ "checkpoint": string, "expected_output": string, "estimated_effort_minutes": number }],
        "sample_input": object,
        "expected_output": string,
        "required_resources": [{ "type": string, "name": string, "url": string, "method": string, "endpoint": string, "headers": object, "request_body": object, "response_body": object, "content": object, "purpose": string }],
        "missing_resources": string[],
        "resource_strategy": string,
        "acceptance_criteria": string[],
        "evaluation_criteria": string[],
        "reason_for_task": string
      }
    ]
  },
  "after_submission_plan": { "if_performs_well": string, "if_partially_correct": string, "if_struggles": string, "if_no_submission": string, "if_absent": string },
  "manager_dashboard_summary": { "status": string, "message": string, "mentor_action": string, "evidence_to_collect": string[] }
}`;

const DEMO_TASK: DiagnosticTask = {
  task_id: "",
  task_title: "Build a Login Screen",
  task_description:
    "Implement a Flutter login screen with form validation and a loading state on submit, calling a mock authentication endpoint.",
  employee_facing_instruction:
    "Create a login screen with email/password fields, client-side validation, and a loading spinner while the mock sign-in call is in flight. Handle both success and error responses from the mock endpoint.",
  focus_competency: "Dart/Flutter widget composition",
  difficulty: "beginner",
  estimated_effort_minutes: 240,
  estimated_span_days: 1,
  can_complete_less_than_one_day: true,
  is_multi_day_task: false,
  checkpoints: [],
  sample_input: { email: "test@example.com", password: "Password123" },
  expected_output: "A working login screen that validates input and shows a loading state during the mock sign-in call.",
  required_resources: [
    {
      type: "api",
      name: "Mock auth endpoint",
      url: "",
      method: "POST",
      endpoint: "/login",
      headers: { "Content-Type": "application/json" },
      request_body: { email: "string", password: "string" },
      response_body: { token: "string" },
      content: {},
      purpose: "Simulates a real sign-in call to validate REST API consumption.",
    },
  ],
  missing_resources: [],
  resource_strategy: "Use a mocked/in-memory auth service since no real backend is available yet.",
  acceptance_criteria: [
    "Form validates empty/invalid email and password before submit",
    "Loading state shows while the mock call is in flight",
    "Success and error responses are both handled distinctly",
  ],
  evaluation_criteria: [
    "Widget composition follows Flutter conventions",
    "Form validation covers the required edge cases",
    "Async call and loading state are implemented correctly",
  ],
  reason_for_task:
    "Directly tests the claimed Flutter widget composition skill and the unverified REST API consumption claim in one small, clear task.",
};

const DEMO_ROADMAP_PAYLOAD: FirstDayRoadmapPayload = {
  employee_id: "demo-fresher",
  employee_name: "Aarav Fresher",
  department: "Engineering",
  role: "AI Product Developer",
  employee_type: "fresher",
  generation_mode: "diagnostic",
  pace_status: "no_evidence",
  confidence: 0.6,
  first_day_summary:
    "Aarav has hands-on Flutter/Dart project experience but no verified evidence of REST API integration, state management, or testing yet.",
  claimed_skills_note: "Resume skills are unverified claims.",
  claimed_vs_required_skill_analysis: {
    matched_claimed_skills: ["Dart/Flutter widget composition"],
    missing_required_skills: ["State management", "Automated testing", "AI API integration"],
    high_risk_unverified_claims: ["basic REST API consumption"],
    first_skills_to_verify: ["REST API consumption", "Git workflow", "Widget composition under a real constraint"],
  },
  first_day_roadmap: {
    goal: "Verify foundational Flutter and API-integration skills claimed on the resume before planning further weeks.",
    tasks: [DEMO_TASK],
  },
  current_task: DEMO_TASK,
  after_submission_plan: {
    if_performs_well: "Move to a task requiring real state management and a second API integration.",
    if_partially_correct: "Repeat the weak part of this task with more scaffolding before advancing.",
    if_struggles: "Pair the next task with a simpler, more guided version of the same competency.",
    if_no_submission: "Check in with the fresher before assuming the task was skipped or too hard.",
    if_absent: "Reassign the same task on return without penalty.",
  },
  manager_dashboard_summary: {
    status: "No evidence yet",
    message: "Aarav is starting a first-day diagnostic task to verify claimed Flutter and API skills.",
    mentor_action: "No action needed yet — check back after the first task is evaluated.",
    evidence_to_collect: ["Completed login screen implementation", "Any questions raised about the mock API"],
  },
};

function withTaskIds(payload: FirstDayRoadmapPayload): FirstDayRoadmapPayload {
  const tasks = payload.first_day_roadmap.tasks.map(withTaskId);
  return { ...payload, first_day_roadmap: { ...payload.first_day_roadmap, tasks }, current_task: tasks[0] };
}

export async function runRoadmapCreatorAgent(input: {
  employeeId: string;
  employeeName: string;
  targetRole: string;
  resumeReader: ResumeReaderOutput;
  interviewNotes: string;
}): Promise<FirstDayRoadmapPayload> {
  if (DEMO_MODE || !hasOpenAIKey()) {
    return withTaskIds({ ...DEMO_ROADMAP_PAYLOAD, employee_id: input.employeeId, employee_name: input.employeeName });
  }

  const user = `Employee: ${input.employeeName} (id: ${input.employeeId})
Target role: ${input.targetRole}
Employee type: fresher
Resume Reader output: ${JSON.stringify(input.resumeReader)}
Interview evaluation notes: ${input.interviewNotes}`;

  const result = await completeJSON<FirstDayRoadmapPayload>(SYSTEM_PROMPT, user);
  return withTaskIds(result);
}

// Implements Mode B — After Evaluation from agents/roadmap-creator.md: use the
// highest-priority gap from the just-completed task, preserve demonstrated
// strengths, and create exactly one next task the fresher can complete in the
// planned time window. Produces a new roadmap version (the backend has no
// endpoint to edit roadmap_payload in place — advancement is always a new POST).
const MODE_B_SYSTEM_PROMPT = `You are the Roadmap Creator Agent operating in Mode B — After Evaluation.
Use the highest-priority gap from the completed roadmap task's Final Evaluation Report. Preserve
demonstrated strengths and increase challenge gradually. Do not punish the employee for skills outside the
evaluated task. Create exactly one next task that can be completed in the planned time window. Defer
unrelated skills rather than labeling them as weaknesses. Set generation_mode="adaptive" and
roadmap_type="competency_gated_growth". The current_task must contain enough context for the employee to
begin without a manager explanation — same fields as a diagnostic task.
Respond with strict JSON matching this exact shape, no prose outside JSON:
{
  "employee_id": string, "employee_name": string, "department": string, "role": string, "employee_type": string,
  "generation_mode": "adaptive",
  "pace_status": "paused"|"behind"|"needs_support"|"on_track"|"ahead",
  "roadmap_type": "competency_gated_growth",
  "roadmap_summary": string,
  "duration_plan": { "selected_duration_weeks": number, "min_duration_weeks": number, "max_duration_weeks": number, "duration_reason": string },
  "task_time_policy": { "available_work_time_per_day_minutes": number, "min_task_duration_minutes": number, "max_task_span_days": number, "planning_logic": string },
  "attendance_handling": { "attendance_status": string, "skill_score_changed": boolean, "roadmap_paused": boolean, "reason": string, "resume_task_strategy": string },
  "confidence": number (0-1),
  "claimed_skills_note": string,
  "verified_skill_basis": string[],
  "primary_weak_areas": string[],
  "mentor_review_required": boolean,
  "mentor_review_reason": string,
  "competency_track": [{ "competency": string, "current_status": string, "target_status": string, "priority": string, "evidence": string[] }],
  "roadmap": [{ "week": number, "week_goal": string, "main_competency": string, "practical_output": string, "tasks": string[], "move_forward_condition": string, "repeat_condition": string, "fast_track_condition": string, "mentor_checkpoint": string }],
  "current_task": {
    "task_id": string, "task_title": string, "task_description": string, "employee_facing_instruction": string, "focus_competency": string,
    "difficulty": "beginner"|"intermediate"|"advanced", "estimated_effort_minutes": number, "estimated_span_days": number,
    "can_complete_less_than_one_day": boolean, "is_multi_day_task": boolean,
    "checkpoints": [{ "checkpoint": string, "expected_output": string, "estimated_effort_minutes": number }],
    "sample_input": object, "expected_output": string,
    "required_resources": [{ "type": string, "name": string, "url": string, "method": string, "endpoint": string, "headers": object, "request_body": object, "response_body": object, "content": object, "purpose": string }],
    "missing_resources": string[], "resource_strategy": string, "acceptance_criteria": string[], "evaluation_criteria": string[], "reason_for_task": string
  },
  "next_task_strategy": { "if_score_below_40": string, "if_score_40_to_69": string, "if_score_70_to_84": string, "if_score_above_85": string, "if_no_submission": string, "if_history_missing": string, "if_repeated_weakness": string, "if_absent_or_on_leave": string, "if_required_resource_missing": string, "if_task_completed_early": string, "if_task_takes_longer_than_expected": string },
  "manager_dashboard_summary": { "strongest_skill": string, "current_gap": string, "suggested_next_task": string, "suggested_mentor_action": string, "evidence_to_show": string[] }
}`;

function buildDemoAdaptivePayload(
  employeeId: string,
  employeeName: string,
  targetRole: string,
  finalEvaluation: FinalEvaluationOutput,
): AdaptiveRoadmapPayload {
  const priorityGap = finalEvaluation.overall_result.priority_gap || "REST API consumption";
  return {
    employee_id: employeeId,
    employee_name: employeeName,
    department: "Engineering",
    role: targetRole,
    employee_type: "fresher",
    generation_mode: "adaptive",
    pace_status: "on_track",
    roadmap_type: "competency_gated_growth",
    roadmap_summary: `Building on the first task's evidence, focusing next on ${priorityGap} while preserving demonstrated widget-composition strength.`,
    duration_plan: {
      selected_duration_weeks: 8,
      min_duration_weeks: 6,
      max_duration_weeks: 12,
      duration_reason: "Standard fresher onboarding window given early evidence is on track.",
    },
    task_time_policy: {
      available_work_time_per_day_minutes: 360,
      min_task_duration_minutes: 60,
      max_task_span_days: 2,
      planning_logic: "One clear task per work session, scoped to fit within a single day where possible.",
    },
    attendance_handling: {
      attendance_status: "present",
      skill_score_changed: true,
      roadmap_paused: false,
      reason: "Normal attendance, task evaluated as scheduled.",
      resume_task_strategy: "n/a",
    },
    confidence: 0.7,
    claimed_skills_note: "Resume skills partially verified by the first evaluated task.",
    verified_skill_basis: [finalEvaluation.overall_result.strongest_competency],
    primary_weak_areas: [priorityGap],
    mentor_review_required: finalEvaluation.human_review.required,
    mentor_review_reason: finalEvaluation.human_review.reason,
    competency_track: finalEvaluation.competencies.map((c) => ({
      competency: c.name,
      current_status: c.proposed_score !== null ? `score ${c.proposed_score}/4` : "insufficient_evidence",
      target_status: c.target_score !== null ? `score ${c.target_score}/4` : "not set",
      priority: c.name === priorityGap ? "high" : "medium",
      evidence: c.code_and_ci_evidence,
    })),
    roadmap: [
      {
        week: 2,
        week_goal: `Strengthen ${priorityGap} with a real API integration task`,
        main_competency: priorityGap,
        practical_output: "A small feature that consumes a real or mocked REST API with differentiated error handling.",
        tasks: [finalEvaluation.recommended_next_task.title],
        move_forward_condition: "Acceptance criteria met and error-handling gap addressed.",
        repeat_condition: "Same gap persists in the next evaluation.",
        fast_track_condition: "Task completed early with high confidence.",
        mentor_checkpoint: "Not required unless the gap repeats a third time.",
      },
    ],
    current_task: {
      task_id: "",
      task_title: finalEvaluation.recommended_next_task.title,
      task_description: finalEvaluation.recommended_next_task.objective,
      employee_facing_instruction: `${finalEvaluation.recommended_next_task.objective} Focus specifically on ${priorityGap}.`,
      focus_competency: priorityGap,
      difficulty: "beginner",
      estimated_effort_minutes: finalEvaluation.recommended_next_task.estimated_minutes,
      estimated_span_days: 1,
      can_complete_less_than_one_day: true,
      is_multi_day_task: false,
      checkpoints: [],
      sample_input: {},
      expected_output: finalEvaluation.recommended_next_task.deliverables[0] ?? "",
      required_resources: [],
      missing_resources: [],
      resource_strategy: "Reuse the same mocked backend approach as the first task.",
      acceptance_criteria: finalEvaluation.recommended_next_task.deliverables,
      evaluation_criteria: finalEvaluation.recommended_next_task.expected_evidence,
      reason_for_task: `Directly targets ${priorityGap}, the priority gap identified in the previous evaluation.`,
    },
    next_task_strategy: {
      if_score_below_40: "Simplify and repeat the same competency with more scaffolding.",
      if_score_40_to_69: "Continue with a guided practical task on the same competency.",
      if_score_70_to_84: "Move to the next planned competency.",
      if_score_above_85: "Increase difficulty or fast-track.",
      if_no_submission: "Check in before assuming the task was skipped.",
      if_history_missing: "Fall back to a diagnostic-style task.",
      if_repeated_weakness: "Flag for mentor review after the third occurrence.",
      if_absent_or_on_leave: "Pause the roadmap without penalty.",
      if_required_resource_missing: "Substitute a mocked resource and note the limitation.",
      if_task_completed_early: "Fast-track to the next competency.",
      if_task_takes_longer_than_expected: "Extend the window without penalty if the reason is justified.",
    },
    manager_dashboard_summary: {
      strongest_skill: finalEvaluation.overall_result.strongest_competency,
      current_gap: priorityGap,
      suggested_next_task: finalEvaluation.recommended_next_task.title,
      suggested_mentor_action: finalEvaluation.human_review.required ? "Review before next task starts." : "No action needed.",
      evidence_to_show: finalEvaluation.final_strengths,
    },
  };
}

export async function runRoadmapCreatorAgentModeB(input: {
  employeeId: string;
  employeeName: string;
  targetRole: string;
  previousPayload: RoadmapPayload;
  finalEvaluation: FinalEvaluationOutput;
}): Promise<AdaptiveRoadmapPayload> {
  if (DEMO_MODE || !hasOpenAIKey()) {
    const payload = buildDemoAdaptivePayload(input.employeeId, input.employeeName, input.targetRole, input.finalEvaluation);
    return { ...payload, current_task: withTaskId(payload.current_task) };
  }

  const user = `Employee: ${input.employeeName} (id: ${input.employeeId})
Target role: ${input.targetRole}
Previous roadmap payload: ${JSON.stringify(input.previousPayload)}
Final Evaluation Report for the just-completed task: ${JSON.stringify(input.finalEvaluation)}`;

  const result = await completeJSON<AdaptiveRoadmapPayload>(MODE_B_SYSTEM_PROMPT, user);
  return { ...result, current_task: withTaskId(result.current_task) };
}
