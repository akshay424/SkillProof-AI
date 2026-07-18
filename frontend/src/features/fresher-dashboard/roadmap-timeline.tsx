"use client";

import { Check, Lock, PlayCircle } from "lucide-react";

import { GlassCard } from "@/components/shared/glass-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRowsSkeleton } from "@/components/shared/loading-skeletons";
import { cn } from "@/utils/cn";
import { useRoadmap } from "@/services/queries/roadmaps";
import type { WeekStatus } from "@/types/roadmap";

const STATUS_CONFIG: Record<WeekStatus, { icon: typeof Check; className: string; label: string }> = {
  completed: { icon: Check, className: "bg-success/15 text-success", label: "Completed" },
  active: { icon: PlayCircle, className: "bg-primary/15 text-primary", label: "In progress" },
  locked: { icon: Lock, className: "bg-muted text-muted-foreground", label: "Locked" },
};

export function RoadmapTimeline({
  userId,
  compact = false,
}: {
  userId: string | undefined;
  compact?: boolean;
}) {
  const { data: roadmap, isLoading } = useRoadmap(userId);
  const weeks = roadmap?.roadmap_weeks ?? [];
  const visibleWeeks = compact ? weeks.slice(0, 4) : weeks;

  return (
    <GlassCard className="p-6">
      <h3 className="mb-4 font-semibold">{roadmap?.title ?? "Roadmap"}</h3>

      {isLoading ? (
        <ListRowsSkeleton rows={compact ? 4 : 8} />
      ) : weeks.length === 0 ? (
        <EmptyState icon={Lock} title="Roadmap not generated yet" description="Your personalized roadmap will appear here once available." />
      ) : (
        <ol className="space-y-2">
          {visibleWeeks.map((week) => {
            const config = STATUS_CONFIG[week.status];
            const Icon = config.icon;
            return (
              <li
                key={week.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", config.className)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">
                      Week {week.week_number}: {week.theme}
                    </p>
                    {week.summary && <p className="text-xs text-muted-foreground">{week.summary}</p>}
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
              </li>
            );
          })}
        </ol>
      )}
    </GlassCard>
  );
}
