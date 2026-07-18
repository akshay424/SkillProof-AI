// Hand-authored to match supabase/migrations/0001_init_schema.sql.
// Regenerate with `supabase gen types typescript` once a real project exists.

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["organizations"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["organizations"]["Row"]>;
      };
      user_profiles: {
        Row: {
          id: string;
          organization_id: string | null;
          full_name: string | null;
          avatar_url: string | null;
          role: "employee" | "supervisor" | "admin";
          supervisor_id: string | null;
          job_title: string | null;
          gitlab_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_profiles"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Row"]>;
      };
      learning_paths: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["learning_paths"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["learning_paths"]["Row"]>;
      };
      roadmaps: {
        Row: {
          id: string;
          user_id: string;
          learning_path_id: string | null;
          title: string;
          total_weeks: number;
          status: "not_started" | "in_progress" | "completed";
          started_at: string | null;
          target_completion_date: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["roadmaps"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["roadmaps"]["Row"]>;
      };
      roadmap_weeks: {
        Row: {
          id: string;
          roadmap_id: string;
          week_number: number;
          theme: string;
          summary: string | null;
          unlock_date: string | null;
          status: "locked" | "active" | "completed";
        };
        Insert: Partial<Database["public"]["Tables"]["roadmap_weeks"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["roadmap_weeks"]["Row"]>;
      };
      tasks: {
        Row: {
          id: string;
          roadmap_week_id: string;
          title: string;
          description: string | null;
          requirements: string[];
          acceptance_criteria: string[];
          difficulty: "beginner" | "intermediate" | "advanced" | null;
          estimated_hours: number | null;
          resources: { label: string; url: string }[];
          deadline: string | null;
          status: "not_started" | "in_progress" | "submitted" | "completed";
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["tasks"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["tasks"]["Row"]>;
      };
      submissions: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          submission_type: "gitlab_url" | "zip_upload";
          gitlab_url: string | null;
          storage_path: string | null;
          detected_project_type:
            | "flutter"
            | "react"
            | "node"
            | "python"
            | "java"
            | "android"
            | "ios"
            | null;
          status: "pending" | "processing" | "analyzed" | "failed";
          submitted_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["submissions"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["submissions"]["Row"]>;
      };
      evaluation_reports: {
        Row: {
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
          raw_report: Record<string, unknown> | null;
          generated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["evaluation_reports"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["evaluation_reports"]["Row"]>;
      };
      skill_scores: {
        Row: {
          id: string;
          user_id: string;
          skill_name: string;
          score: number;
          source: "diagnostic" | "task_evaluation" | "viva";
          recorded_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["skill_scores"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["skill_scores"]["Row"]>;
      };
      prompt_templates: {
        Row: {
          id: string;
          organization_id: string;
          key: string;
          name: string;
          template_body: string;
          variables: string[];
          version: number;
          is_active: boolean;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["prompt_templates"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["prompt_templates"]["Row"]>;
      };
      ai_configuration: {
        Row: {
          id: string;
          organization_id: string;
          provider: "openai" | "gemini";
          model_name: string;
          temperature: number;
          max_tokens: number;
          extra_settings: Record<string, unknown>;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_configuration"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["ai_configuration"]["Row"]>;
      };
    };
  };
}
