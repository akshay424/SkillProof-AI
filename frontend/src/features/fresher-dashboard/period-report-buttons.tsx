"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUser } from "@/hooks/use-user";
import { runWeeklyEvaluationAgent } from "@/services/ai/weekly-evaluation-agent";
import { runRoadmapCompletionAgent } from "@/services/ai/roadmap-completion-agent";
import { useCompleteRoadmap, useRoadmap } from "@/services/queries/roadmaps";
import { useCreateFinalReport, useCreateWeeklyReport, useDailyReportPayloads, useWeeklyReportPayloads } from "@/services/queries/reports";

export function PeriodReportButtons({ userId }: { userId: string | undefined }) {
  const { data: user } = useUser();
  const { data: dailyReports } = useDailyReportPayloads(userId);
  const { data: weeklyReports } = useWeeklyReportPayloads(userId);
  const { data: roadmap } = useRoadmap(userId);
  const createWeeklyReport = useCreateWeeklyReport();
  const createFinalReport = useCreateFinalReport();
  const completeRoadmap = useCompleteRoadmap();
  const [generating, setGenerating] = useState<"weekly" | "final" | null>(null);

  const hasEvaluatedTask = (dailyReports?.length ?? 0) > 0;
  const canGenerateWeekly = !!userId && !!roadmap && hasEvaluatedTask;
  const canGenerateFinal = !!userId && !!roadmap && hasEvaluatedTask && roadmap.status !== "COMPLETED";

  const handleGenerateWeekly = async () => {
    if (!userId || !roadmap || !dailyReports) return;
    setGenerating("weekly");
    try {
      const report = await runWeeklyEvaluationAgent({
        employeeId: userId,
        employeeName: user?.profile.full_name ?? "Fresher",
        roadmapId: roadmap.id,
        roadmapTitle: roadmap.title ?? "Roadmap",
        dailyReports,
      });
      await createWeeklyReport.mutateAsync({ userId, roadmapId: roadmap.id, report });
      toast.success("Weekly report generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate weekly report");
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateFinal = async () => {
    if (!userId || !roadmap || !dailyReports) return;
    setGenerating("final");
    try {
      const report = await runRoadmapCompletionAgent({
        employeeId: userId,
        employeeName: user?.profile.full_name ?? "Fresher",
        roadmap,
        dailyReports,
        weeklyReports: weeklyReports ?? [],
      });

      // agents/roadmap-completion.md's PM handoff sequence: mark the roadmap
      // complete first, then submit the final report.
      await completeRoadmap.mutateAsync({ userId, roadmapId: roadmap.id });
      await createFinalReport.mutateAsync({ userId, roadmapId: roadmap.id, report });

      toast.success("Final report generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate final report");
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              variant="outline"
              size="sm"
              disabled={!canGenerateWeekly || generating !== null}
              onClick={handleGenerateWeekly}
            >
              {generating === "weekly" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate Weekly Report
            </Button>
          </span>
        </TooltipTrigger>
        {!canGenerateWeekly && (
          <TooltipContent>Complete at least one task evaluation first.</TooltipContent>
        )}
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              variant="outline"
              size="sm"
              disabled={!canGenerateFinal || generating !== null}
              onClick={handleGenerateFinal}
            >
              {generating === "final" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate Final Report
            </Button>
          </span>
        </TooltipTrigger>
        {!canGenerateFinal && (
          <TooltipContent>
            {roadmap?.status === "COMPLETED"
              ? "This roadmap is already complete."
              : "Complete at least one task evaluation first."}
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
}
