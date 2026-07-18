// Mirrors agents/work-evaluation.md, agents/question-generator.md, and
// agents/final-evaluation.md — the "Evaluate" button pipeline.

export type CriterionStatus = "met" | "partially_met" | "not_met" | "blocked_by_dependency" | "not_verifiable";
export type RiskLevel = "low" | "medium" | "high";
export type EvidenceSource = "roadmap" | "diff" | "review" | "ci" | "employee_answer";
export type EvidenceImpact = "supports" | "gap" | "neutral";

export interface AcceptanceCriterionResult {
  criterion: string;
  status: CriterionStatus;
  evidence: string[];
  confidence: number;
}

export interface EvidenceItem {
  source: EvidenceSource;
  claim: string;
  support: string;
  impact: EvidenceImpact;
  confidence: number;
}

export interface CompetencyEvaluation {
  name: string;
  status: "evaluated" | "not_required" | "insufficient_evidence";
  score: number | null;
  target_score: number | null;
  weight: number;
  evidence: EvidenceItem[];
  strengths: string[];
  gaps: string[];
  confidence: number;
}

export interface GitActivitySummary {
  commits_observed: number;
  files_touched: string[];
  criteria_addressed: string[];
  review_driven_corrections: string[];
  reverted_or_incomplete_attempts: string[];
  co_authored_or_automated_changes: string[];
  evidence_limitations: string[];
}

/** Output of the Work Evaluation Agent (agents/work-evaluation.md). */
export interface WorkEvaluationOutput {
  evaluation_id: string;
  roadmap_task_id: string;
  evaluation_date: string;
  timezone: string;
  repository: string;
  branch: string;
  base_commit: string;
  head_commit: string;
  included_commit_ids: string[];
  task_brief: {
    objective: string;
    expected_delivery: string;
    in_scope_competencies: string[];
    out_of_scope: string[];
  };
  acceptance_criteria_results: AcceptanceCriterionResult[];
  overall_task_score: number;
  risk_level: RiskLevel;
  competencies: CompetencyEvaluation[];
  strongest_competency: string;
  priority_gap: string;
  question_needed: boolean;
  recommended_next_focus: string;
  requires_human_review: boolean;
  human_review_reason: string;
  git_activity_summary: GitActivitySummary;
}

export interface GeneratedQuestion {
  question_id: string;
  competency: string;
  question: string;
  reason: string;
  expected_answer_evidence: string[];
  required: boolean;
}

/** Output of the Question Generator Agent (agents/question-generator.md). */
export interface QuestionGeneratorOutput {
  question_count: number;
  questions: GeneratedQuestion[];
  no_question_reason: string | null;
  selection_summary: string;
  requires_human_review: boolean;
}

/** Raw question + fresher answer, before the Final Evaluation Agent assesses it. */
export interface QuestionAnswerInput {
  question_id: string;
  competency: string;
  question: string;
  answer: string;
}

export interface AnsweredQuestion extends QuestionAnswerInput {
  answer_status: "answered" | "partially_answered" | "unanswered";
  understanding_assessment: string;
  answer_evidence: string[];
  confidence: number;
}

export interface FinalCompetencyEvaluation {
  name: string;
  status: "evaluated" | "not_required" | "insufficient_evidence";
  previous_score: number | null;
  proposed_score: number | null;
  target_score: number | null;
  weight: number;
  previous_confidence: number;
  proposed_confidence: number;
  code_and_ci_evidence: string[];
  answer_evidence: string[];
  strengths: string[];
  gaps: string[];
  score_change_reason: string;
}

export interface DevelopmentGap {
  type: "code_gap" | "understanding_gap" | "evidence_gap" | "not_required";
  gap: string;
  evidence: string[];
  priority: "low" | "medium" | "high";
}

/** Output of the Final Evaluation Agent (agents/final-evaluation.md) — the
 * PM-ready report, POSTed as report_payload to /api/freshers/me/reports/daily. */
export interface FinalEvaluationOutput {
  report_id: string;
  report_type: "DAY_WORK_FINAL";
  employee: { id: string; name: string; role: string; level: string };
  roadmap: {
    id: string;
    task_id: string;
    task_title: string;
    objective: string;
    complexity: string;
    evaluation_date: string;
    timezone: string;
  };
  work_summary: {
    repository: string;
    branch: string;
    pull_request_id: string | null;
    base_commit: string;
    head_commit: string;
    commits_observed: string[];
    files_changed: string[];
    build_status: "passed" | "failed" | "blocked";
    tests: { passed: number; failed: number; new_tests: number };
    coverage: { before: number | null; after: number | null };
    review_summary: string;
    employee_explanation: string;
  };
  task_expectation: {
    acceptance_criteria: string[];
    in_scope_competencies: string[];
    out_of_scope_competencies: string[];
  };
  acceptance_criteria_assessment: AcceptanceCriterionResult[];
  competencies: FinalCompetencyEvaluation[];
  questions_and_answers: AnsweredQuestion[];
  overall_result: {
    previous_score: number | null;
    proposed_score: number | null;
    risk_level: RiskLevel;
    strongest_competency: string;
    priority_gap: string;
    summary: string;
  };
  final_strengths: string[];
  development_gaps: DevelopmentGap[];
  recommended_next_task: {
    title: string;
    objective: string;
    deliverables: string[];
    target_competency: string;
    estimated_minutes: number;
    expected_evidence: string[];
  };
  pm_action: {
    recommended_decision: "approve" | "approve_with_changes" | "request_rework" | "mentor_review" | "reject_ai_evaluation";
    reason: string;
    options: string[];
  };
  human_review: {
    required: boolean;
    reason: string;
    source_evaluation_id: string;
    question_generator_id: string;
    prompt_versions: string[];
  };
}

export type Trend = "improving" | "stable" | "declining" | "insufficient_evidence";

/** Output of the Weekly Evaluation Agent (agents/weekly-evaluation.md) — POSTed
 * as report_payload to /api/freshers/me/reports/weekly. */
export interface WeeklyEvaluationOutput {
  report_id: string;
  report_type: "WEEKLY";
  employee: { id: string; name: string; role: string; level: string };
  roadmap: { id: string; title: string; progress_percent: number };
  period: {
    start: string;
    end: string;
    timezone: string;
    daily_reports_included: string[];
    daily_reports_missing: string[];
  };
  work_summary: {
    completed_evaluations: number;
    practical_outputs_completed: number;
    average_task_score: number | null;
    first_task_score: number | null;
    latest_task_score: number | null;
    score_trend: Trend;
    average_confidence: number | null;
    confidence_trend: "increasing" | "stable" | "decreasing" | "insufficient_evidence";
  };
  competency_tracking: {
    competency: string;
    tasks_evaluated: number;
    first_score: number | null;
    latest_score: number | null;
    average_score: number | null;
    target_score: number | null;
    trend: Trend | "repeated_gap";
    guidance_level: "guided" | "independent" | "explainable" | "insufficient_evidence";
    confidence: number;
    evidence: string[];
    next_focus: string;
  }[];
  strengths: { strength: string; evidence: string[]; source_daily_reports: string[] }[];
  development_gaps: {
    type: "code_gap" | "understanding_gap" | "evidence_gap";
    gap: string;
    frequency: number;
    priority: "low" | "medium" | "high";
    evidence: string[];
    source_daily_reports: string[];
  }[];
  attendance_and_blockers: {
    attendance_status: string;
    skill_score_changed: boolean;
    roadmap_paused: boolean;
    ci_or_repository_failures: string[];
    employee_blockers: string[];
  };
  weekly_status: "paused" | "behind" | "needs_support" | "on_track" | "ahead" | "insufficient_evidence";
  mentor_review: { required: boolean; reason: string; discussion_points: string[] };
  next_week_plan: { focus_competency: string; recommended_task: string; reason: string; expected_evidence: string[] };
  human_review: {
    required: boolean;
    reason: string;
    source_daily_reports: string[];
    previous_weekly_report: string | null;
  };
}

/** Output of the Roadmap Completion Evaluation Agent
 * (agents/roadmap-completion.md) — POSTed as report_payload to
 * /api/freshers/me/reports/final after POST .../roadmaps/{id}/complete. */
export interface RoadmapCompletionOutput {
  report_id: string;
  report_type: "ROADMAP_COMPLETE";
  employee: { id: string; name: string; role: string; level: string };
  roadmap: {
    id: string;
    title: string;
    goal: string;
    target_role: string;
    completion_status: "completed" | "completed_with_blockers" | "incomplete";
    completion_percent: number;
    start_date: string;
    completion_date: string;
  };
  completion_evidence: {
    required_task_count: number;
    completed_task_count: number;
    blocked_task_count: number;
    waived_task_count: number;
    missing_task_count: number;
    daily_report_ids: string[];
    weekly_report_ids: string[];
    final_task_report_ids: string[];
    pm_override_ids: string[];
  };
  competency_summary: {
    competency: string;
    roadmap_required: boolean;
    initial_status: string;
    final_status: string;
    initial_score: number | null;
    final_score: number | null;
    target_score: number | null;
    trend: Trend;
    confidence: number;
    demonstrated_independently: boolean;
    evidence: string[];
    remaining_gap: string;
  }[];
  demonstrated_strengths: { strength: string; evidence: string[]; source_report_ids: string[] }[];
  remaining_development_gaps: {
    type: "code_gap" | "understanding_gap" | "evidence_gap" | "outside_scope";
    gap: string;
    priority: "low" | "medium" | "high";
    evidence: string[];
    source_report_ids: string[];
  }[];
  overall_result: {
    average_final_task_score: number | null;
    overall_confidence: number;
    readiness: "developing" | "partially_ready" | "ready_for_pm_review";
    summary: string;
    evidence_limitations: string[];
  };
  recommended_next_stage: { title: string; objective: string; reason: string; expected_evidence: string[] };
  mentor_recommendation: { required: boolean; reason: string; discussion_points: string[] };
  pm_review: {
    required: boolean;
    recommended_decision:
      | "approve_readiness"
      | "extend_roadmap"
      | "assign_mentor"
      | "request_additional_evidence"
      | "reject_ai_report";
    reason: string;
    available_actions: string[];
  };
  audit: {
    agent_name: "Roadmap Completion Evaluation Agent";
    prompt_version: string;
    generated_at: string;
    source_daily_reports: string[];
    source_weekly_reports: string[];
    source_final_task_reports: string[];
    human_review_required: boolean;
  };
}
