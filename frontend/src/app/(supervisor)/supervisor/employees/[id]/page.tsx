"use client";

import { use } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { RecentReportsList } from "@/features/employee-dashboard/recent-reports-list";
import { RoadmapTimeline } from "@/features/employee-dashboard/roadmap-timeline";
import { SkillHeatmap } from "@/features/employee-dashboard/skill-heatmap";
import { WeeklyProgress } from "@/features/employee-dashboard/weekly-progress";
import { useUserProfileById } from "@/services/queries/users";

function initials(name: string | null) {
  if (!name) return "U";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function EmployeeDrilldownPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: employee, isLoading } = useUserProfileById(id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/supervisor"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to team
      </Link>

      {isLoading ? (
        <Skeleton className="h-12 w-64" />
      ) : employee ? (
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={employee.avatar_url ?? undefined} />
            <AvatarFallback>{initials(employee.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{employee.full_name}</h2>
            <p className="text-sm text-muted-foreground">{employee.job_title ?? "Employee"}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Employee not found.</p>
      )}

      {employee && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <WeeklyProgress userId={employee.id} />
            <RoadmapTimeline userId={employee.id} />
            <RecentReportsList userId={employee.id} />
          </div>
          <SkillHeatmap userId={employee.id} />
        </div>
      )}
    </div>
  );
}
