import { useQuery } from "@tanstack/react-query";

import { demoStore } from "@/mocks/demo-store";
import { createClient } from "@/services/supabase/client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { Task } from "@/types/task";

export function demoTasksForUser(userId: string): Task[] {
  const roadmapIds = demoStore.roadmaps.filter((r) => r.user_id === userId).map((r) => r.id);
  const weekIds = demoStore.roadmapWeeks.filter((w) => roadmapIds.includes(w.roadmap_id)).map((w) => w.id);
  return demoStore.tasks.filter((t) => weekIds.includes(t.roadmap_week_id));
}

export function useTasksForUser(userId: string | undefined) {
  return useQuery({
    queryKey: ["tasks-for-user", userId],
    enabled: DEMO_MODE || !!userId,
    queryFn: async (): Promise<Task[]> => {
      if (DEMO_MODE) return userId ? demoTasksForUser(userId) : [];

      const supabase = createClient();
      const { data, error } = await supabase
        .from("tasks")
        .select("*, roadmap_weeks!inner(roadmap_id, roadmaps!inner(user_id))")
        .eq("roadmap_weeks.roadmaps.user_id", userId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as Task[];
    },
  });
}

export function useTodayTask(userId: string | undefined) {
  const { data: tasks, ...rest } = useTasksForUser(userId);
  const todayTask =
    tasks?.find((t) => t.status === "in_progress") ??
    tasks?.find((t) => t.status === "not_started") ??
    null;
  return { data: todayTask, allTasks: tasks, ...rest };
}

interface TaskWithOwner extends Task {
  roadmap_weeks: { roadmap_id: string; roadmaps: { user_id: string } };
}

export function useTasksForUsers(userIds: string[]) {
  return useQuery({
    queryKey: ["tasks-for-users", userIds],
    enabled: DEMO_MODE || userIds.length > 0,
    queryFn: async (): Promise<TaskWithOwner[]> => {
      if (DEMO_MODE) {
        return userIds.flatMap((userId) => {
          const roadmap = demoStore.roadmaps.find((r) => r.user_id === userId);
          if (!roadmap) return [];
          return demoTasksForUser(userId).map((t) => ({
            ...t,
            roadmap_weeks: { roadmap_id: roadmap.id, roadmaps: { user_id: userId } },
          }));
        });
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from("tasks")
        .select("*, roadmap_weeks!inner(roadmap_id, roadmaps!inner(user_id))")
        .in("roadmap_weeks.roadmaps.user_id", userIds);
      if (error) throw error;
      return data as unknown as TaskWithOwner[];
    },
  });
}
