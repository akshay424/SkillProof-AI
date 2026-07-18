import { useQuery } from "@tanstack/react-query";

import { MOCK_EMPLOYEE, MOCK_SKILL_SCORES } from "@/mocks/fixtures";
import { createClient } from "@/services/supabase/client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { SkillScore } from "@/types/report";

export function useSkillScores(userId: string | undefined) {
  return useQuery({
    queryKey: ["skill-scores", userId],
    enabled: DEMO_MODE || !!userId,
    queryFn: async (): Promise<SkillScore[]> => {
      if (DEMO_MODE) return userId === MOCK_EMPLOYEE.id ? MOCK_SKILL_SCORES : [];

      const supabase = createClient();
      const { data, error } = await supabase
        .from("skill_scores")
        .select("*")
        .eq("user_id", userId!)
        .order("recorded_at", { ascending: false });
      if (error) throw error;
      return data as SkillScore[];
    },
  });
}

export function useLatestSkillScores(userId: string | undefined) {
  const { data: scores, ...rest } = useSkillScores(userId);
  const latestBySkill = new Map<string, SkillScore>();
  for (const score of scores ?? []) {
    if (!latestBySkill.has(score.skill_name)) {
      latestBySkill.set(score.skill_name, score);
    }
  }
  return { data: Array.from(latestBySkill.values()), ...rest };
}

export function useSkillScoresForUsers(userIds: string[]) {
  return useQuery({
    queryKey: ["skill-scores-batch", userIds],
    enabled: DEMO_MODE || userIds.length > 0,
    queryFn: async (): Promise<SkillScore[]> => {
      if (DEMO_MODE) return userIds.includes(MOCK_EMPLOYEE.id) ? MOCK_SKILL_SCORES : [];

      const supabase = createClient();
      const { data, error } = await supabase
        .from("skill_scores")
        .select("*")
        .in("user_id", userIds)
        .order("recorded_at", { ascending: false });
      if (error) throw error;
      return data as SkillScore[];
    },
  });
}
