"use client";

import { CheckCircle2, CircleDashed, Clock3, Send } from "lucide-react";

import { GlassCard } from "@/components/shared/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePmFreshers } from "@/services/queries/users";
import { useTasksForUsers } from "@/services/queries/tasks";
import type { TaskStatus } from "@/types/task";

const STATUS_META: Record<TaskStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  completed: { label: "Completed", icon: CheckCircle2, className: "text-success bg-success/10" },
  submitted: { label: "Submitted", icon: Send, className: "text-primary bg-primary/10" },
  in_progress: { label: "In progress", icon: Clock3, className: "text-warning bg-warning/10" },
  not_started: { label: "Not started", icon: CircleDashed, className: "text-muted-foreground bg-muted" },
};

export function TaskCompletionStats({ pmId }: { pmId: string | undefined }) {
  const { data: freshers } = usePmFreshers(pmId);
  const { data: tasks, isLoading } = useTasksForUsers(freshers?.map((e) => e.id) ?? []);

  const counts: Record<TaskStatus, number> = {
    completed: 0,
    submitted: 0,
    in_progress: 0,
    not_started: 0,
  };
  for (const task of tasks ?? []) counts[task.status] += 1;
  const total = tasks?.length ?? 0;

  return (
    <GlassCard className="p-6">
      <h3 className="mb-4 font-semibold">Task Completion</h3>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(STATUS_META) as TaskStatus[]).map((status) => {
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
