export type RoadmapStatus = "not_started" | "in_progress" | "completed";
export type WeekStatus = "locked" | "active" | "completed";

export interface RoadmapWeek {
  id: string;
  roadmap_id: string;
  week_number: number;
  theme: string;
  summary: string | null;
  unlock_date: string | null;
  status: WeekStatus;
}

export interface Roadmap {
  id: string;
  user_id: string;
  learning_path_id: string | null;
  title: string;
  total_weeks: number;
  status: RoadmapStatus;
  started_at: string | null;
  target_completion_date: string | null;
  created_at: string;
}

export interface LearningPath {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
