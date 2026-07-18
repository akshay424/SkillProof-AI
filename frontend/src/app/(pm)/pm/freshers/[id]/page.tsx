"use client";

import { use } from "react";
import { ArrowLeft, BookOpenCheck, ClipboardCheck } from "lucide-react";
import Link from "next/link";

import { GlassCard } from "@/components/shared/glass-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePmFresherOverview } from "@/services/queries/users";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export default function FresherDrilldownPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: overview, isLoading } = usePmFresherOverview(id);
  const task = asRecord(overview?.current_roadmap?.roadmap_payload?.current_task);
  const evaluation = asRecord(overview?.latest_daily_report?.report_payload?.evaluation);
  const skills = asStrings(evaluation.verified_skills);
  const gaps = asStrings(evaluation.weak_areas);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/pm" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to team
      </Link>

      {isLoading ? <Skeleton className="h-12 w-64" /> : !overview ? (
        <p className="text-sm text-muted-foreground">Fresher not found or not assigned to you.</p>
      ) : (
        <>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{overview.fresher.name}</h2>
            <p className="text-sm text-muted-foreground">{overview.profile?.target_role ?? "Fresher"}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GlassCard className="space-y-3 p-6">
              <div className="flex items-center gap-2"><BookOpenCheck className="h-4 w-4 text-primary" /><h3 className="font-semibold">Current Roadmap</h3></div>
              {overview.current_roadmap ? <>
                <p className="font-medium">{overview.current_roadmap.title ?? "Roadmap"}</p>
                <p className="text-sm text-muted-foreground">{overview.current_roadmap.completion_pct}% complete</p>
                {typeof task.task_title === "string" && <p className="rounded-lg bg-muted p-3 text-sm">Current task: {task.task_title}</p>}
              </> : <p className="text-sm text-muted-foreground">No active roadmap.</p>}
            </GlassCard>

            <GlassCard className="space-y-3 p-6">
              <div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" /><h3 className="font-semibold">Latest Evaluation</h3></div>
              {overview.latest_daily_report ? <>
                <Badge variant={(overview.latest_daily_report.overall_score ?? 0) >= 70 ? "secondary" : "outline"}>{overview.latest_daily_report.overall_score ?? "—"}/100</Badge>
                <div className="flex flex-wrap gap-2">{skills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}</div>
                {gaps.length > 0 && <p className="text-sm text-muted-foreground">Focus: {gaps.join(", ")}</p>}
              </> : <p className="text-sm text-muted-foreground">No daily evaluation submitted.</p>}
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}
