"use client";

import { AISuggestionsCard } from "@/features/fresher-dashboard/ai-suggestions-card";
import { GreetingCard } from "@/features/fresher-dashboard/greeting-card";
import { OnboardingCard } from "@/features/fresher-dashboard/onboarding-card";
import { ReadinessGauge } from "@/features/fresher-dashboard/readiness-gauge";
import { RecentReportsList } from "@/features/fresher-dashboard/recent-reports-list";
import { RoadmapTimeline } from "@/features/fresher-dashboard/roadmap-timeline";
import { SkillHeatmap } from "@/features/fresher-dashboard/skill-heatmap";
import { TodayTaskCard } from "@/features/fresher-dashboard/today-task-card";
import { WeeklyProgress } from "@/features/fresher-dashboard/weekly-progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/use-user";
import { useRoadmap } from "@/services/queries/roadmaps";

export default function FresherDashboardPage() {
  const { data: user } = useUser();
  const userId = user?.authId;
  const { data: roadmap, isLoading: roadmapLoading } = useRoadmap(userId);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <GreetingCard />

      {roadmapLoading ? (
        <Skeleton className="h-72 w-full rounded-2xl" />
      ) : !roadmap ? (
        user && <OnboardingCard profile={user.profile} />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
