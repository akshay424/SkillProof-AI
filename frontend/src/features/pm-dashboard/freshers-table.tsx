"use client";

import { UsersRound } from "lucide-react";
import Link from "next/link";

import { GlassCard } from "@/components/shared/glass-card";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeletons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePmFreshers } from "@/services/queries/users";
import { useSkillScoresForUsers } from "@/services/queries/skill-scores";

function initials(name: string | null) {
  if (!name) return "U";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function averageForUser(userId: string, scores: { user_id: string; skill_name: string; score: number }[]) {
  const latestBySkill = new Map<string, number>();
  for (const s of scores.filter((s) => s.user_id === userId)) {
    if (!latestBySkill.has(s.skill_name)) latestBySkill.set(s.skill_name, s.score);
  }
  const values = Array.from(latestBySkill.values());
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
}

export function FreshersTable({ pmId }: { pmId: string | undefined }) {
  const { data: freshers, isLoading } = usePmFreshers(pmId);
  const { data: scores } = useSkillScoresForUsers(freshers?.map((f) => f.id) ?? []);

  return (
    <GlassCard className="p-6">
      <h3 className="mb-4 font-semibold">Freshers</h3>
      {isLoading ? (
        <TableSkeleton />
      ) : !freshers || freshers.length === 0 ? (
        <EmptyState icon={UsersRound} title="No freshers assigned yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fresher</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Readiness</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {freshers.map((fresher) => {
              const average = scores ? averageForUser(fresher.id, scores) : null;
              return (
                <TableRow key={fresher.id}>
                  <TableCell>
                    <Link
                      href={`/pm/freshers/${fresher.id}`}
                      className="flex items-center gap-3 hover:underline"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={fresher.avatar_url ?? undefined} />
                        <AvatarFallback>{initials(fresher.full_name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{fresher.full_name}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {fresher.job_title ?? "—"}
                  </TableCell>
                  <TableCell>
                    {average !== null ? (
                      <Badge variant={average >= 70 ? "secondary" : "outline"}>{average}%</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </GlassCard>
  );
}
