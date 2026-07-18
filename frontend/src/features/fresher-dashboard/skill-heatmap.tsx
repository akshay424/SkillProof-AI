"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useLatestSkillScores } from "@/services/queries/skill-scores";
import { cn } from "@/utils/cn";
import { Grid3x3 } from "lucide-react";

function bandClass(score: number): string {
  if (score >= 80) return "bg-success/15 text-success border-success/30";
  if (score >= 50) return "bg-warning/15 text-warning border-warning/30";
  return "bg-danger/15 text-danger border-danger/30";
}

export function SkillHeatmap({ userId }: { userId: string | undefined }) {
  const { data: scores, isLoading } = useLatestSkillScores(userId);

  return (
    <GlassCard className="p-6">
      <h3 className="mb-4 font-semibold">Skill Heatmap</h3>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : !scores || scores.length === 0 ? (
        <EmptyState icon={Grid3x3} title="No skill data yet" description="Complete the diagnostic to see your skill breakdown." />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {scores.map((score) => (
            <div
              key={score.skill_name}
              className={cn("flex flex-col justify-between rounded-xl border p-3", bandClass(score.score))}
            >
              <span className="text-xs font-medium">{score.skill_name}</span>
              <span className="text-lg font-semibold tabular-nums">{score.score}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
