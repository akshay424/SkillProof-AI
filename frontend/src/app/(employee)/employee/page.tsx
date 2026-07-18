"use client";

import { AISuggestionsCard } from "@/features/employee-dashboard/ai-suggestions-card";
import { GreetingCard } from "@/features/employee-dashboard/greeting-card";
import { ReadinessGauge } from "@/features/employee-dashboard/readiness-gauge";
import { RecentReportsList } from "@/features/employee-dashboard/recent-reports-list";
import { RoadmapTimeline } from "@/features/employee-dashboard/roadmap-timeline";
import { SkillHeatmap } from "@/features/employee-dashboard/skill-heatmap";
import { TodayTaskCard } from "@/features/employee-dashboard/today-task-card";
import { WeeklyProgress } from "@/features/employee-dashboard/weekly-progress";
import { useUser } from "@/hooks/use-user";

export default function EmployeeDashboardPage() {
  const { data: user } = useUser();
  const userId = user?.authId;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <GreetingCard />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TodayTaskCard userId={userId} />
        </div>
        <ReadinessGauge userId={userId} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <WeeklyProgress userId={userId} />
          <RoadmapTimeline userId={userId} compact />
        </div>
        <div className="space-y-6">
          <SkillHeatmap userId={userId} />
          <AISuggestionsCard />
        </div>
      </div>

      <RecentReportsList userId={userId} />
    </div>
  );
}
