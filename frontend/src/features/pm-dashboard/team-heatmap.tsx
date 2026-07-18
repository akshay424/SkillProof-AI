"use client";

import { Grid3x3 } from "lucide-react";

import { GlassCard } from "@/components/shared/glass-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { usePmDashboard } from "@/services/queries/pm";
import { cn } from "@/utils/cn";
import type { PmDashboardFresherEntry } from "@/types/pm";

function bandClass(ratio: number): string {
  if (ratio >= 0.5) return "bg-success/15 text-success border-success/30";
  if (ratio >= 0.25) return "bg-warning/15 text-warning border-warning/30";
  return "bg-muted text-muted-foreground border-border";
}

// The real backend's PM dashboard doesn't expose per-skill numeric scores at the
// team level — only each fresher's evidence-backed strengths[]. So "heatmap" here
// means how many freshers demonstrate each skill as a strength, not an average score.
function teamStrengthFrequency(freshers: PmDashboardFresherEntry[]): { skill: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const entry of freshers) {
    for (const skill of entry.strengths) {
      counts.set(skill, (counts.get(skill) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count);
}

export function TeamHeatmap({ pmId }: { pmId: string | undefined }) {
  const { data: dashboard, isLoading } = usePmDashboard(pmId);
  const freshers = dashboard?.freshers ?? [];
  const frequencies = teamStrengthFrequency(freshers);

  return (
    <GlassCard className="p-6">
      <h3 className="mb-1 font-semibold">Team Strengths</h3>
      <p className="mb-4 text-xs text-muted-foreground">How many freshers demonstrate each skill as a strength</p>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : frequencies.length === 0 ? (
        <EmptyState icon={Grid3x3} title="No skill data yet" />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {frequencies.map(({ skill, count }) => (
            <div
              key={skill}
              className={cn("flex flex-col justify-between rounded-xl border p-3", bandClass(count / freshers.length))}
            >
              <span className="text-xs font-medium">{skill}</span>
              <span className="text-lg font-semibold tabular-nums">
                {count}/{freshers.length}
              </span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
