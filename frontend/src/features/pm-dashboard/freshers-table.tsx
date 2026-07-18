"use client";

import { AlertTriangle, UsersRound } from "lucide-react";
import Link from "next/link";

import { GlassCard } from "@/components/shared/glass-card";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeletons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePmDashboard } from "@/services/queries/pm";

function initials(name: string | null) {
  if (!name) return "U";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function FreshersTable({ pmId }: { pmId: string | undefined }) {
  const { data: dashboard, isLoading } = usePmDashboard(pmId);
  const freshers = dashboard?.freshers ?? [];

  return (
    <GlassCard className="p-6">
      <h3 className="mb-4 font-semibold">Freshers</h3>
      {isLoading ? (
        <TableSkeleton />
      ) : freshers.length === 0 ? (
        <EmptyState icon={UsersRound} title="No freshers assigned yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fresher</TableHead>
              <TableHead>Current task</TableHead>
              <TableHead>Roadmap progress</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {freshers.map((entry) => (
              <TableRow key={entry.fresher.id}>
                <TableCell>
                  <Link
                    href={`/pm/freshers/${entry.fresher.id}`}
                    className="flex items-center gap-3 hover:underline"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{initials(entry.fresher.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{entry.fresher.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {entry.current_assigned_task?.task_title ?? "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={entry.roadmap_progress} className="h-2 w-24" />
                    <span className="text-xs text-muted-foreground">{Math.round(entry.roadmap_progress)}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  {entry.needs_human_interaction ? (
                    <Badge variant="outline" className="gap-1 text-warning">
                      <AlertTriangle className="h-3 w-3" /> Needs review
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{entry.current_roadmap?.status ?? "No roadmap"}</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </GlassCard>
  );
}
