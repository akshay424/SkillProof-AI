"use client";

import { use } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { RecentReportsList } from "@/features/fresher-dashboard/recent-reports-list";
import { RoadmapTimeline } from "@/features/fresher-dashboard/roadmap-timeline";
import { SkillHeatmap } from "@/features/fresher-dashboard/skill-heatmap";
import { WeeklyProgress } from "@/features/fresher-dashboard/weekly-progress";
import { useUserProfileById } from "@/services/queries/users";

function initials(name: string | null) {
  if (!name) return "U";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function FresherDrilldownPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: fresher, isLoading } = useUserProfileById(id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/pm"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to team
      </Link>

      {isLoading ? (
        <Skeleton className="h-12 w-64" />
      ) : fresher ? (
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={fresher.avatar_url ?? undefined} />
            <AvatarFallback>{initials(fresher.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{fresher.full_name}</h2>
            <p className="text-sm text-muted-foreground">{fresher.job_title ?? "Fresher"}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Fresher not found.</p>
      )}

      {fresher && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <WeeklyProgress userId={fresher.id} />
            <RoadmapTimeline userId={fresher.id} />
            <RecentReportsList userId={fresher.id} />
          </div>
          <SkillHeatmap userId={fresher.id} />
        </div>
      )}
    </div>
  );
}
