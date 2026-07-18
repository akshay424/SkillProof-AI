import { MOCK_ORG_MEMBERS } from "@/mocks/fixtures";
import type { FinalEvaluationOutput, RoadmapCompletionOutput, WeeklyEvaluationOutput } from "@/types/evaluation";
import type { EvaluationReport, SkillScore } from "@/types/report";
import type { RoadmapRecord } from "@/types/roadmap";
import type { UserProfile } from "@/types/user";
import { generateUUID } from "@/utils/uuid";

/**
 * Mutable in-memory store backing demo mode. New-flow actions (generate
 * roadmap, evaluate, weekly/final reports) mutate this so the demo feels
 * real for the session, without any backend. Resets on page reload — there
 * is no persistence layer in this pass by design.
 *
 * Everything starts empty on purpose: the demo fresher (Aarav) has no resume
 * or interview notes filled in (see fixtures.ts), so the onboarding card's
 * "Generate My Roadmap with AI" button stays disabled until you actually
 * upload a resume and type notes — the rest of the dashboard (roadmap,
 * reports, skill scores) populates live as you click through Generate
 * Roadmap -> Evaluate -> Weekly/Final report, which tells the full story
 * instead of starting pre-filled.
 */
export const demoStore: {
  users: UserProfile[];
  roadmaps: RoadmapRecord[];
  evaluationReports: EvaluationReport[];
  skillScores: SkillScore[];
  /** Raw Final Evaluation Agent outputs, keyed by user — the flat
   * `evaluationReports` above only holds the summarized EvaluationReport shape;
   * the Weekly/Roadmap Completion agents need the full contract. */
  dailyReportPayloads: { userId: string; payload: FinalEvaluationOutput }[];
  weeklyReportPayloads: { userId: string; payload: WeeklyEvaluationOutput }[];
  roadmapCompletionPayloads: { userId: string; payload: RoadmapCompletionOutput }[];
} = {
  users: MOCK_ORG_MEMBERS.map((m) => ({ ...m })),
  roadmaps: [],
  evaluationReports: [],
  skillScores: [],
  dailyReportPayloads: [],
  weeklyReportPayloads: [],
  roadmapCompletionPayloads: [],
};

export function demoId(prefix: string): string {
  return `${prefix}-${generateUUID()}`;
}
