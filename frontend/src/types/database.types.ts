// Hand-authored, not backed by real migrations yet (no Supabase project wired
// up in this pass — the app runs entirely on demo-mode fixtures). Kept in
// sync with the shape services/queries/* code assumes so real Supabase
// integration can be dropped in later without touching call sites.

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
          role: "fresher" | "pm";
          pm_id: string | null;
          job_title: string | null;
          gitlab_token: string | null;
          resume_text: string | null;
          interview_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_profiles"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Row"]>;
      };
      roadmaps: {
        Row: {
          id: string;
          user_id: string;
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
          submission_id: string | null;
          user_id: string;
          report_type: "task" | "weekly" | "final";
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
          raw_report: Record<string, unknown> | null;
          generated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["evaluation_reports"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["evaluation_reports"]["Row"]>;
      };
      viva_sessions: {
        Row: {
          id: string;
          submission_id: string;
          user_id: string;
          status: "scheduled" | "in_progress" | "completed";
          started_at: string | null;
          ended_at: string | null;
          overall_communication_score: number | null;
        };
        Insert: Partial<Database["public"]["Tables"]["viva_sessions"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["viva_sessions"]["Row"]>;
      };
      viva_questions: {
        Row: {
          id: string;
          viva_session_id: string;
          sequence_number: number;
          question_text: string;
          source_reference: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["viva_questions"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["viva_questions"]["Row"]>;
      };
      viva_answers: {
        Row: {
          id: string;
          viva_question_id: string;
          answer_text: string | null;
          follow_up_generated: boolean;
          ai_feedback: Record<string, unknown> | null;
          answered_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["viva_answers"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["viva_answers"]["Row"]>;
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
    };
  };
}
