export interface EvaluationReport {
  id: string;
  submission_id: string;
  user_id: string;
  architecture: Record<string, unknown> | null;
  folder_structure: Record<string, unknown> | null;
  problem_solving: Record<string, unknown> | null;
  code_quality: Record<string, unknown> | null;
  ai_usage: Record<string, unknown> | null;
  evidence: Record<string, unknown> | null;
  suggestions: string[] | null;
  confidence: number | null;
  overall_score: number | null;
  generated_at: string;
  roadmap_id?: string | null;
  report_payload?: Record<string, unknown>;
  needs_human_interaction?: boolean;
}

export interface SkillScore {
  id: string;
  user_id: string;
  skill_name: string;
  score: number;
  source: "diagnostic" | "task_evaluation" | "viva";
  recorded_at: string;
}

export interface PromptTemplate {
  id: string;
  organization_id: string;
  key: string;
  name: string;
  template_body: string;
  variables: string[];
  version: number;
  is_active: boolean;
  updated_at: string;
}

export interface AIConfiguration {
  id: string;
  organization_id: string;
  provider: "openai" | "gemini";
  model_name: string;
  temperature: number;
  max_tokens: number;
  extra_settings: Record<string, unknown>;
  updated_at: string;
}
