import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { demoId, demoStore } from "@/mocks/demo-store";
import { ApiError, apiFetch } from "@/services/api-client";
import { demoTasksForUser } from "@/services/queries/tasks";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { GeneratedRoadmap } from "@/services/ai/roadmap-agent";
import type { Roadmap, RoadmapStatus, RoadmapWeek } from "@/types/roadmap";
import type { Task } from "@/types/task";

export interface RoadmapWithWeeks extends Roadmap {
  roadmap_weeks: RoadmapWeek[];
}

interface BackendRoadmap {
  id: string;
  fresher_id: string;
  title: string | null;
  status: string;
  start_date: string | null;
  target_completion_date: string | null;
  created_at: string;
  roadmap_payload: {
    generated_roadmap?: GeneratedRoadmap;
    current_task?: BackendCurrentTask;
  } | null;
}

interface BackendCurrentTask {
  task_id: string;
  task_title: string;
  employee_facing_instruction: string;
  sample_input: Record<string, unknown>;
  required_resources: string[];
  acceptance_criteria: string[];
  evaluation_criteria: string[];
}

function normalizeRoadmapStatus(status: string): RoadmapStatus {
  const normalized = status.toLowerCase();
  if (normalized === "completed") return "completed";
  if (normalized === "not_started") return "not_started";
  return "in_progress";
}

function backendRoadmapToUi(roadmap: BackendRoadmap): RoadmapWithWeeks {
  const payload = roadmap.roadmap_payload as {
    generated_roadmap?: GeneratedRoadmap;
  } | null;
  const generated = payload?.generated_roadmap;
  const weeks = generated?.weeks ?? [];

  return {
    id: roadmap.id,
    user_id: roadmap.fresher_id,
    title: roadmap.title ?? generated?.title ?? "AI Product Developer Roadmap",
    total_weeks: weeks.length,
    status: normalizeRoadmapStatus(roadmap.status),
    started_at: roadmap.start_date,
    target_completion_date: roadmap.target_completion_date,
    created_at: roadmap.created_at,
    roadmap_weeks: weeks.map((week, index) => ({
      id: `${roadmap.id}-week-${week.weekNumber}`,
      roadmap_id: roadmap.id,
      week_number: week.weekNumber,
      theme: week.theme,
      summary: week.summary,
      unlock_date: null,
      status: index === 0 ? "active" : "locked",
    })),
  };
}

function clientRoadmapId() {
  return `web-roadmap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function firstCurrentTask(generated: GeneratedRoadmap, clientRoadmapId: string): BackendCurrentTask {
  const firstWeek = generated.weeks[0];
  if (!firstWeek) throw new Error("AI roadmap must include at least one task");

  return {
    task_id: `${clientRoadmapId}-task-1`,
    task_title: firstWeek.task.title,
    employee_facing_instruction: firstWeek.task.description,
    sample_input: {},
    required_resources: firstWeek.task.resources.map((resource) => resource.url).filter(Boolean),
    acceptance_criteria: firstWeek.task.acceptanceCriteria,
    evaluation_criteria: [
      "Completion of acceptance criteria",
      "Code correctness and maintainability",
      "Testing and debugging evidence",
      "Responsible AI usage disclosure",
    ],
  };
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
      try {
        const roadmap = await apiFetch<BackendRoadmap>("/api/freshers/me/roadmaps/current");
        return backendRoadmapToUi(roadmap);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
  });
}

/**
 * Turns AI-generated roadmap JSON into the documented backend roadmap payload.
 * Demo mode keeps its in-memory behavior so the static demo remains usable.
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
      if (!DEMO_MODE) {
        const clientId = clientRoadmapId();
        const currentTask = firstCurrentTask(input.generated, clientId);
        const startDate = new Date();
        const targetDate = new Date(startDate);
        targetDate.setDate(targetDate.getDate() + (input.generated.weeks.length * 7));
        const roadmap = await apiFetch<BackendRoadmap>("/api/freshers/me/roadmaps", {
          method: "POST",
          body: JSON.stringify({
            client_roadmap_id: clientId,
            title: input.generated.title,
            target_role: "AI Product Developer",
            start_date: startDate.toISOString().slice(0, 10),
            target_completion_date: targetDate.toISOString().slice(0, 10),
            roadmap_payload: {
              schema_version: "1.0",
              generation_mode: "diagnostic",
              pace_status: "no_evidence",
              generated_roadmap: input.generated,
              weeks: input.generated.weeks,
              competencies: [
                "software_development_fundamentals",
                "api_integration",
                "testing_debugging",
                "responsible_ai_usage",
              ],
              milestones: input.generated.weeks.map((week) => ({
                week_number: week.weekNumber,
                title: week.task.title,
              })),
              completion_criteria: "Complete all roadmap tasks with accepted final evaluations.",
              current_task: currentTask,
            },
          }),
        });
        return { userId: input.userId, roadmap: backendRoadmapToUi(roadmap) };
      }

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

      return { userId: input.userId, roadmap: readDemoRoadmap(input.userId) };
    },
    onSuccess: ({ userId, roadmap }) => {
      queryClient.setQueryData(["roadmap", userId], roadmap);
      if (DEMO_MODE) {
        queryClient.setQueryData(["tasks-for-user", userId], demoTasksForUser(userId));
      }
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
