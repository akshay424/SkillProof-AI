"use client";

import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import { GlassCard } from "@/components/shared/glass-card";
import { ListRowsSkeleton } from "@/components/shared/loading-skeletons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useClaimFresher, useUnassignedFreshers } from "@/services/queries/users";

function initials(name: string | null) {
  if (!name) return "U";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function UnassignedFreshersList({
  organizationId,
  pmId,
}: {
  organizationId: string | undefined;
  pmId: string | undefined;
}) {
  const { data: freshers, isLoading } = useUnassignedFreshers(organizationId);
  const claimFresher = useClaimFresher();

  if (!isLoading && (!freshers || freshers.length === 0)) {
    return null;
  }

  const handleClaim = async (fresherId: string, name: string | null) => {
    if (!pmId) return;
    try {
      await claimFresher.mutateAsync({ fresherId, pmId });
      toast.success(`${name ?? "Fresher"} added to your team`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to claim fresher");
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold">New Freshers Awaiting Assignment</h3>
      </div>

      {isLoading ? (
        <ListRowsSkeleton rows={2} />
      ) : (
        <ul className="space-y-2">
          {freshers!.map((fresher) => (
            <li
              key={fresher.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={fresher.avatar_url ?? undefined} />
                  <AvatarFallback>{initials(fresher.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{fresher.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(fresher.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={claimFresher.isPending}
                onClick={() => handleClaim(fresher.id, fresher.full_name)}
              >
                Claim
              </Button>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
