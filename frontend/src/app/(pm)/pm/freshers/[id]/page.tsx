"use client";

import { use } from "react";
import { AlertTriangle, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/shared/glass-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useFresherOverview } from "@/services/queries/pm";
import { formatDate } from "@/utils/format-date";

function initials(name: string | null) {
  if (!name) return "U";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function reportRow(key: string, label: string, report: { overall_score: number | null; created_at: string } | null) {
  if (!report) return null;
  return (
    <div key={key} className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{formatDate(report.created_at)}</p>
      </div>
      {report.overall_score !== null && (
        <Badge variant={report.overall_score >= 70 ? "secondary" : "outline"}>{report.overall_score}/100</Badge>
      )}
    </div>
  );
}

export default function FresherDrilldownPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: overview, isLoading } = useFresherOverview(id);

  // profile_metadata can carry sensitive fields (e.g. a GitLab token) echoed
  // verbatim by the backend — only ever read the specific safe key we need.
  const jobTitle =
    typeof overview?.profile.profile_metadata?.job_title === "string"
      ? overview.profile.profile_metadata.job_title
      : null;

  const roadmap = overview?.current_roadmap;
  const reports = [
    reportRow("daily", "Latest daily report", overview?.latest_daily_report ?? null),
    reportRow("weekly", "Weekly report", overview?.latest_weekly_report ?? null),
    reportRow("final", "Final report", overview?.final_report ?? null),
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/pm"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to team
      </Link>

      {isLoading ? (
        <Skeleton className="h-12 w-64" />
      ) : overview ? (
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={undefined} />
            <AvatarFallback>{initials(overview.fresher.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{overview.fresher.name}</h2>
            <p className="text-sm text-muted-foreground">
              {jobTitle ?? overview.profile.target_role ?? "Fresher"}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Fresher not found.</p>
      )}

      {overview && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <GlassCard className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">{roadmap?.title ?? "Roadmap"}</h3>
                {roadmap && (
                  <Badge variant={roadmap.status === "COMPLETED" ? "secondary" : "outline"}>{roadmap.status}</Badge>
                )}
              </div>
              {roadmap ? (
                <div className="space-y-2">
                  <Progress value={roadmap.completion_pct} className="h-3" />
                  <p className="text-xs text-muted-foreground">{Math.round(roadmap.completion_pct)}% complete</p>
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No roadmap yet"
                  description="This fresher hasn't generated a roadmap yet."
                />
              )}
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="mb-4 font-semibold">Reports</h3>
              {reports.length > 0 ? (
                <div className="space-y-2">{reports}</div>
              ) : (
                <EmptyState icon={FileText} title="No reports yet" description="Reports appear once tasks are evaluated." />
              )}
            </GlassCard>
          </div>

          <GlassCard className="space-y-4 p-6">
            <h3 className="font-semibold">Insights</h3>
            {overview.insights.mentor_required && (
              <p className="flex items-center gap-1.5 text-xs text-warning">
                <AlertTriangle className="h-3.5 w-3.5" /> Mentor review recommended
              </p>
            )}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Strongest skill</p>
              <p className="text-sm">{overview.insights.strongest_skill ?? "Not enough data yet"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Current gap</p>
              <p className="text-sm">{overview.insights.current_gap ?? "Not enough data yet"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Next learning focus</p>
              <p className="text-sm">{overview.insights.next_learning_focus ?? "—"}</p>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
