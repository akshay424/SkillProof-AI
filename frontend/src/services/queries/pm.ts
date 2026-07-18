import { useQuery } from "@tanstack/react-query";

import { demoStore } from "@/mocks/demo-store";
import { apiFetch } from "@/services/api-client";
import { DEMO_MODE } from "@/utils/demo-mode";
import { getCurrentTask } from "@/types/roadmap";
import type { PmDashboard, PmDashboardFresherEntry, PmFresherOverview } from "@/types/pm";
import type { BackendRoadmapOut } from "@/types/roadmap";
import type { UserProfile } from "@/types/user";

function toBackendRoadmapOut(userId: string): BackendRoadmapOut | null {
  const roadmap = demoStore.roadmaps.find((r) => r.user_id === userId);
  if (!roadmap) return null;
  const { user_id, ...rest } = roadmap;
  return { ...rest, fresher_id: user_id };
}

function latestReportSummary(userId: string, type: "task" | "weekly" | "final") {
  const reports = demoStore.evaluationReports
    .filter((r) => r.user_id === userId && r.report_type === type)
    .sort((a, b) => b.generated_at.localeCompare(a.generated_at));
  const latest = reports[0];
  if (!latest) return null;
  return { id: latest.id, report_type: type.toUpperCase(), overall_score: latest.overall_score, created_at: latest.generated_at };
}

function skillInsights(userId: string) {
  const scores = demoStore.skillScores.filter((s) => s.user_id === userId);
  const latestByskill = new Map<string, number>();
  for (const s of [...scores].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))) {
    if (!latestByskill.has(s.skill_name)) latestByskill.set(s.skill_name, s.score);
  }
  const sorted = Array.from(latestByskill.entries()).sort((a, b) => b[1] - a[1]);
  return {
    strongest_skill: sorted[0]?.[0] ?? null,
    current_gap: sorted[sorted.length - 1]?.[0] ?? null,
    strengths: sorted.slice(0, 2).map(([name]) => name),
    weaknesses: sorted.slice(-2).map(([name]) => name),
  };
}

function demoFresherEntry(fresher: UserProfile): PmDashboardFresherEntry {
  const roadmap = toBackendRoadmapOut(fresher.id);
  const insights = skillInsights(fresher.id);
  const currentTask = roadmap?.roadmap_payload ? getCurrentTask(roadmap.roadmap_payload) : null;

  return {
    fresher: { id: fresher.id, email: `${fresher.role}.demo@skillproof.ai`, name: fresher.full_name ?? "Fresher", role: "FRESHER", is_active: true },
    current_roadmap: roadmap,
    roadmap_progress: roadmap?.completion_pct ?? 0,
    latest_daily_report: latestReportSummary(fresher.id, "task"),
    latest_weekly_report: latestReportSummary(fresher.id, "weekly"),
    final_report: latestReportSummary(fresher.id, "final"),
    strongest_skill: insights.strongest_skill,
    current_gap: insights.current_gap,
    next_learning_focus: currentTask?.focus_competency ?? null,
    mentor_required: false,
    evidence: [],
    current_assigned_task: currentTask ? { task_id: currentTask.task_id, task_title: currentTask.task_title } : null,
    strengths: insights.strengths,
    weaknesses: insights.weaknesses,
    needs_human_interaction: false,
    last_activity_at: roadmap?.updated_at ?? null,
  };
}

export function usePmDashboard(pmId: string | undefined) {
  return useQuery({
    queryKey: ["pm-dashboard", pmId],
    enabled: DEMO_MODE || !!pmId,
    queryFn: async (): Promise<PmDashboard> => {
      if (DEMO_MODE) {
        const freshers = demoStore.users.filter((u) => u.role === "fresher" && u.pm_id === pmId);
        const entries = freshers.map(demoFresherEntry);
        return {
          pm: { id: pmId ?? "", email: "pm.demo@skillproof.ai", name: "PM", role: "PM", is_active: true },
          summary: {
            assigned_freshers: entries.length,
            freshers_needing_interaction: entries.filter((e) => e.needs_human_interaction).length,
            reports_received_this_week: entries.filter((e) => e.latest_daily_report).length,
          },
          freshers: entries,
        };
      }

      return apiFetch<PmDashboard>("/api/pm/dashboard");
    },
  });
}

export function useFresherOverview(fresherId: string | undefined) {
  return useQuery({
    queryKey: ["fresher-overview", fresherId],
    enabled: DEMO_MODE || !!fresherId,
    queryFn: async (): Promise<PmFresherOverview | null> => {
      if (DEMO_MODE) {
        const fresher = demoStore.users.find((u) => u.id === fresherId);
        if (!fresher) return null;
        const entry = demoFresherEntry(fresher);
        return {
          fresher: entry.fresher,
          profile: {
            target_role: fresher.target_role,
            joining_date: null,
            resume_summary: fresher.resume_text,
            interview_evaluation: fresher.interview_notes,
            profile_metadata: { job_title: fresher.job_title },
          },
          current_roadmap: entry.current_roadmap,
          latest_daily_report: entry.latest_daily_report,
          latest_weekly_report: entry.latest_weekly_report,
          final_report: entry.final_report,
          insights: {
            strongest_skill: entry.strongest_skill,
            current_gap: entry.current_gap,
            next_learning_focus: entry.next_learning_focus,
            mentor_required: entry.mentor_required,
            evidence: entry.evidence,
            current_assigned_task: entry.current_assigned_task,
            overall_score: entry.latest_daily_report?.overall_score ?? null,
            strengths: entry.strengths,
            weaknesses: entry.weaknesses,
          },
        };
      }

      if (!fresherId) return null;
      return apiFetch<PmFresherOverview>(`/api/pm/freshers/${fresherId}/overview`);
    },
  });
}
