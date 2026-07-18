import { completeJSON, hasOpenAIKey } from "@/services/ai/openai-client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { ResumeReaderOutput } from "@/types/resume";

// Implements the Resume Reader Agent contract from agents/resume-reader.md:
// turn resume text into an evidence-backed skills profile, without inflating
// proficiency from keywords or job titles. Feeds Roadmap Creator's roadmap_inputs.
const SYSTEM_PROMPT = `You are the Resume Reader Agent. Turn a candidate resume into a trustworthy,
evidence-backed starting profile for roadmap planning. Extract only what the resume actually says —
do not decide whether the candidate should be hired and do not inflate proficiency from job titles,
company names, or keyword lists. Distinguish "mentioned" (keyword only), "used" (used in a project),
"owned" (built/owned the implementation), and "explained" (can explain the decisions) skill statuses.
Redact secrets, credentials, customer data, and unnecessary personal information.
Respond with strict JSON matching this exact shape, no prose outside JSON:
{
  "agent": "resume_reader",
  "candidate": { "name": string|null, "current_role": string|null, "years_experience": number|null, "summary": string },
  "experience": [ { "role": string, "company": string, "duration": string, "achievements": string[], "evidence": string[] } ],
  "skills": [ { "name": string, "status": "mentioned"|"used"|"owned"|"explained"|"unknown", "evidence": string[], "confidence": number (0-1), "validate_through": string } ],
  "missing_information": string[],
  "roadmap_inputs": { "suggested_starting_level": "beginner"|"intermediate"|"advanced", "known_strengths": string[], "skills_to_validate_first": string[] },
  "human_review_required": true
}`;

const DEMO_RESUME_READER_OUTPUT: ResumeReaderOutput = {
  agent: "resume_reader",
  candidate: {
    name: "Aarav Kumar",
    current_role: "B.Tech Computer Science graduate",
    years_experience: 0,
    summary: "Recent CS graduate with hands-on Flutter/Dart project experience and basic REST API exposure.",
  },
  experience: [
    {
      role: "Personal project",
      company: "Flutter expense tracker app",
      duration: "Unspecified",
      achievements: ["Built a working expense-tracking mobile app", "Implemented core Flutter widget composition"],
      evidence: ["Flutter expense tracker app listed on resume"],
    },
    {
      role: "Personal project",
      company: "React portfolio site",
      duration: "Unspecified",
      achievements: ["Built and deployed a personal portfolio site"],
      evidence: ["React portfolio site listed on resume"],
    },
  ],
  skills: [
    {
      name: "Dart/Flutter widget composition",
      status: "owned",
      evidence: ["Built a Flutter expense tracker app"],
      confidence: 0.7,
      validate_through: "First-day diagnostic Flutter task",
    },
    {
      name: "REST API consumption",
      status: "mentioned",
      evidence: ["\"basic REST API consumption\" listed under skills"],
      confidence: 0.3,
      validate_through: "Task requiring a real API call",
    },
    {
      name: "Git",
      status: "mentioned",
      evidence: ["Listed under skills"],
      confidence: 0.4,
      validate_through: "Observe commit/branch hygiene on first task",
    },
    {
      name: "Testing",
      status: "unknown",
      evidence: [],
      confidence: 0,
      validate_through: "Include a small testing requirement in the first task",
    },
  ],
  missing_information: ["No evidence of state-management experience", "No evidence of automated testing"],
  roadmap_inputs: {
    suggested_starting_level: "beginner",
    known_strengths: ["Flutter/Dart widget composition"],
    skills_to_validate_first: ["REST API consumption", "Git workflow", "Testing"],
  },
  human_review_required: true,
};

export async function runResumeReaderAgent(resumeText: string): Promise<ResumeReaderOutput> {
  if (DEMO_MODE || !hasOpenAIKey()) {
    return DEMO_RESUME_READER_OUTPUT;
  }

  const user = `Resume text:\n${resumeText}`;
  return completeJSON<ResumeReaderOutput>(SYSTEM_PROMPT, user);
}
