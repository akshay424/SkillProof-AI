// Mirrors the real backend's PM-facing endpoints. These responses have NO
// Pydantic response_model in the backend's own OpenAPI spec (untyped `{}`) —
// treat every field as observed/best-effort, not a guaranteed contract.
import type { BackendRoadmapOut } from "@/types/roadmap";
import type { BackendAuthUser } from "@/types/user";

interface BackendReportSummary {
  id: string;
  report_type: string;
  overall_score: number | null;
  created_at: string;
}

/** One row of GET /api/pm/dashboard's `freshers[]`. */
export interface PmDashboardFresherEntry {
  fresher: BackendAuthUser;
  current_roadmap: BackendRoadmapOut | null;
  roadmap_progress: number;
  latest_daily_report: BackendReportSummary | null;
  latest_weekly_report: BackendReportSummary | null;
  final_report: BackendReportSummary | null;
  strongest_skill: string | null;
  current_gap: string | null;
  next_learning_focus: string | null;
  mentor_required: boolean;
  evidence: string[];
  current_assigned_task: { task_id: string; task_title: string } | null;
  strengths: string[];
  weaknesses: string[];
  needs_human_interaction: boolean;
  last_activity_at: string | null;
}

export interface PmDashboard {
  pm: BackendAuthUser;
  summary: {
    assigned_freshers: number;
    freshers_needing_interaction: number;
    reports_received_this_week: number;
  };
  freshers: PmDashboardFresherEntry[];
}

/** GET /api/pm/freshers/{fresher_id}/overview — per-fresher drill-down. Note
 * profile_metadata may contain secrets (gitlab_token) echoed verbatim by the
 * backend; never render it directly in the PM UI. */
export interface PmFresherOverview {
  fresher: BackendAuthUser;
  profile: {
    target_role: string | null;
    joining_date: string | null;
    resume_summary: unknown;
    interview_evaluation: unknown;
    profile_metadata: Record<string, unknown> | null;
  };
  current_roadmap: BackendRoadmapOut | null;
  latest_daily_report: BackendReportSummary | null;
  latest_weekly_report: BackendReportSummary | null;
  final_report: BackendReportSummary | null;
  insights: {
    strongest_skill: string | null;
    current_gap: string | null;
    next_learning_focus: string | null;
    mentor_required: boolean;
    evidence: string[];
    current_assigned_task: { task_id: string; task_title: string } | null;
    overall_score: number | null;
    strengths: string[];
    weaknesses: string[];
  };
}
