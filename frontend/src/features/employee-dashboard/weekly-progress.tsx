"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoadmap } from "@/services/queries/roadmaps";

export function WeeklyProgress({ userId }: { userId: string | undefined }) {
  const { data: roadmap, isLoading } = useRoadmap(userId);

  const weeks = roadmap?.roadmap_weeks ?? [];
  const completedWeeks = weeks.filter((w) => w.status === "completed").length;
  const currentWeek = weeks.find((w) => w.status === "active");
  const percent = weeks.length > 0 ? Math.round((completedWeeks / weeks.length) * 100) : 0;

  return (
    <GlassCard className="flex h-full flex-col justify-between p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Weekly Progress</h3>
        {!isLoading && (
          <span className="text-sm font-medium text-muted-foreground">
            Week {currentWeek?.week_number ?? completedWeeks} of {roadmap?.total_weeks ?? 8}
          </span>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-3 w-full rounded-full" />
      ) : (
        <div className="space-y-2">
          <Progress value={percent} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {completedWeeks} of {weeks.length} weeks completed ({percent}%)
          </p>
        </div>
      )}
    </GlassCard>
  );
}
