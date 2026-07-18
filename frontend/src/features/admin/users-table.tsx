"use client";

import { UsersRound } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeletons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlassCard } from "@/components/shared/glass-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrgMembers, useUpdateUserProfile } from "@/services/queries/users";
import { ROLE_LABELS } from "@/utils/constants";
import type { UserRole } from "@/types/user";

function initials(name: string | null) {
  if (!name) return "U";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function UsersTable({ organizationId }: { organizationId: string | undefined }) {
  const { data: members, isLoading } = useOrgMembers(organizationId);
  const updateProfile = useUpdateUserProfile();

  const supervisors = members?.filter((m) => m.role === "supervisor" || m.role === "admin") ?? [];

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      await updateProfile.mutateAsync({ id: userId, updates: { role } });
      toast.success("Role updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    }
  };

  const handleSupervisorChange = async (userId: string, supervisorId: string) => {
    try {
      await updateProfile.mutateAsync({
        id: userId,
        updates: { supervisor_id: supervisorId === "none" ? null : supervisorId },
      });
      toast.success("Supervisor updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update supervisor");
    }
  };

  return (
    <GlassCard className="p-6">
      <h3 className="mb-4 font-semibold">Organization Members</h3>
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : !members || members.length === 0 ? (
        <EmptyState icon={UsersRound} title="No members yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Supervisor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar_url ?? undefined} />
                      <AvatarFallback>{initials(member.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.full_name}</p>
                      <p className="text-xs text-muted-foreground">{member.job_title ?? "—"}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={member.role}
                    onValueChange={(value) => handleRoleChange(member.id, value as UserRole)}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={member.supervisor_id ?? "none"}
                    onValueChange={(value) => handleSupervisorChange(member.id, value)}
                    disabled={member.role !== "employee"}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {supervisors
                        .filter((s) => s.id !== member.id)
                        .map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.full_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </GlassCard>
  );
}
