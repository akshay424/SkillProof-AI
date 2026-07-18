"use client";

import { TrendingDown } from "lucide-react";

import { GlassCard } from "@/components/shared/glass-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRowsSkeleton } from "@/components/shared/loading-skeletons";
import { Progress } from "@/components/ui/progress";
import { usePmDashboard } from "@/services/queries/pm";
import type { PmDashboardFresherEntry } from "@/types/pm";

// Same data limitation as team-heatmap.tsx: the real backend exposes each
// fresher's weaknesses[] (evidence-backed gaps), not a numeric team-wide score,
// so "weakest" here means most frequently reported across the team.
function teamWeaknessFrequency(freshers: PmDashboardFresherEntry[], limit = 4): { skill: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const entry of freshers) {
    for (const skill of entry.weaknesses) {
      counts.set(skill, (counts.get(skill) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function WeakSkillsPanel({ pmId }: { pmId: string | undefined }) {
  const { data: dashboard, isLoading } = usePmDashboard(pmId);
  const freshers = dashboard?.freshers ?? [];
  const weakest = teamWeaknessFrequency(freshers);

  return (
    <GlassCard className="p-6">
      <h3 className="mb-4 font-semibold">Weak Skills</h3>
      {isLoading ? (
        <ListRowsSkeleton rows={4} />
      ) : weakest.length === 0 ? (
        <EmptyState icon={TrendingDown} title="No skill gaps identified" />
      ) : (
        <div className="space-y-3">
          {weakest.map(({ skill, count }) => (
            <div key={skill} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{skill}</span>
                <span className="text-muted-foreground tabular-nums">
                  {count} of {freshers.length}
                </span>
              </div>
              <Progress value={(count / freshers.length) * 100} className="h-2" />
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
