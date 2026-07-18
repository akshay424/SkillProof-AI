"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { GlassCard } from "@/components/shared/glass-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { usePmDashboard } from "@/services/queries/pm";

// The real backend's PM dashboard is a snapshot, not a time series (no
// per-fresher score history at the team level), so this renders each fresher's
// current roadmap progress side by side rather than a trend over time.
export function ReadinessTrendChart({ pmId }: { pmId: string | undefined }) {
  const { data: dashboard, isLoading } = usePmDashboard(pmId);
  const series = (dashboard?.freshers ?? [])
    .map((entry) => ({ name: entry.fresher.name.split(" ")[0], progress: Math.round(entry.roadmap_progress) }))
    .sort((a, b) => b.progress - a.progress);

  return (
    <GlassCard className="p-6">
      <h3 className="mb-4 font-semibold">Team Readiness</h3>

      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : series.length === 0 ? (
        <EmptyState icon={TrendingUp} title="Not enough data yet" description="Readiness appears once freshers have a roadmap in progress." />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                borderColor: "hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value}%`, "Roadmap progress"]}
            />
            <Bar dataKey="progress" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </GlassCard>
  );
}
