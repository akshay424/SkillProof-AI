"use client";

import { UsersTable } from "@/features/admin/users-table";
import { useUser } from "@/hooks/use-user";

export default function AdminUsersPage() {
  const { data: user } = useUser();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Users</h2>
        <p className="text-sm text-muted-foreground">
          Manage roles and supervisor assignments across your organization.
        </p>
      </div>
      <UsersTable organizationId={user?.profile.organization_id ?? undefined} />
    </div>
  );
}
