"use client";

import { FreshersTable } from "@/features/pm-dashboard/freshers-table";
import { ReadinessTrendChart } from "@/features/pm-dashboard/readiness-trend-chart";
import { TaskCompletionStats } from "@/features/pm-dashboard/task-completion-stats";
import { TeamHeatmap } from "@/features/pm-dashboard/team-heatmap";
import { UnassignedFreshersList } from "@/features/pm-dashboard/unassigned-freshers-list";
import { WeakSkillsPanel } from "@/features/pm-dashboard/weak-skills-panel";
import { useUser } from "@/hooks/use-user";

export default function PmDashboardPage() {
  const { data: user } = useUser();
  const pmId = user?.authId;
  const organizationId = user?.profile.organization_id ?? undefined;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Team Overview</h2>
        <p className="text-sm text-muted-foreground">
          Progress and readiness across the freshers you manage.
        </p>
      </div>

      <UnassignedFreshersList organizationId={organizationId} pmId={pmId} />

      <FreshersTable pmId={pmId} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ReadinessTrendChart pmId={pmId} />
        <TeamHeatmap pmId={pmId} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TaskCompletionStats pmId={pmId} />
        <WeakSkillsPanel pmId={pmId} />
      </div>
    </div>
  );
}
