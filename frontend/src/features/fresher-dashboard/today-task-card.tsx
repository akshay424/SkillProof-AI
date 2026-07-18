"use client";

import { Clock3, ListChecks } from "lucide-react";
import Link from "next/link";

import { GlassCard } from "@/components/shared/glass-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EvaluateDialog } from "@/features/fresher-dashboard/evaluate-dialog";
import { useUser } from "@/hooks/use-user";
import { useRoadmap } from "@/services/queries/roadmaps";
import { getCurrentTask } from "@/types/roadmap";

const DIFFICULTY_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  beginner: "secondary",
  intermediate: "default",
  advanced: "destructive",
};

export function TodayTaskCard({ userId }: { userId: string | undefined }) {
  const { data: roadmap, isLoading } = useRoadmap(userId);
  const { data: user } = useUser();

  const task = roadmap ? getCurrentTask(roadmap.roadmap_payload) : null;

  return (
    <GlassCard className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Today&apos;s Task</h3>
        <Link href="/fresher/roadmap" className="text-xs font-medium text-primary hover:underline">
          View roadmap
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : task && roadmap ? (
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-2">
            <p className="font-medium">{task.task_title}</p>
            {task.difficulty && (
              <Badge variant={DIFFICULTY_VARIANT[task.difficulty]} className="capitalize">
                {task.difficulty}
              </Badge>
            )}
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">{task.task_description}</p>
          <div className="mt-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {task.estimated_effort_minutes > 0 && (
                <span className="flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5" /> {Math.round(task.estimated_effort_minutes / 60)}h estimated
                </span>
              )}
            </div>
            {userId && (
              <EvaluateDialog
                userId={userId}
                roadmap={roadmap}
                task={task}
                gitlabToken={user?.profile.gitlab_token ?? null}
                gitlabRepoUrl={user?.profile.gitlab_repo_url ?? null}
              />
            )}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={ListChecks}
          title="No active task"
          description="You've completed every task assigned so far. New tasks unlock as you progress."
        />
      )}
    </GlassCard>
  );
}
