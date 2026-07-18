import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { demoId, demoStore } from "@/mocks/demo-store";
import { createClient } from "@/services/supabase/client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { SkillScore } from "@/types/report";

export function useSkillScores(userId: string | undefined) {
  return useQuery({
    queryKey: ["skill-scores", userId],
    enabled: DEMO_MODE || !!userId,
    queryFn: async (): Promise<SkillScore[]> => {
      if (DEMO_MODE) {
        return demoStore.skillScores
          .filter((s) => s.user_id === userId)
          .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
      }

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
      if (DEMO_MODE) return demoStore.skillScores.filter((s) => userIds.includes(s.user_id));

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

/** Demo-mode only for now (writes to the in-memory demoStore) — real Supabase persistence is a later phase. */
export function useRecordSkillScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { userId: string; scores: { skillName: string; score: number }[]; source: SkillScore["source"] }) => {
      const rows: SkillScore[] = input.scores.map((s) => ({
        id: demoId("skill"),
        user_id: input.userId,
        skill_name: s.skillName,
        score: s.score,
        source: input.source,
        recorded_at: new Date().toISOString(),
      }));
      demoStore.skillScores.push(...rows);
      return input.userId;
    },
    onSuccess: (userId) => {
      queryClient.setQueryData(
        ["skill-scores", userId],
        demoStore.skillScores
          .filter((s) => s.user_id === userId)
          .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at)),
      );
      queryClient.invalidateQueries({ queryKey: ["skill-scores-batch"], refetchType: "all" });
    },
  });
}
