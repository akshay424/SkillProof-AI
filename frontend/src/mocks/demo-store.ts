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
 * Everything but `users` starts empty on purpose: the demo fresher (Aarav)
 * already has a resume + interview notes filled in (see fixtures.ts) so the
 * onboarding card can jump straight to "Generate Roadmap" — the rest of the
 * dashboard (roadmap, tasks, reports, skill scores) populates live as you
 * click through Generate Roadmap -> Evaluate -> Weekly/Final report, which
 * tells the full story instead of starting pre-filled.
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

export function demoId(prefix: string): string {
  const randomUuid = globalThis.crypto?.randomUUID;
  if (typeof randomUuid === "function") {
    return `${prefix}-${randomUuid.call(globalThis.crypto)}`;
  }

  // Demo IDs are not security identifiers. HTTP browser contexts may not expose
  // crypto.randomUUID(), so use a collision-resistant session fallback.
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
