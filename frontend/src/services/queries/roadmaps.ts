import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { demoId, demoStore } from "@/mocks/demo-store";
import { createClient } from "@/services/supabase/client";
import { demoTasksForUser } from "@/services/queries/tasks";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { GeneratedRoadmap } from "@/services/ai/roadmap-agent";
import type { Roadmap, RoadmapWeek } from "@/types/roadmap";
import type { Task } from "@/types/task";

export interface RoadmapWithWeeks extends Roadmap {
  roadmap_weeks: RoadmapWeek[];
}

function readDemoRoadmap(userId: string | undefined): RoadmapWithWeeks | null {
  const roadmap = demoStore.roadmaps.find((r) => r.user_id === userId);
  if (!roadmap) return null;
  const weeks = demoStore.roadmapWeeks
    .filter((w) => w.roadmap_id === roadmap.id)
    .sort((a, b) => a.week_number - b.week_number)
    .map((w) => ({ ...w }));
  return { ...roadmap, roadmap_weeks: weeks };
}

export function useRoadmap(userId: string | undefined) {
  return useQuery({
    queryKey: ["roadmap", userId],
    enabled: DEMO_MODE || !!userId,
    queryFn: async (): Promise<RoadmapWithWeeks | null> => {
      if (DEMO_MODE) return readDemoRoadmap(userId);

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

/**
 * Turns AI-generated roadmap JSON into roadmap/week/task rows. Demo-mode only
 * for now (writes to the in-memory demoStore) — real Supabase persistence is
 * a later phase, so there's no backend branch here yet.
 *
 * Writes the fresh result straight into the query cache with setQueryData
 * (rather than just invalidating) since the components reading it hold their
 * own `useRoadmap`/`useTasksForUser` subscriptions and this is the reliable
 * way to force them to re-render with the mutated demoStore state.
 */
export function useCreateRoadmapFromAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { userId: string; generated: GeneratedRoadmap }) => {
      const roadmapId = demoId("roadmap");
      const now = new Date().toISOString();

      const roadmap: Roadmap = {
        id: roadmapId,
        user_id: input.userId,
        title: input.generated.title,
        total_weeks: input.generated.weeks.length,
        status: "in_progress",
        started_at: now,
        target_completion_date: null,
        created_at: now,
      };

      const weeks: RoadmapWeek[] = input.generated.weeks.map((w, i) => ({
        id: demoId("week"),
        roadmap_id: roadmapId,
        week_number: w.weekNumber,
        theme: w.theme,
        summary: w.summary,
        unlock_date: null,
        status: i === 0 ? "active" : "locked",
      }));

      const tasks: Task[] = input.generated.weeks.map((w, i) => ({
        id: demoId("task"),
        roadmap_week_id: weeks[i].id,
        title: w.task.title,
        description: w.task.description,
        requirements: w.task.requirements,
        acceptance_criteria: w.task.acceptanceCriteria,
        difficulty: w.task.difficulty,
        estimated_hours: w.task.estimatedHours,
        resources: w.task.resources,
        deadline: null,
        status: i === 0 ? "in_progress" : "not_started",
        created_at: now,
      }));

      demoStore.roadmaps.push(roadmap);
      demoStore.roadmapWeeks.push(...weeks);
      demoStore.tasks.push(...tasks);

      return input.userId;
    },
    onSuccess: (userId) => {
      queryClient.setQueryData(["roadmap", userId], readDemoRoadmap(userId));
      queryClient.setQueryData(["tasks-for-user", userId], demoTasksForUser(userId));
    },
  });
}

/** Demo-mode only for now — see useCreateRoadmapFromAgent. */
export function useCompleteTaskAndAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { userId: string; taskId: string }) => {
      const task = demoStore.tasks.find((t) => t.id === input.taskId);
      if (!task) return;
      task.status = "completed";

      const week = demoStore.roadmapWeeks.find((w) => w.id === task.roadmap_week_id);
      if (!week) return;
      week.status = "completed";

      const roadmap = demoStore.roadmaps.find((r) => r.id === week.roadmap_id);
      const nextWeek = demoStore.roadmapWeeks
        .filter((w) => w.roadmap_id === week.roadmap_id)
        .sort((a, b) => a.week_number - b.week_number)
        .find((w) => w.week_number === week.week_number + 1);

      if (nextWeek) {
        nextWeek.status = "active";
        const nextTask = demoStore.tasks.find((t) => t.roadmap_week_id === nextWeek.id);
        if (nextTask) nextTask.status = "in_progress";
      } else if (roadmap) {
        roadmap.status = "completed";
      }

      return input.userId;
    },
    onSuccess: (userId) => {
      if (!userId) return;
      queryClient.setQueryData(["roadmap", userId], readDemoRoadmap(userId));
      queryClient.setQueryData(["tasks-for-user", userId], demoTasksForUser(userId));
    },
  });
}
