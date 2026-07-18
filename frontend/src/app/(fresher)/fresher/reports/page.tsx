"use client";

import { FileText } from "lucide-react";

import { GlassCard } from "@/components/shared/glass-card";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeletons";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PeriodReportButtons } from "@/features/fresher-dashboard/period-report-buttons";
import { useUser } from "@/hooks/use-user";
import { useEvaluationReports } from "@/services/queries/reports";
import { formatDate } from "@/utils/format-date";
import type { ReportType } from "@/types/report";

const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  task: "Task",
  weekly: "Weekly",
  final: "Final",
};

export default function FresherReportsPage() {
  const { data: user } = useUser();
  const { data: reports, isLoading } = useEvaluationReports(user?.authId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Reports</h2>
          <p className="text-sm text-muted-foreground">
            Evidence-based AI evaluation reports generated from your submitted projects.
          </p>
        </div>
        <PeriodReportButtons userId={user?.authId} />
      </div>

      <GlassCard className="p-6">
        {isLoading ? (
          <TableSkeleton />
        ) : !reports || reports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No reports yet"
            description="Evaluate a task to receive your first AI evaluation report."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Generated</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Overall Score</TableHead>
                <TableHead>Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{formatDate(report.generated_at)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {REPORT_TYPE_LABEL[report.report_type]}
                  </TableCell>
                  <TableCell>
                    {report.overall_score !== null ? (
                      <Badge variant={report.overall_score >= 70 ? "secondary" : "outline"}>
                        {report.overall_score}/100
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {report.confidence !== null ? `${Math.round(report.confidence * 100)}%` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </GlassCard>
    </div>
  );
}
