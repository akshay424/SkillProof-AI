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
  title: string;
  total_weeks: number;
  status: RoadmapStatus;
  started_at: string | null;
  target_completion_date: string | null;
  created_at: string;
}
