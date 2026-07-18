export type ReportType = "task" | "weekly" | "final";

export interface EvaluationReport {
  id: string;
  submission_id: string | null;
  user_id: string;
  report_type: ReportType;
  architecture: Record<string, unknown> | null;
  folder_structure: Record<string, unknown> | null;
  problem_solving: Record<string, unknown> | null;
  code_quality: Record<string, unknown> | null;
  ai_usage: Record<string, unknown> | null;
  evidence: Record<string, unknown> | null;
  suggestions: string[] | null;
  summary: string | null;
  confidence: number | null;
  overall_score: number | null;
  generated_at: string;
}

export interface SkillScore {
  id: string;
  user_id: string;
  skill_name: string;
  score: number;
  source: "diagnostic" | "task_evaluation" | "viva";
  recorded_at: string;
}

export interface VivaQuestion {
  question: string;
  answer: string | null;
  followUp: string | null;
  followUpAnswer: string | null;
}
