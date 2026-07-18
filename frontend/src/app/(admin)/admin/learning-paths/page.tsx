"use client";

import { LearningPathsManager } from "@/features/admin/learning-paths-manager";
import { useUser } from "@/hooks/use-user";

export default function AdminLearningPathsPage() {
  const { data: user } = useUser();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Learning Paths</h2>
        <p className="text-sm text-muted-foreground">
          Roadmap templates assigned to employees in your organization.
        </p>
      </div>
      <LearningPathsManager organizationId={user?.profile.organization_id ?? undefined} />
    </div>
  );
}
