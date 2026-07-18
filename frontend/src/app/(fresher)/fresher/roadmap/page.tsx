"use client";

import { RoadmapTimeline } from "@/features/fresher-dashboard/roadmap-timeline";
import { useUser } from "@/hooks/use-user";

export default function FresherRoadmapPage() {
  const { data: user } = useUser();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Your Roadmap</h2>
        <p className="text-sm text-muted-foreground">
          An 8-week personalized path from Flutter fundamentals to a capstone project.
        </p>
      </div>
      <RoadmapTimeline userId={user?.authId} />
    </div>
  );
}
