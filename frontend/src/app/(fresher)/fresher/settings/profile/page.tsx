"use client";

import { ProfileSettingsForm } from "@/features/fresher-dashboard/profile-settings-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/use-user";

export default function FresherProfileSettingsPage() {
  const { data: user, isLoading } = useUser();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Profile Settings</h2>
        <p className="text-sm text-muted-foreground">Update your name, job title, and avatar.</p>
      </div>
      {isLoading || !user ? (
        <Skeleton className="h-64 w-full max-w-xl rounded-2xl" />
      ) : (
        <ProfileSettingsForm profile={user.profile} />
      )}
    </div>
  );
}
