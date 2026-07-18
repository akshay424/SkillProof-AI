import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { demoId, demoStore } from "@/mocks/demo-store";
import { apiFetch, ApiError } from "@/services/api-client";
import { DEMO_MODE } from "@/utils/demo-mode";
import { generateUUID } from "@/utils/uuid";
import type { BackendRoadmapOut, RoadmapPayload, RoadmapRecord } from "@/types/roadmap";

function readDemoRoadmap(userId: string | undefined): RoadmapRecord | null {
  return demoStore.roadmaps.find((r) => r.user_id === userId) ?? null;
}

function mapBackendRoadmap(r: BackendRoadmapOut): RoadmapRecord {
  const { fresher_id, ...rest } = r;
  return { ...rest, user_id: fresher_id, roadmap_payload: r.roadmap_payload ?? ({} as RoadmapPayload) };
}

export function useRoadmap(userId: string | undefined) {
  return useQuery({
    queryKey: ["roadmap", userId],
    enabled: DEMO_MODE || !!userId,
    queryFn: async (): Promise<RoadmapRecord | null> => {
      if (DEMO_MODE) return readDemoRoadmap(userId);

      try {
        const roadmap = await apiFetch<BackendRoadmapOut>("/api/freshers/me/roadmaps/current");
        return mapBackendRoadmap(roadmap);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
  });
}

/**
 * Persists a freshly generated roadmap (diagnostic Mode A from onboarding, or
 * adaptive Mode B after a task evaluation — see roadmap-creator-agent.ts).
 * The backend has no endpoint to edit an existing roadmap's payload in place:
 * posting again with a new client_roadmap_id creates the next `version` and
 * auto-archives the previous one, which is exactly how task advancement works.
 * Writes the fresh result straight into the query cache with setQueryData
 * (rather than just invalidating) since components hold their own `useRoadmap`
 * subscription and this is the reliable way to force them to re-render.
 */
export function useCreateRoadmapFromAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      userId: string;
      title: string;
      targetRole: string;
      payload: RoadmapPayload;
    }): Promise<RoadmapRecord> => {
      if (DEMO_MODE) {
        const now = new Date().toISOString();
        const previousVersion = demoStore.roadmaps.find((r) => r.user_id === input.userId)?.version ?? 0;
        const roadmap: RoadmapRecord = {
          id: demoId("roadmap"),
          client_roadmap_id: demoId("client-roadmap"),
          user_id: input.userId,
          version: previousVersion + 1,
          title: input.title,
          target_role: input.targetRole,
          status: "ACTIVE",
          completion_pct: 0,
          roadmap_payload: input.payload,
          generated_at: now,
          created_at: now,
          updated_at: now,
        };
        demoStore.roadmaps = demoStore.roadmaps.filter((r) => r.user_id !== input.userId);
        demoStore.roadmaps.push(roadmap);
        return roadmap;
      }

      const created = await apiFetch<BackendRoadmapOut>("/api/freshers/me/roadmaps", {
        method: "POST",
        body: JSON.stringify({
          client_roadmap_id: generateUUID(),
          title: input.title,
          target_role: input.targetRole,
          roadmap_payload: input.payload,
        }),
      });
      return mapBackendRoadmap(created);
    },
    onSuccess: (roadmap) => {
      queryClient.setQueryData(["roadmap", roadmap.user_id], roadmap);
    },
  });
}

/**
 * Marks the roadmap complete — step 3 of the Roadmap Completion Evaluation
 * Agent's "PM handoff sequence" (agents/roadmap-completion.md): call this
 * before submitting the final report via useCreateFinalReport.
 */
export function useCompleteRoadmap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { userId: string; roadmapId: string }): Promise<RoadmapRecord> => {
      if (DEMO_MODE) {
        const roadmap = demoStore.roadmaps.find((r) => r.id === input.roadmapId);
        if (!roadmap) throw new Error("Roadmap not found");
        roadmap.status = "COMPLETED";
        roadmap.completion_pct = 100;
        return roadmap;
      }

      const completed = await apiFetch<BackendRoadmapOut>(`/api/freshers/me/roadmaps/${input.roadmapId}/complete`, {
        method: "POST",
      });
      return mapBackendRoadmap(completed);
    },
    onSuccess: (roadmap) => {
      queryClient.setQueryData(["roadmap", roadmap.user_id], roadmap);
    },
  });
}
