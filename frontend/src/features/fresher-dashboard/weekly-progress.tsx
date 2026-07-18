"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoadmap } from "@/services/queries/roadmaps";
import { isDiagnosticPayload } from "@/types/roadmap";

export function WeeklyProgress({ userId }: { userId: string | undefined }) {
  const { data: roadmap, isLoading } = useRoadmap(userId);

  const percent = Math.round(roadmap?.completion_pct ?? 0);
  const payload = roadmap?.roadmap_payload;
  const summary = payload
    ? isDiagnosticPayload(payload)
      ? `${payload.first_day_roadmap.tasks.length} task${payload.first_day_roadmap.tasks.length === 1 ? "" : "s"} in first-day plan`
      : `${payload.duration_plan.selected_duration_weeks}-week adaptive plan`
    : null;

  return (
    <GlassCard className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Roadmap Progress</h3>
        {!isLoading && summary && (
          <span className="text-sm font-medium text-muted-foreground">{summary}</span>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-3 w-full rounded-full" />
      ) : (
        <div className="space-y-2">
          <Progress value={percent} className="h-3" />
          <p className="text-xs text-muted-foreground">{percent}% complete</p>
        </div>
      )}
    </GlassCard>
  );
}
