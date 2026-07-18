"use client";

import { AIConfigForm } from "@/features/admin/ai-config-form";
import { SystemStatusWidget } from "@/features/admin/system-status-widget";
import { useUser } from "@/hooks/use-user";

export default function AdminAIConfigurationPage() {
  const { data: user } = useUser();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">AI Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Choose the AI provider and model used for code review, roadmap generation, and viva
          interviews, and confirm the backend is verifying requests correctly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AIConfigForm organizationId={user?.profile.organization_id ?? undefined} />
        <SystemStatusWidget />
      </div>
    </div>
  );
}
