"use client";

import { ClipboardList, Lock } from "lucide-react";

import { GlassCard } from "@/components/shared/glass-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRowsSkeleton } from "@/components/shared/loading-skeletons";
import { useRoadmap } from "@/services/queries/roadmaps";
import { isDiagnosticPayload } from "@/types/roadmap";

export function RoadmapTimeline({
  userId,
  compact = false,
}: {
  userId: string | undefined;
  compact?: boolean;
}) {
  const { data: roadmap, isLoading } = useRoadmap(userId);
  const payload = roadmap?.roadmap_payload;

  const rows = payload
    ? isDiagnosticPayload(payload)
      ? payload.first_day_roadmap.tasks.map((task) => ({
          key: task.task_title,
          title: task.task_title,
          subtitle: task.focus_competency,
          badge: task.difficulty,
        }))
      : payload.roadmap.map((week) => ({
          key: `week-${week.week}`,
          title: `Week ${week.week}: ${week.week_goal}`,
          subtitle: week.main_competency,
          badge: undefined,
        }))
    : [];
  const visibleRows = compact ? rows.slice(0, 4) : rows;

  return (
    <GlassCard className="p-6">
      <h3 className="mb-4 font-semibold">{roadmap?.title ?? "Roadmap"}</h3>

      {isLoading ? (
        <ListRowsSkeleton rows={compact ? 4 : 8} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Lock} title="Roadmap not generated yet" description="Your personalized roadmap will appear here once available." />
      ) : (
        <ol className="space-y-2">
          {visibleRows.map((row) => (
            <li
              key={row.key}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <ClipboardList className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{row.title}</p>
                  <p className="text-xs text-muted-foreground">{row.subtitle}</p>
                </div>
              </div>
              {row.badge && <span className="text-xs font-medium capitalize text-muted-foreground">{row.badge}</span>}
            </li>
          ))}
        </ol>
      )}
    </GlassCard>
  );
}
