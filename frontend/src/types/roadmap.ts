// Mirrors the roadmap output contracts from agents/roadmap-creator.md.
// Mode A (diagnostic) is the fresher's very first roadmap. Mode B and friends
// (adaptive/recovery/fast_track/mentor_guided/paused) regenerate a new roadmap
// version after each task evaluation — see roadmap-creator-agent.ts.

export type TaskDifficulty = "beginner" | "intermediate" | "advanced";
export type GenerationMode = "diagnostic" | "adaptive" | "recovery" | "fast_track" | "mentor_guided" | "paused";

export interface DiagnosticCheckpoint {
  checkpoint: string;
  expected_output: string;
  estimated_effort_minutes: number;
}

export interface DiagnosticResource {
  type: string;
  name: string;
  url: string;
  method: string;
  endpoint: string;
  headers: Record<string, string>;
  request_body: Record<string, unknown>;
  response_body: Record<string, unknown>;
  content: Record<string, unknown>;
  purpose: string;
}

/** Shared shape for both the diagnostic contract's per-task entries and the
 * adaptive contract's `current_task` — identical field-for-field in both specs.
 * `task_id` is client-assigned (not part of the AI's own output) — the real
 * backend validates report submissions against a task_id it can look up inside
 * roadmap_payload.current_task, so every task needs a stable id. */
export interface DiagnosticTask {
  task_id: string;
  task_title: string;
  task_description: string;
  employee_facing_instruction: string;
  focus_competency: string;
  difficulty: TaskDifficulty;
  estimated_effort_minutes: number;
  estimated_span_days: number;
  can_complete_less_than_one_day: boolean;
  is_multi_day_task: boolean;
  checkpoints: DiagnosticCheckpoint[];
  sample_input: Record<string, unknown>;
  expected_output: string;
  required_resources: DiagnosticResource[];
  missing_resources: string[];
  resource_strategy: string;
  acceptance_criteria: string[];
  evaluation_criteria: string[];
  reason_for_task: string;
}

export interface FirstDayRoadmapPayload {
  employee_id: string;
  employee_name: string;
  department: string;
  role: string;
  employee_type: "fresher";
  generation_mode: "diagnostic";
  pace_status: "no_evidence";
  confidence: number;
  first_day_summary: string;
  claimed_skills_note: string;
  claimed_vs_required_skill_analysis: {
    matched_claimed_skills: string[];
    missing_required_skills: string[];
    high_risk_unverified_claims: string[];
    first_skills_to_verify: string[];
  };
  first_day_roadmap: {
    goal: string;
    tasks: DiagnosticTask[];
  };
  /** Mirrors first_day_roadmap.tasks[0] — the backend's report-validation only
   * looks for a task_id under this key, not inside first_day_roadmap. */
  current_task: DiagnosticTask;
  after_submission_plan: {
    if_performs_well: string;
    if_partially_correct: string;
    if_struggles: string;
    if_no_submission: string;
    if_absent: string;
  };
  manager_dashboard_summary: {
    status: string;
    message: string;
    mentor_action: string;
    evidence_to_collect: string[];
  };
}

export interface AdaptiveRoadmapWeek {
  week: number;
  week_goal: string;
  main_competency: string;
  practical_output: string;
  tasks: string[];
  move_forward_condition: string;
  repeat_condition: string;
  fast_track_condition: string;
  mentor_checkpoint: string;
}

export interface CompetencyTrackEntry {
  competency: string;
  current_status: string;
  target_status: string;
  priority: string;
  evidence: string[];
}

/** Mode B (and recovery/fast_track/mentor_guided/paused) — the "General roadmap
 * output contract" from agents/roadmap-creator.md, produced after each task evaluation. */
export interface AdaptiveRoadmapPayload {
  employee_id: string;
  employee_name: string;
  department: string;
  role: string;
  employee_type: string;
  generation_mode: Exclude<GenerationMode, "diagnostic">;
  pace_status: "paused" | "behind" | "needs_support" | "on_track" | "ahead";
  roadmap_type: "competency_gated_growth";
  roadmap_summary: string;
  duration_plan: {
    selected_duration_weeks: number;
    min_duration_weeks: number;
    max_duration_weeks: number;
    duration_reason: string;
  };
  task_time_policy: {
    available_work_time_per_day_minutes: number;
    min_task_duration_minutes: number;
    max_task_span_days: number;
    planning_logic: string;
  };
  attendance_handling: {
    attendance_status: string;
    skill_score_changed: boolean;
    roadmap_paused: boolean;
    reason: string;
    resume_task_strategy: string;
  };
  confidence: number;
  claimed_skills_note: string;
  verified_skill_basis: string[];
  primary_weak_areas: string[];
  mentor_review_required: boolean;
  mentor_review_reason: string;
  competency_track: CompetencyTrackEntry[];
  roadmap: AdaptiveRoadmapWeek[];
  current_task: DiagnosticTask;
  next_task_strategy: {
    if_score_below_40: string;
    if_score_40_to_69: string;
    if_score_70_to_84: string;
    if_score_above_85: string;
    if_no_submission: string;
    if_history_missing: string;
    if_repeated_weakness: string;
    if_absent_or_on_leave: string;
    if_required_resource_missing: string;
    if_task_completed_early: string;
    if_task_takes_longer_than_expected: string;
  };
  manager_dashboard_summary: {
    strongest_skill: string;
    current_gap: string;
    suggested_next_task: string;
    suggested_mentor_action: string;
    evidence_to_show: string[];
  };
}

export type RoadmapPayload = FirstDayRoadmapPayload | AdaptiveRoadmapPayload;

export function isDiagnosticPayload(payload: RoadmapPayload): payload is FirstDayRoadmapPayload {
  return payload.generation_mode === "diagnostic";
}

/** The single task the fresher should work on right now, regardless of which mode generated the roadmap. */
export function getCurrentTask(payload: RoadmapPayload): DiagnosticTask | null {
  return payload.current_task ?? null;
}

/** Wraps the diagnostic/adaptive payload the way the real backend's RoadmapOut does. */
export interface RoadmapRecord {
  id: string;
  client_roadmap_id: string | null;
  user_id: string;
  version: number;
  title: string | null;
  target_role: string | null;
  status: string;
  completion_pct: number;
  roadmap_payload: RoadmapPayload;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Raw shape the real backend's RoadmapOut schema returns (fresher_id, not user_id). */
export interface BackendRoadmapOut {
  id: string;
  client_roadmap_id: string | null;
  fresher_id: string;
  version: number;
  title: string | null;
  target_role: string | null;
  status: string;
  completion_pct: number;
  roadmap_payload: RoadmapPayload | null;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
}
