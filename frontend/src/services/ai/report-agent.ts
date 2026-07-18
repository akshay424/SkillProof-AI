import { completeJSON } from "@/services/ai/openai-client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { CodeEvaluationResult } from "@/services/ai/evaluation-agent";
import type { EvaluationReport, VivaQuestion } from "@/types/report";

export interface TaskReportSynthesis {
  communicationVerdict: string;
  finalSuggestions: string[];
  overallScore: number;
  confidence: number;
}

const TASK_SYNTHESIS_PROMPT = `You are a senior technical interviewer combining a code review with a
candidate's viva answers into one final task evaluation. Weigh both the code quality and how well they
articulated their reasoning in the Q&A. Respond with strict JSON:
{ "communicationVerdict": string, "finalSuggestions": string[], "overallScore": number (0-100), "confidence": number (0-1) }`;

const PERIOD_SYNTHESIS_PROMPT = `You are a senior engineering manager writing a concise progress summary
for a fresher developer, based on a set of their task evaluation reports. Write 2-3 sentences covering
strengths, weaknesses, and trend. Respond with strict JSON: { "summary": string, "overallScore": number (0-100) }`;

export async function synthesizeTaskReport(
  evaluation: CodeEvaluationResult,
  qa: VivaQuestion[],
): Promise<TaskReportSynthesis> {
  if (DEMO_MODE) {
    return {
      communicationVerdict:
        "Answered clearly and could justify the Dio choice, but struggled to articulate how a repository layer would change error handling.",
      finalSuggestions: [...evaluation.suggestions, "Practice explaining architectural tradeoffs out loud"],
      overallScore: evaluation.overallScore,
      confidence: evaluation.confidence,
    };
  }

  const user = JSON.stringify({ evaluation, qa });
  return completeJSON<TaskReportSynthesis>(TASK_SYNTHESIS_PROMPT, user);
}

export async function synthesizePeriodReport(
  reports: EvaluationReport[],
): Promise<{ summary: string; overallScore: number }> {
  if (DEMO_MODE) {
    const scores = reports.map((r) => r.overall_score).filter((s): s is number => s !== null);
    const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return {
      summary:
        "Steady progress this period — code quality and REST API handling are strengthening, while architecture and testing remain the main growth areas.",
      overallScore: average,
    };
  }

  const user = JSON.stringify(reports);
  return completeJSON<{ summary: string; overallScore: number }>(PERIOD_SYNTHESIS_PROMPT, user);
}
