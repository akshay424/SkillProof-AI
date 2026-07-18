import { MOCK_ORG_MEMBERS } from "@/mocks/fixtures";
import type { EvaluationReport, SkillScore } from "@/types/report";
import type { Roadmap, RoadmapWeek } from "@/types/roadmap";
import type { Task } from "@/types/task";
import type { UserProfile } from "@/types/user";

/**
 * Mutable in-memory store backing demo mode. New-flow actions (claim fresher,
 * generate roadmap, evaluate, weekly/final reports) mutate this so the demo
 * feels real for the session, without any backend. Resets on page reload —
 * there is no persistence layer in this pass by design.
 *
 * Everything starts empty on purpose: the demo fresher (Aarav) has no resume
 * or interview notes filled in (see fixtures.ts), so the onboarding card's
 * "Generate My Roadmap with AI" button stays disabled until you actually
 * upload a resume and type notes — the rest of the dashboard (roadmap,
 * tasks, reports, skill scores) populates live as you click through Generate
 * Roadmap -> Evaluate -> Weekly/Final report, which tells the full story
 * instead of starting pre-filled.
 */
export const demoStore: {
  users: UserProfile[];
  roadmaps: Roadmap[];
  roadmapWeeks: RoadmapWeek[];
  tasks: Task[];
  evaluationReports: EvaluationReport[];
  skillScores: SkillScore[];
} = {
  users: MOCK_ORG_MEMBERS.map((m) => ({ ...m })),
  roadmaps: [],
  roadmapWeeks: [],
  tasks: [],
  evaluationReports: [],
  skillScores: [],
};

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // crypto.randomUUID requires a secure context (HTTPS or localhost); fall back
  // to a Math.random-based id when accessed over plain HTTP (e.g. LAN preview).
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function demoId(prefix: string): string {
  return `${prefix}-${generateUUID()}`;
}
