"use client";

import { EmployeesTable } from "@/features/supervisor-dashboard/employees-table";
import { ReadinessTrendChart } from "@/features/supervisor-dashboard/readiness-trend-chart";
import { TaskCompletionStats } from "@/features/supervisor-dashboard/task-completion-stats";
import { TeamHeatmap } from "@/features/supervisor-dashboard/team-heatmap";
import { WeakSkillsPanel } from "@/features/supervisor-dashboard/weak-skills-panel";
import { useUser } from "@/hooks/use-user";

export default function SupervisorDashboardPage() {
  const { data: user } = useUser();
  const supervisorId = user?.authId;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Team Overview</h2>
        <p className="text-sm text-muted-foreground">
          Progress and readiness across your direct reports.
        </p>
      </div>

      <EmployeesTable supervisorId={supervisorId} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ReadinessTrendChart supervisorId={supervisorId} />
        <TeamHeatmap supervisorId={supervisorId} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TaskCompletionStats supervisorId={supervisorId} />
        <WeakSkillsPanel supervisorId={supervisorId} />
      </div>
    </div>
  );
}
