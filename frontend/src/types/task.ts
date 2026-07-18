export type TaskDifficulty = "beginner" | "intermediate" | "advanced";
export type TaskStatus = "not_started" | "in_progress" | "submitted" | "completed";

export interface TaskResource {
  label: string;
  url: string;
}

export interface Task {
  id: string;
  roadmap_week_id: string;
  title: string;
  description: string | null;
  requirements: string[];
  acceptance_criteria: string[];
  difficulty: TaskDifficulty | null;
  estimated_hours: number | null;
  resources: TaskResource[];
  deadline: string | null;
  status: TaskStatus;
  created_at: string;
}
