"use client";

import { BookOpen, ShieldCheck, UsersRound } from "lucide-react";

import { DashboardGridSkeleton } from "@/components/shared/loading-skeletons";
import { StatCard } from "@/components/shared/stat-card";
import { useUser } from "@/hooks/use-user";
import { useLearningPaths } from "@/services/queries/learning-paths";
import { useOrgMembers } from "@/services/queries/users";

export default function AdminOverviewPage() {
  const { data: user } = useUser();
  const organizationId = user?.profile.organization_id ?? undefined;

  const { data: members, isLoading: loadingMembers } = useOrgMembers(organizationId);
  const { data: paths, isLoading: loadingPaths } = useLearningPaths(organizationId);

  const employeeCount = members?.filter((m) => m.role === "employee").length ?? 0;
  const supervisorCount = members?.filter((m) => m.role === "supervisor").length ?? 0;
  const activePathCount = paths?.filter((p) => p.is_active).length ?? 0;

  const isLoading = loadingMembers || loadingPaths;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Organization Overview</h2>
        <p className="text-sm text-muted-foreground">
          A snapshot of employees, supervisors, and learning paths in your organization.
        </p>
      </div>

      {isLoading ? (
        <DashboardGridSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Employees" value={String(employeeCount)} icon={UsersRound} accent="primary" />
          <StatCard label="Supervisors" value={String(supervisorCount)} icon={ShieldCheck} accent="success" />
          <StatCard label="Active Learning Paths" value={String(activePathCount)} icon={BookOpen} accent="warning" />
        </div>
      )}
    </div>
  );
}
