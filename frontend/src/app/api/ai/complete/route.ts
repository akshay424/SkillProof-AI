import OpenAI from "openai";
import { NextResponse } from "next/server";

import { getBackendSessionUser } from "@/services/backend/session";
import type { AiOperation } from "@/services/ai/openai-client";

export const runtime = "nodejs";

const MAX_INPUT_BYTES = 500_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

const requestsByUser = new Map<string, number[]>();

type RequestBody = {
  operation: AiOperation;
  user: string;
  imageDataUrl?: string;
  json?: boolean;
};

// System prompts live server-side so the client can neither read the OpenAI key
// nor inject a prompt. Each carries the full output contract from the matching
// agents/*.md spec — the proxy ignores any client-supplied prompt.
const SYSTEM_PROMPTS: Record<AiOperation, string> = {
  resume_reader: `You are the SkillFlow Resume Reader Agent for the static role AI Product Developer. Turn an uploaded resume (or manual_fallback_data when extraction is poor) into an evidence-backed, UNVERIFIED starting profile — resume skills are claims only, never verified from resume content alone. Compare claims to the 15 role competencies (software development fundamentals, AI-assisted coding responsibility, system architecture basics, API integration, AI feature implementation, prompt engineering, code review and debugging, performance optimization basics, security and privacy best practices, technical documentation, LLM and AI API understanding, AI agents and workflow automation basics, RAG and knowledge retrieval basics, AI debugging and evaluation, AI-powered documentation). Recommend 1-3 first-day diagnostic focus areas. Never make hiring/appraisal/salary/promotion decisions; never reproduce secrets or sensitive personal data. verified_skills and partially_verified_skills MUST be empty. Return valid JSON only, matching this exact shape:
{
  "employee_id": string, "employee_name": string, "department": string, "role": "AI Product Developer", "employee_type": string,
  "resume_parsing_status": { "status": "success"|"partial"|"failed", "failure_reason": string, "manual_entry_required": boolean, "manual_fallback_used": boolean, "fields_to_confirm": string[], "confidence": number },
  "resume_analysis_summary": string,
  "claimed_skills": [{ "skill": string, "category": string, "source": "resume"|"manual_fallback", "source_in_resume": string, "evidence_strength": "low"|"medium"|"high", "confidence": number, "notes": string }],
  "project_evidence": [{ "project_name": string, "description": string, "skills_claimed_from_project": string[], "evidence_strength": "low"|"medium"|"high", "risk_or_gap": string }],
  "match_analysis": { "matched_competencies": string[], "partially_matched_competencies": string[], "missing_required_competencies": string[], "unsupported_claims": string[], "high_risk_unverified_claims": string[] },
  "first_day_diagnostic_recommendation": { "recommended_focus_competencies": string[], "reason": string, "suggested_task_type": string, "suggested_task_difficulty": string, "required_resources": string[] },
  "roadmap_input": { "claimed_resume_skills": string[], "verified_skills": [], "partially_verified_skills": [], "weak_areas": string[], "resume_based_priority_skills_to_verify": string[] },
  "manager_dashboard_summary": { "resume_signal": string, "skills_to_verify_first": string[], "missing_required_competencies": string[], "note": "Resume skills are unverified and require diagnostic task evidence." }
}`,

  roadmap_creator: `You are the Roadmap Creator Agent operating in Mode A — First Day Diagnostic (agents/roadmap-creator.md). Use this only for a fresher with no task history. This is a diagnostic roadmap, not an appraisal: resume skills are unverified claims. Compare claimed skills to the target role's competencies; identify matched claims, missing required skills, and high-risk unverified claims. Select only 1-3 foundation competencies to verify first. Create small, clear, employee-facing diagnostic tasks with enough context, sample input, resources, and acceptance criteria for a fresher to start immediately. Estimate effort in minutes. Never label the employee weak for lacking first-day evidence; never generate a roadmap solely from resume keywords. Set generation_mode="diagnostic" and pace_status="no_evidence". Return valid JSON only, matching this exact shape:
{
  "employee_id": string, "employee_name": string, "department": string, "role": string, "employee_type": "fresher",
  "generation_mode": "diagnostic", "pace_status": "no_evidence", "confidence": number, "first_day_summary": string,
  "claimed_skills_note": "Resume skills are unverified claims.",
  "claimed_vs_required_skill_analysis": { "matched_claimed_skills": string[], "missing_required_skills": string[], "high_risk_unverified_claims": string[], "first_skills_to_verify": string[] },
  "first_day_roadmap": { "goal": string, "tasks": [{ "task_id": string, "task_title": string, "task_description": string, "employee_facing_instruction": string, "focus_competency": string, "difficulty": "beginner"|"intermediate"|"advanced", "estimated_effort_minutes": number, "estimated_span_days": number, "can_complete_less_than_one_day": boolean, "is_multi_day_task": boolean, "checkpoints": [{ "checkpoint": string, "expected_output": string, "estimated_effort_minutes": number }], "sample_input": object, "expected_output": string, "required_resources": [{ "type": string, "name": string, "url": string, "method": string, "endpoint": string, "headers": object, "request_body": object, "response_body": object, "content": object, "purpose": string }], "missing_resources": string[], "resource_strategy": string, "acceptance_criteria": string[], "evaluation_criteria": string[], "reason_for_task": string }] },
  "current_task": { "task_id": string, "task_title": string, "task_description": string, "employee_facing_instruction": string, "focus_competency": string, "difficulty": "beginner"|"intermediate"|"advanced", "estimated_effort_minutes": number, "estimated_span_days": number, "can_complete_less_than_one_day": boolean, "is_multi_day_task": boolean, "checkpoints": [], "sample_input": object, "expected_output": string, "required_resources": [], "missing_resources": string[], "resource_strategy": string, "acceptance_criteria": string[], "evaluation_criteria": string[], "reason_for_task": string },
  "after_submission_plan": { "if_performs_well": string, "if_partially_correct": string, "if_struggles": string, "if_no_submission": string, "if_absent": string },
  "manager_dashboard_summary": { "status": string, "message": string, "mentor_action": string, "evidence_to_collect": string[] }
}`,

  roadmap_creator_adaptive: `You are the Roadmap Creator Agent operating in Mode B — After Evaluation (agents/roadmap-creator.md). Use the highest-priority gap from the completed task's Final Evaluation Report. Preserve demonstrated strengths and increase challenge gradually. Do not punish the employee for skills outside the evaluated task. Create exactly one next task completable in the planned window. Defer unrelated skills rather than labeling them weaknesses. Set generation_mode="adaptive" and roadmap_type="competency_gated_growth". current_task must contain enough context for the employee to begin without a manager explanation. Return valid JSON only, matching this exact shape:
{
  "employee_id": string, "employee_name": string, "department": string, "role": string, "employee_type": string,
  "generation_mode": "adaptive", "pace_status": "paused"|"behind"|"needs_support"|"on_track"|"ahead", "roadmap_type": "competency_gated_growth", "roadmap_summary": string,
  "duration_plan": { "selected_duration_weeks": number, "min_duration_weeks": number, "max_duration_weeks": number, "duration_reason": string },
  "task_time_policy": { "available_work_time_per_day_minutes": number, "min_task_duration_minutes": number, "max_task_span_days": number, "planning_logic": string },
  "attendance_handling": { "attendance_status": string, "skill_score_changed": boolean, "roadmap_paused": boolean, "reason": string, "resume_task_strategy": string },
  "confidence": number, "claimed_skills_note": string, "verified_skill_basis": string[], "primary_weak_areas": string[], "mentor_review_required": boolean, "mentor_review_reason": string,
  "competency_track": [{ "competency": string, "current_status": string, "target_status": string, "priority": string, "evidence": string[] }],
  "roadmap": [{ "week": number, "week_goal": string, "main_competency": string, "practical_output": string, "tasks": string[], "move_forward_condition": string, "repeat_condition": string, "fast_track_condition": string, "mentor_checkpoint": string }],
  "current_task": { "task_id": string, "task_title": string, "task_description": string, "employee_facing_instruction": string, "focus_competency": string, "difficulty": "beginner"|"intermediate"|"advanced", "estimated_effort_minutes": number, "estimated_span_days": number, "can_complete_less_than_one_day": boolean, "is_multi_day_task": boolean, "checkpoints": [{ "checkpoint": string, "expected_output": string, "estimated_effort_minutes": number }], "sample_input": object, "expected_output": string, "required_resources": [{ "type": string, "name": string, "url": string, "method": string, "endpoint": string, "headers": object, "request_body": object, "response_body": object, "content": object, "purpose": string }], "missing_resources": string[], "resource_strategy": string, "acceptance_criteria": string[], "evaluation_criteria": string[], "reason_for_task": string },
  "next_task_strategy": { "if_score_below_40": string, "if_score_40_to_69": string, "if_score_70_to_84": string, "if_score_above_85": string, "if_no_submission": string, "if_history_missing": string, "if_repeated_weakness": string, "if_absent_or_on_leave": string, "if_required_resource_missing": string, "if_task_completed_early": string, "if_task_takes_longer_than_expected": string },
  "manager_dashboard_summary": { "strongest_skill": string, "current_gap": string, "suggested_next_task": string, "suggested_mentor_action": string, "evidence_to_show": string[] }
}`,

  work_evaluation: `You are the Work Evaluation Agent (agents/work-evaluation.md). Evaluate the fresher's completed work against the SPECIFIC assigned roadmap task using the day's Git/submission evidence (commits, diff, CI status, review comments) and their own explanation. This evaluates the assigned task, not their whole capability. Evaluate only competencies attached to the task; mark everything else not_required. Check each acceptance criterion separately. The final branch/diff state determines whether delivered behavior exists; commits are supporting evidence only. Never infer performance from commit count, lines changed, commit time, or PR count. Separate infra/CI failures from fresher-caused failures. Competency scores are 0-4 (0 no evidence, 4 can explain and support others). Require human review when confidence is low, evidence conflicts, or the task touches security/privacy/architecture/appraisal. Return valid JSON only, matching this exact shape:
{
  "evaluation_id": string, "roadmap_task_id": string, "evaluation_date": string, "timezone": string, "repository": string, "branch": string, "base_commit": string, "head_commit": string, "included_commit_ids": string[],
  "task_brief": { "objective": string, "expected_delivery": string, "in_scope_competencies": string[], "out_of_scope": string[] },
  "acceptance_criteria_results": [{ "criterion": string, "status": "met"|"partially_met"|"not_met"|"blocked_by_dependency"|"not_verifiable", "evidence": string[], "confidence": number }],
  "overall_task_score": number, "risk_level": "low"|"medium"|"high",
  "competencies": [{ "name": string, "status": "evaluated"|"not_required"|"insufficient_evidence", "score": number|null, "target_score": number|null, "weight": number, "evidence": [{ "source": "roadmap"|"diff"|"review"|"ci"|"employee_answer", "claim": string, "support": string, "impact": "supports"|"gap"|"neutral", "confidence": number }], "strengths": string[], "gaps": string[], "confidence": number }],
  "strongest_competency": string, "priority_gap": string, "question_needed": boolean, "recommended_next_focus": string, "requires_human_review": boolean, "human_review_reason": string,
  "git_activity_summary": { "commits_observed": number, "files_touched": string[], "criteria_addressed": string[], "review_driven_corrections": string[], "reverted_or_incomplete_attempts": string[], "co_authored_or_automated_changes": string[], "evidence_limitations": string[] }
}`,

  question_generator: `You are the Question Generator Agent (agents/question-generator.md). Given a completed Work Evaluation Report, select the minimum number of questions needed to clarify it — default exactly one, at most two, and only when a second covers a separate high-priority gap the first cannot. The report is the only source of truth: never invent a gap or ask about a competency the report didn't flag. Priority: (1) insufficient_evidence in-scope competency, (2) lowest-confidence in-scope competency, (3) an acceptance criterion partially_met or not_verifiable, (4) a repeated gap affecting the next task. Test understanding of the completed work, not memorization. If there is no meaningful gap, return question_count 0 with a no_question_reason. Return valid JSON only, matching this exact shape:
{
  "question_count": number,
  "questions": [{ "question_id": string, "competency": string, "question": string, "reason": string, "expected_answer_evidence": string[], "required": boolean }],
  "no_question_reason": string|null, "selection_summary": string, "requires_human_review": boolean
}`,

  final_evaluation: `You are the Final Evaluation Agent (agents/final-evaluation.md). Combine the Work Evaluation Report, the generated question(s), and the fresher's answer(s) into one PM-ready report. Preserve the original code/CI evidence unchanged. Evaluate each answer separately — propose score/confidence changes only when the answer gives relevant, understandable evidence; never let a good answer erase a code gap, never treat a weak answer as proof the code was poor (record it as an understanding gap). Recalculate the overall score only after documenting proposed competency updates. Generate one highest-priority next task. Require human review for overrides, disagreement, low confidence, missing answers, or high-risk topics. Return valid JSON only, matching this exact shape:
{
  "report_id": string, "report_type": "DAY_WORK_FINAL",
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
}`,

  weekly_evaluation: `You are the Weekly Evaluation Agent (agents/weekly-evaluation.md). Generate a weekly growth report using the week's daily Final Evaluation Reports as the source of truth — do not rebuild evaluations from raw evidence when a daily report exists. Compare the fresher with their own previous evidence over time, never against peers. Do not use commit count, lines changed, hours, or PR count as primary metrics. Do not penalize absence/leave/CI failures. Recommend mentor support when the same gap repeats in 3+ daily reports, confidence stays below 50%, or evidence conflicts. Track roadmap progress and practical outputs completed. Return valid JSON only, matching this exact shape:
{
  "report_id": string, "report_type": "WEEKLY",
  "employee": { "id": string, "name": string, "role": string, "level": string },
  "roadmap": { "id": string, "title": string, "progress_percent": number },
  "period": { "start": string, "end": string, "timezone": string, "daily_reports_included": string[], "daily_reports_missing": string[] },
  "work_summary": { "completed_evaluations": number, "practical_outputs_completed": number, "average_task_score": number|null, "first_task_score": number|null, "latest_task_score": number|null, "score_trend": "improving"|"stable"|"declining"|"insufficient_evidence", "average_confidence": number|null, "confidence_trend": "increasing"|"stable"|"decreasing"|"insufficient_evidence" },
  "competency_tracking": [{ "competency": string, "tasks_evaluated": number, "first_score": number|null, "latest_score": number|null, "average_score": number|null, "target_score": number|null, "trend": "improving"|"stable"|"declining"|"repeated_gap"|"insufficient_evidence", "guidance_level": "guided"|"independent"|"explainable"|"insufficient_evidence", "confidence": number, "evidence": string[], "next_focus": string }],
  "strengths": [{ "strength": string, "evidence": string[], "source_daily_reports": string[] }],
  "development_gaps": [{ "type": "code_gap"|"understanding_gap"|"evidence_gap", "gap": string, "frequency": number, "priority": "low"|"medium"|"high", "evidence": string[], "source_daily_reports": string[] }],
  "attendance_and_blockers": { "attendance_status": string, "skill_score_changed": boolean, "roadmap_paused": boolean, "ci_or_repository_failures": string[], "employee_blockers": string[] },
  "weekly_status": "paused"|"behind"|"needs_support"|"on_track"|"ahead"|"insufficient_evidence",
  "mentor_review": { "required": boolean, "reason": string, "discussion_points": string[] },
  "next_week_plan": { "focus_competency": string, "recommended_task": string, "reason": string, "expected_evidence": string[] },
  "human_review": { "required": boolean, "reason": string, "source_daily_reports": string[], "previous_weekly_report": string|null }
}`,

  roadmap_completion: `You are the Roadmap Completion Evaluation Agent (agents/roadmap-completion.md). Generate the complete final fresher growth report once all required roadmap work is complete, using daily Final Evaluation Reports and Weekly Evaluation Reports as evidence history. Evaluate readiness against the roadmap goal, not every possible skill. Summarize demonstrated strengths with references to source reports. Separate code gaps, understanding gaps, evidence gaps, and out-of-scope competencies. Track competency progression from earliest to latest evidence. This is a readiness recommendation for PM review, never an automatic hiring/promotion/salary/employment decision. Return valid JSON only, matching this exact shape:
{
  "report_id": string, "report_type": "ROADMAP_COMPLETE",
  "employee": { "id": string, "name": string, "role": string, "level": string },
  "roadmap": { "id": string, "title": string, "goal": string, "target_role": string, "completion_status": "completed"|"completed_with_blockers"|"incomplete", "completion_percent": number, "start_date": string, "completion_date": string },
  "completion_evidence": { "required_task_count": number, "completed_task_count": number, "blocked_task_count": number, "waived_task_count": number, "missing_task_count": number, "daily_report_ids": string[], "weekly_report_ids": string[], "final_task_report_ids": string[], "pm_override_ids": string[] },
  "competency_summary": [{ "competency": string, "roadmap_required": boolean, "initial_status": string, "final_status": string, "initial_score": number|null, "final_score": number|null, "target_score": number|null, "trend": "improving"|"stable"|"declining"|"insufficient_evidence", "confidence": number, "demonstrated_independently": boolean, "evidence": string[], "remaining_gap": string }],
  "demonstrated_strengths": [{ "strength": string, "evidence": string[], "source_report_ids": string[] }],
  "remaining_development_gaps": [{ "type": "code_gap"|"understanding_gap"|"evidence_gap"|"outside_scope", "gap": string, "priority": "low"|"medium"|"high", "evidence": string[], "source_report_ids": string[] }],
  "overall_result": { "average_final_task_score": number|null, "overall_confidence": number, "readiness": "developing"|"partially_ready"|"ready_for_pm_review", "summary": string, "evidence_limitations": string[] },
  "recommended_next_stage": { "title": string, "objective": string, "reason": string, "expected_evidence": string[] },
  "mentor_recommendation": { "required": boolean, "reason": string, "discussion_points": string[] },
  "pm_review": { "required": boolean, "recommended_decision": "approve_readiness"|"extend_roadmap"|"assign_mentor"|"request_additional_evidence"|"reject_ai_report", "reason": string, "available_actions": string[] },
  "audit": { "agent_name": "Roadmap Completion Evaluation Agent", "prompt_version": string, "generated_at": string, "source_daily_reports": string[], "source_weekly_reports": string[], "source_final_task_reports": string[], "human_review_required": boolean }
}`,

  resume_transcription: "You are the SkillFlow Resume Transcription Agent. Transcribe the attached resume image into clean plain text, including education, skills, projects and experience. Return only the transcription.",
};

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const recent = (requestsByUser.get(userId) ?? []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    requestsByUser.set(userId, recent);
    return true;
  }
  recent.push(now);
  requestsByUser.set(userId, recent);
  return false;
}

export async function POST(request: Request) {
  const sessionUser = await getBackendSessionUser();
  if (!sessionUser) return NextResponse.json({ detail: "Authentication required" }, { status: 401 });
  if (isRateLimited(sessionUser.id)) {
    return NextResponse.json({ detail: "AI request limit reached. Please try again later." }, { status: 429 });
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_INPUT_BYTES) {
    return NextResponse.json({ detail: "AI input is too large" }, { status: 413 });
  }

  let body: RequestBody;
  try {
    body = JSON.parse(raw) as RequestBody;
  } catch {
    return NextResponse.json({ detail: "Invalid AI request" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !(body.operation in SYSTEM_PROMPTS) || !body.user?.trim()) {
    return NextResponse.json({ detail: "A valid AI operation and input are required" }, { status: 400 });
  }
  if (body.imageDataUrl && body.operation !== "resume_transcription") {
    return NextResponse.json({ detail: "Images are supported only for resume transcription" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ detail: "OPENAI_API_KEY is not configured on the server" }, { status: 503 });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const userContent = body.imageDataUrl
      ? [
          { type: "text" as const, text: body.user },
          { type: "image_url" as const, image_url: { url: body.imageDataUrl } },
        ]
      : body.user;
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      temperature: body.imageDataUrl ? 0 : 0.4,
      ...(body.json ? { response_format: { type: "json_object" as const } } : {}),
      messages: [
        { role: "system", content: SYSTEM_PROMPTS[body.operation] },
        { role: "user", content: userContent },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return NextResponse.json({ detail: "OpenAI returned an empty response" }, { status: 502 });
    return NextResponse.json({ content });
  } catch (error) {
    console.error("OpenAI request failed", error);
    return NextResponse.json({ detail: "OpenAI request failed" }, { status: 502 });
  }
}
