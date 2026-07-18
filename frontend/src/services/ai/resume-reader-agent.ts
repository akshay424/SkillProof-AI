import { completeJSON } from "@/services/ai/openai-client";
import { DEMO_MODE } from "@/utils/demo-mode";

export interface ResumeReaderContext {
  employeeId?: string;
  employeeName?: string;
  department?: string;
  employeeType?: string;
  experienceYears?: number | null;
  manualFallbackData?: string;
}

export interface ResumeReaderResult {
  employee_id: string;
  employee_name: string;
  department: string;
  role: "AI Product Developer";
  employee_type: string;
  resume_parsing_status: {
    status: "success" | "partial" | "failed";
    failure_reason: string;
    manual_entry_required: boolean;
    manual_fallback_used: boolean;
    fields_to_confirm: string[];
    confidence: number;
  };
  resume_analysis_summary: string;
  claimed_skills: Array<{
    skill: string;
    category: string;
    source: "resume" | "manual_fallback";
    source_in_resume: string;
    evidence_strength: "low" | "medium" | "high";
    confidence: number;
    notes: string;
  }>;
  project_evidence: Array<{
    project_name: string;
    description: string;
    skills_claimed_from_project: string[];
    evidence_strength: "low" | "medium" | "high";
    risk_or_gap: string;
  }>;
  match_analysis: {
    matched_competencies: string[];
    partially_matched_competencies: string[];
    missing_required_competencies: string[];
    unsupported_claims: string[];
    high_risk_unverified_claims: string[];
  };
  first_day_diagnostic_recommendation: {
    recommended_focus_competencies: string[];
    reason: string;
    suggested_task_type: string;
    suggested_task_difficulty: string;
    required_resources: string[];
  };
  roadmap_input: {
    claimed_resume_skills: string[];
    verified_skills: string[];
    partially_verified_skills: string[];
    weak_areas: string[];
    resume_based_priority_skills_to_verify: string[];
  };
  manager_dashboard_summary: {
    resume_signal: string;
    skills_to_verify_first: string[];
    missing_required_competencies: string[];
    note: "Resume skills are unverified and require diagnostic task evidence.";
  };
}

const SYSTEM_PROMPT = `You are SkillFlow AI, an AI Talent Growth Copilot.

Analyze the uploaded resume for the static role: AI Product Developer. The resume may originate from a PDF converted to extracted text. If extracted text is missing or poor quality, use manual_fallback_data when it is available.

Resume skills are claimed skills only. Do not mark them verified.

Static AI Product Developer requirements:
Key responsibilities: Software development; AI-assisted coding; system architecture; API integrations; AI feature implementation; prompt engineering; code reviews; performance optimization; security best practices; technical documentation.
Expected AI skills: AI coding assistants; Large Language Models; AI APIs; AI agents; Retrieval-Augmented Generation; workflow automation; AI debugging; AI-powered documentation.
Competencies: Software development fundamentals; AI-assisted coding responsibility; system architecture basics; API integration; AI feature implementation; prompt engineering; code review and debugging; performance optimization basics; security and privacy best practices; technical documentation; LLM and AI API understanding; AI agents and workflow automation basics; RAG and knowledge retrieval basics; AI debugging and evaluation; AI-powered documentation.

Rules:
1. Extract only claimed skills, tools, projects, education, certifications, and soft skills supported by the resume or manual fallback data.
2. Compare claims with the static role competencies. Identify matched competencies, partially matched competencies, missing required competencies, unsupported claims, and high-risk unverified claims.
3. Recommend one to three first-day diagnostic focus areas suitable for a fresher.
4. Set resume_parsing_status.status to "failed" if resume text is empty, unreadable, too short, or poor quality; "partial" if partly useful; otherwise "success". Use manual fallback data on failed or partial parsing when present.
5. Never make hiring, appraisal, salary, promotion, or employment decisions. Do not infer expertise from a keyword list or job title. Do not reproduce secrets or sensitive personal data.
6. verified_skills and partially_verified_skills must be empty because resume evidence cannot verify a skill.
7. Return valid JSON only. The response must match this exact schema:
{
  "employee_id": string, "employee_name": string, "department": string,
  "role": "AI Product Developer", "employee_type": string,
  "resume_parsing_status": {
    "status": "success" | "partial" | "failed", "failure_reason": string,
    "manual_entry_required": boolean, "manual_fallback_used": boolean,
    "fields_to_confirm": string[], "confidence": number
  },
  "resume_analysis_summary": string,
  "claimed_skills": [{
    "skill": string, "category": string, "source": "resume" | "manual_fallback",
    "source_in_resume": string, "evidence_strength": "low" | "medium" | "high",
    "confidence": number, "notes": string
  }],
  "project_evidence": [{
    "project_name": string, "description": string,
    "skills_claimed_from_project": string[],
    "evidence_strength": "low" | "medium" | "high", "risk_or_gap": string
  }],
  "match_analysis": {
    "matched_competencies": string[], "partially_matched_competencies": string[],
    "missing_required_competencies": string[], "unsupported_claims": string[],
    "high_risk_unverified_claims": string[]
  },
  "first_day_diagnostic_recommendation": {
    "recommended_focus_competencies": string[], "reason": string,
    "suggested_task_type": string, "suggested_task_difficulty": string,
    "required_resources": string[]
  },
  "roadmap_input": {
    "claimed_resume_skills": string[], "verified_skills": [],
    "partially_verified_skills": [], "weak_areas": string[],
    "resume_based_priority_skills_to_verify": string[]
  },
  "manager_dashboard_summary": {
    "resume_signal": string, "skills_to_verify_first": string[],
    "missing_required_competencies": string[],
    "note": "Resume skills are unverified and require diagnostic task evidence."
  }
}`;

const DEMO_RESULT: ResumeReaderResult = {
  employee_id: "",
  employee_name: "",
  department: "",
  role: "AI Product Developer",
  employee_type: "fresher",
  resume_parsing_status: {
    status: "success",
    failure_reason: "",
    manual_entry_required: false,
    manual_fallback_used: false,
    fields_to_confirm: ["Depth of testing and debugging experience"],
    confidence: 0.75,
  },
  resume_analysis_summary: "Fresher with claimed academic and project exposure to Flutter, Dart, Git, and REST APIs. These claims require diagnostic task evidence.",
  claimed_skills: [
    { skill: "Flutter", category: "Software development", source: "resume", source_in_resume: "Flutter expense tracker project", evidence_strength: "medium", confidence: 0.55, notes: "Claimed through a project; unverified." },
    { skill: "REST APIs", category: "API integration", source: "resume", source_in_resume: "Basic REST API consumption", evidence_strength: "low", confidence: 0.4, notes: "Claimed resume skill; unverified." },
    { skill: "Git", category: "Development workflow", source: "resume", source_in_resume: "Skills section", evidence_strength: "low", confidence: 0.3, notes: "Keyword-list claim; unverified." },
  ],
  project_evidence: [
    { project_name: "Flutter expense tracker", description: "Academic Flutter project mentioned in the resume.", skills_claimed_from_project: ["Flutter"], evidence_strength: "medium", risk_or_gap: "No test, architecture, or delivery evidence is available." },
  ],
  match_analysis: {
    matched_competencies: ["Software development fundamentals"],
    partially_matched_competencies: ["API integration"],
    missing_required_competencies: ["Prompt engineering", "LLM and AI API understanding", "Code review and debugging"],
    unsupported_claims: [],
    high_risk_unverified_claims: [],
  },
  first_day_diagnostic_recommendation: {
    recommended_focus_competencies: ["Software development fundamentals", "API integration", "Code review and debugging"],
    reason: "These resume claims have limited implementation evidence and can be checked with a small practical task.",
    suggested_task_type: "Build a small API-backed feature with error handling and a short self-review.",
    suggested_task_difficulty: "beginner",
    required_resources: ["Starter repository", "API documentation", "Task acceptance criteria"],
  },
  roadmap_input: {
    claimed_resume_skills: ["Flutter", "REST APIs", "Git"],
    verified_skills: [],
    partially_verified_skills: [],
    weak_areas: ["Testing and debugging evidence", "AI Product Developer foundations"],
    resume_based_priority_skills_to_verify: ["Software development fundamentals", "API integration", "Code review and debugging"],
  },
  manager_dashboard_summary: {
    resume_signal: "Useful beginner-level project signals; all skills remain unverified.",
    skills_to_verify_first: ["Software development fundamentals", "API integration", "Code review and debugging"],
    missing_required_competencies: ["Prompt engineering", "LLM and AI API understanding", "Code review and debugging"],
    note: "Resume skills are unverified and require diagnostic task evidence.",
  },
};

export async function readResume(
  resumeText: string,
  context: ResumeReaderContext = {},
): Promise<ResumeReaderResult> {
  if (DEMO_MODE) {
    return {
      ...DEMO_RESULT,
      employee_id: context.employeeId ?? "",
      employee_name: context.employeeName ?? "",
      department: context.department ?? "",
      employee_type: context.employeeType ?? "fresher",
    };
  }

  return completeJSON<ResumeReaderResult>(SYSTEM_PROMPT, JSON.stringify({
    employee_id: context.employeeId ?? "",
    employee_name: context.employeeName ?? "",
    department: context.department ?? "",
    role: "AI Product Developer",
    employee_type: context.employeeType ?? "fresher",
    experience_years: context.experienceYears ?? null,
    resume_text: resumeText,
    manual_fallback_data: context.manualFallbackData ?? "",
  }));
}
