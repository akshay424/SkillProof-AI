"use client";

import { CheckCircle2, CircleDashed, Clock3 } from "lucide-react";

import { GlassCard } from "@/components/shared/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePmDashboard } from "@/services/queries/pm";

type RoadmapStatusBucket = "COMPLETED" | "ACTIVE" | "NONE";

const STATUS_META: Record<RoadmapStatusBucket, { label: string; icon: typeof CheckCircle2; className: string }> = {
  COMPLETED: { label: "Completed", icon: CheckCircle2, className: "text-success bg-success/10" },
  ACTIVE: { label: "In progress", icon: Clock3, className: "text-warning bg-warning/10" },
  NONE: { label: "No roadmap yet", icon: CircleDashed, className: "text-muted-foreground bg-muted" },
};

// Per-task completion (not just per-roadmap) needs the adaptive pipeline's task
// history, which isn't exposed by /api/pm/dashboard — this shows roadmap-level
// completion across the team instead, which the dashboard does expose.
export function TaskCompletionStats({ pmId }: { pmId: string | undefined }) {
  const { data: dashboard, isLoading } = usePmDashboard(pmId);
  const freshers = dashboard?.freshers ?? [];

  const counts: Record<RoadmapStatusBucket, number> = { COMPLETED: 0, ACTIVE: 0, NONE: 0 };
  for (const entry of freshers) {
    const status = entry.current_roadmap?.status;
    counts[status === "COMPLETED" ? "COMPLETED" : status ? "ACTIVE" : "NONE"] += 1;
  }
  const total = freshers.length;

  return (
    <GlassCard className="p-6">
      <h3 className="mb-4 font-semibold">Roadmap Completion</h3>
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(Object.keys(STATUS_META) as RoadmapStatusBucket[]).map((status) => {
            const meta = STATUS_META[status];
            const Icon = meta.icon;
            const percent = total > 0 ? Math.round((counts[status] / total) * 100) : 0;
            return (
              <div key={status} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${meta.className}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold tabular-nums">{counts[status]}</p>
                  <p className="text-xs text-muted-foreground">
                    {meta.label} ({percent}%)
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
