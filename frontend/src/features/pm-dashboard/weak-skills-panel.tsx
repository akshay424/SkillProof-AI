"use client";

import { TrendingDown } from "lucide-react";

import { GlassCard } from "@/components/shared/glass-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRowsSkeleton } from "@/components/shared/loading-skeletons";
import { Progress } from "@/components/ui/progress";
import { usePmFreshers } from "@/services/queries/users";
import { useSkillScoresForUsers } from "@/services/queries/skill-scores";
import type { SkillScore } from "@/types/report";

function weakestSkills(scores: SkillScore[], limit = 4): { skill: string; average: number }[] {
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
    .sort((a, b) => a.average - b.average)
    .slice(0, limit);
}

export function WeakSkillsPanel({ pmId }: { pmId: string | undefined }) {
  const { data: freshers } = usePmFreshers(pmId);
  const { data: scores, isLoading } = useSkillScoresForUsers(freshers?.map((e) => e.id) ?? []);
  const weakest = scores ? weakestSkills(scores) : [];

  return (
    <GlassCard className="p-6">
      <h3 className="mb-4 font-semibold">Weak Skills</h3>
      {isLoading ? (
        <ListRowsSkeleton rows={4} />
      ) : weakest.length === 0 ? (
        <EmptyState icon={TrendingDown} title="No skill gaps identified" />
      ) : (
        <div className="space-y-3">
          {weakest.map(({ skill, average }) => (
            <div key={skill} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{skill}</span>
                <span className="text-muted-foreground tabular-nums">{average}%</span>
              </div>
              <Progress value={average} className="h-2" />
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
