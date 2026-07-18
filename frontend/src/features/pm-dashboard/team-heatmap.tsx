"use client";

import { Grid3x3 } from "lucide-react";

import { GlassCard } from "@/components/shared/glass-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { usePmFreshers } from "@/services/queries/users";
import { useSkillScoresForUsers } from "@/services/queries/skill-scores";
import { cn } from "@/utils/cn";
import type { SkillScore } from "@/types/report";

function bandClass(score: number): string {
  if (score >= 80) return "bg-success/15 text-success border-success/30";
  if (score >= 50) return "bg-warning/15 text-warning border-warning/30";
  return "bg-danger/15 text-danger border-danger/30";
}

function teamAveragesBySkill(scores: SkillScore[]): { skill: string; average: number }[] {
  const latestPerUserSkill = new Map<string, number>();
  for (const s of scores) {
    const key = `${s.user_id}::${s.skill_name}`;
    if (!latestPerUserSkill.has(key)) latestPerUserSkill.set(key, s.score);
  }

  const bySkill = new Map<string, number[]>();
  for (const [key, score] of latestPerUserSkill) {
    const skill = key.split("::")[1];
    bySkill.set(skill, [...(bySkill.get(skill) ?? []), score]);
  }

  return Array.from(bySkill.entries())
    .map(([skill, values]) => ({
      skill,
      average: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    }))
    .sort((a, b) => b.average - a.average);
}

export function TeamHeatmap({ pmId }: { pmId: string | undefined }) {
  const { data: freshers } = usePmFreshers(pmId);
  const { data: scores, isLoading } = useSkillScoresForUsers(freshers?.map((e) => e.id) ?? []);
  const averages = scores ? teamAveragesBySkill(scores) : [];

  return (
    <GlassCard className="p-6">
      <h3 className="mb-4 font-semibold">Team Skill Heatmap</h3>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : averages.length === 0 ? (
        <EmptyState icon={Grid3x3} title="No skill data yet" />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {averages.map(({ skill, average }) => (
            <div key={skill} className={cn("flex flex-col justify-between rounded-xl border p-3", bandClass(average))}>
              <span className="text-xs font-medium">{skill}</span>
              <span className="text-lg font-semibold tabular-nums">{average}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
