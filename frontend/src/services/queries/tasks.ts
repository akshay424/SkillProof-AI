import { useQuery } from "@tanstack/react-query";

import { demoStore } from "@/mocks/demo-store";
import { apiFetch } from "@/services/api-client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { GeneratedRoadmap } from "@/services/ai/roadmap-agent";
import type { Task } from "@/types/task";

interface BackendRoadmapWithPayload {
  id: string;
  roadmap_payload: {
    generated_roadmap?: GeneratedRoadmap;
    current_task?: { task_id: string; task_title?: string };
  } | null;
}

function tasksFromBackendRoadmap(roadmap: BackendRoadmapWithPayload): Task[] {
  const weeks = roadmap.roadmap_payload?.generated_roadmap?.weeks ?? [];
  const now = new Date().toISOString();
  const currentTask = roadmap.roadmap_payload?.current_task;
  const detectedActiveIndex = weeks.findIndex((week) =>
    currentTask?.task_id === `${roadmap.id}-task-${week.weekNumber}`
    || (!!currentTask?.task_title && currentTask.task_title === week.task.title)
  );
  // Older roadmap payloads may have a backend task ID that is not derived from
  // the generated week. Keep the persisted task ID while showing the first task.
  const activeIndex = detectedActiveIndex >= 0 ? detectedActiveIndex : 0;
  return weeks.map((week, index) => ({
    id: index === activeIndex
      ? currentTask?.task_id ?? `${roadmap.id}-task-${week.weekNumber}`
      : `${roadmap.id}-task-${week.weekNumber}`,
    roadmap_week_id: `${roadmap.id}-week-${week.weekNumber}`,
    title: week.task.title,
    description: week.task.description,
    requirements: week.task.requirements,
    acceptance_criteria: week.task.acceptanceCriteria,
    difficulty: week.task.difficulty,
    estimated_hours: week.task.estimatedHours,
    resources: week.task.resources,
    deadline: null,
    status: index === activeIndex ? "in_progress" : "not_started",
    created_at: now,
  }));
}

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

      try {
        const roadmap = await apiFetch<BackendRoadmapWithPayload>("/api/freshers/me/roadmaps/current");
        return tasksFromBackendRoadmap(roadmap);
      } catch (error) {
        if (error instanceof Error && "status" in error && error.status === 404) return [];
        throw error;
      }
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

      const roadmaps = await Promise.all(userIds.map(async (userId) => {
        try {
          return await apiFetch<BackendRoadmapWithPayload>(`/api/pm/freshers/${userId}/roadmaps/current`);
        } catch (error) {
          if (error instanceof Error && "status" in error && error.status === 404) return null;
          throw error;
        }
      }));
      return roadmaps.flatMap((roadmap, index) => {
        if (!roadmap) return [];
        return tasksFromBackendRoadmap(roadmap).map((task) => ({
          ...task,
          roadmap_weeks: { roadmap_id: roadmap.id, roadmaps: { user_id: userIds[index] } },
        }));
      });
    },
  });
}
