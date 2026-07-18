"use client";

import { TrendingUp } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { GlassCard } from "@/components/shared/glass-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { usePmFreshers } from "@/services/queries/users";
import { useSkillScoresForUsers } from "@/services/queries/skill-scores";
import { formatDate } from "@/utils/format-date";
import type { SkillScore } from "@/types/report";

function trendSeries(scores: SkillScore[]): { date: string; average: number }[] {
  const byDate = new Map<string, number[]>();
  for (const s of scores) {
    const day = s.recorded_at.slice(0, 10);
    byDate.set(day, [...(byDate.get(day) ?? []), s.score]);
  }
  return Array.from(byDate.entries())
    .map(([date, values]) => ({ date, average: Math.round(values.reduce((a, b) => a + b, 0) / values.length) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function ReadinessTrendChart({ pmId }: { pmId: string | undefined }) {
  const { data: freshers } = usePmFreshers(pmId);
  const { data: scores, isLoading } = useSkillScoresForUsers(freshers?.map((e) => e.id) ?? []);
  const series = scores ? trendSeries(scores) : [];
  const growth =
    series.length >= 2 ? series[series.length - 1].average - series[0].average : null;

  return (
    <GlassCard className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Readiness Trend</h3>
        {growth !== null && (
          <span className={`text-xs font-medium ${growth >= 0 ? "text-success" : "text-danger"}`}>
            {growth >= 0 ? "+" : ""}
            {growth} pts since first record
          </span>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : series.length === 0 ? (
        <EmptyState icon={TrendingUp} title="Not enough data yet" description="Trend appears once the team has recorded skill scores." />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tickFormatter={(value) => formatDate(value, { month: "short", day: "numeric" })}
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                borderColor: "hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelFormatter={(value) => formatDate(value as string)}
            />
            <Line type="monotone" dataKey="average" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </GlassCard>
  );
}
