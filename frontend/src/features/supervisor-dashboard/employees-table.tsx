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
import { useDirectReports } from "@/services/queries/users";
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

export function EmployeesTable({ supervisorId }: { supervisorId: string | undefined }) {
  const { data: employees, isLoading } = useDirectReports(supervisorId);
  const { data: scores } = useSkillScoresForUsers(employees?.map((e) => e.id) ?? []);

  return (
    <GlassCard className="p-6">
      <h3 className="mb-4 font-semibold">Employees</h3>
      {isLoading ? (
        <TableSkeleton />
      ) : !employees || employees.length === 0 ? (
        <EmptyState icon={UsersRound} title="No employees assigned yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Readiness</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => {
              const average = scores ? averageForUser(employee.id, scores) : null;
              return (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Link
                      href={`/supervisor/employees/${employee.id}`}
                      className="flex items-center gap-3 hover:underline"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={employee.avatar_url ?? undefined} />
                        <AvatarFallback>{initials(employee.full_name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{employee.full_name}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.job_title ?? "—"}
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
