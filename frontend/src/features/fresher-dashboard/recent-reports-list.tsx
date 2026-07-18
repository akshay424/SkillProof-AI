"use client";

import { FileText } from "lucide-react";
import Link from "next/link";

import { GlassCard } from "@/components/shared/glass-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRowsSkeleton } from "@/components/shared/loading-skeletons";
import { Badge } from "@/components/ui/badge";
import { useEvaluationReports } from "@/services/queries/reports";
import { formatDate } from "@/utils/format-date";

export function RecentReportsList({ userId, limit = 3 }: { userId: string | undefined; limit?: number }) {
  const { data: reports, isLoading } = useEvaluationReports(userId);
  const visible = reports?.slice(0, limit) ?? [];

  return (
    <GlassCard className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Recent Reports</h3>
        <Link href="/fresher/reports" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      {isLoading ? (
        <ListRowsSkeleton rows={limit} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="Submit a task to receive your first AI evaluation report."
        />
      ) : (
        <ul className="space-y-2">
          {visible.map((report) => (
            <li
              key={report.id}
              className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">Evaluation Report</p>
                <p className="text-xs text-muted-foreground">{formatDate(report.generated_at)}</p>
              </div>
              {report.overall_score !== null && (
                <Badge variant={report.overall_score >= 70 ? "secondary" : "outline"}>
                  {report.overall_score}/100
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
