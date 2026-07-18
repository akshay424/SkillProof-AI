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
import { synthesizePeriodReport } from "@/services/ai/report-agent";
import { useRoadmap } from "@/services/queries/roadmaps";
import { useEvaluationReports, useSubmitPeriodReport } from "@/services/queries/reports";

export function PeriodReportButtons({ userId }: { userId: string | undefined }) {
  const { data: reports } = useEvaluationReports(userId);
  const { data: roadmap } = useRoadmap(userId);
  const createReport = useSubmitPeriodReport();
  const [generating, setGenerating] = useState<"weekly" | "final" | null>(null);

  const taskReports = reports?.filter((r) => r.report_type === "task") ?? [];
  const canGenerateWeekly = !!userId && taskReports.length > 0;
  const canGenerateFinal = !!userId && roadmap?.status === "completed";

  const handleGenerate = async (type: "weekly" | "final") => {
    if (!userId) return;
    setGenerating(type);
    try {
      const source = type === "weekly" ? taskReports : (reports ?? []);
      const synthesis = await synthesizePeriodReport(source);

      if (!roadmap) throw new Error("No active roadmap found");
      await createReport.mutateAsync({
        userId,
        roadmapId: roadmap.id,
        type,
        summary: synthesis.summary,
        overallScore: synthesis.overallScore,
        sourceReports: source,
      });

      toast.success(type === "weekly" ? "Weekly report generated" : "Final report generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate report");
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
              onClick={() => handleGenerate("weekly")}
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
              onClick={() => handleGenerate("final")}
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
          <TooltipContent>Available once your entire roadmap is completed.</TooltipContent>
        )}
      </Tooltip>
    </div>
  );
}
