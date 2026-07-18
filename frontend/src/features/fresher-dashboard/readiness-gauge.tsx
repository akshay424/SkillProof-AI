"use client";

import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";

import { GlassCard } from "@/components/shared/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLatestSkillScores } from "@/services/queries/skill-scores";

function readinessLabel(score: number): string {
  if (score >= 80) return "Project ready";
  if (score >= 50) return "Developing";
  return "Needs focus";
}

export function ReadinessGauge({ userId }: { userId: string | undefined }) {
  const { data: scores, isLoading } = useLatestSkillScores(userId);

  const average =
    scores && scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
      : 0;

  const chartData = [{ name: "readiness", value: average, fill: "hsl(var(--primary))" }];

  return (
    <GlassCard className="flex flex-col items-center p-6">
      <h3 className="mb-2 self-start font-semibold">Current Readiness</h3>
      {isLoading ? (
        <Skeleton className="h-40 w-40 rounded-full" />
      ) : (
        <div className="relative flex h-40 w-40 items-center justify-center">
          <RadialBarChart
            width={160}
            height={160}
            cx="50%"
            cy="50%"
            innerRadius="72%"
            outerRadius="100%"
            barSize={12}
            data={chartData}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background dataKey="value" cornerRadius={8} />
          </RadialBarChart>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-semibold tabular-nums">{average}%</span>
            <span className="text-xs text-muted-foreground">{readinessLabel(average)}</span>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
