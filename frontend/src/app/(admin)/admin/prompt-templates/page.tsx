"use client";

import { PromptTemplatesTable } from "@/features/admin/prompt-templates-table";
import { useUser } from "@/hooks/use-user";

export default function AdminPromptTemplatesPage() {
  const { data: user } = useUser();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Prompt Templates</h2>
        <p className="text-sm text-muted-foreground">
          Edit the prompts that drive AI code review, roadmap generation, and viva questions.
        </p>
      </div>
      <PromptTemplatesTable
        organizationId={user?.profile.organization_id ?? undefined}
        updatedBy={user?.authId}
      />
    </div>
  );
}
