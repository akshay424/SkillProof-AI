import { useQuery } from "@tanstack/react-query";

import { MOCK_EMPLOYEE, MOCK_ROADMAP, MOCK_ROADMAP_WEEKS } from "@/mocks/fixtures";
import { createClient } from "@/services/supabase/client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { Roadmap, RoadmapWeek } from "@/types/roadmap";

export interface RoadmapWithWeeks extends Roadmap {
  roadmap_weeks: RoadmapWeek[];
}

export function useRoadmap(userId: string | undefined) {
  return useQuery({
    queryKey: ["roadmap", userId],
    enabled: DEMO_MODE || !!userId,
    queryFn: async (): Promise<RoadmapWithWeeks | null> => {
      if (DEMO_MODE) {
        return userId === MOCK_EMPLOYEE.id
          ? { ...MOCK_ROADMAP, roadmap_weeks: MOCK_ROADMAP_WEEKS }
          : null;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from("roadmaps")
        .select("*, roadmap_weeks(*)")
        .eq("user_id", userId!)
        .order("week_number", { referencedTable: "roadmap_weeks", ascending: true })
        .maybeSingle();
      if (error) throw error;
      return data as RoadmapWithWeeks | null;
    },
  });
}
