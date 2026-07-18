// Mirrors the Resume Reader Agent output contract in agents/resume-reader.md.

export type SkillStatus = "mentioned" | "used" | "owned" | "explained" | "unknown";
export type StartingLevel = "beginner" | "intermediate" | "advanced";

export interface ResumeSkill {
  name: string;
  status: SkillStatus;
  evidence: string[];
  confidence: number;
  validate_through: string;
}

export interface ResumeExperience {
  role: string;
  company: string;
  duration: string;
  achievements: string[];
  evidence: string[];
}

export interface ResumeReaderOutput {
  agent: "resume_reader";
  candidate: {
    name: string | null;
    current_role: string | null;
    years_experience: number | null;
    summary: string;
  };
  experience: ResumeExperience[];
  skills: ResumeSkill[];
  missing_information: string[];
  roadmap_inputs: {
    suggested_starting_level: StartingLevel;
    known_strengths: string[];
    skills_to_validate_first: string[];
  };
  human_review_required: true;
}
