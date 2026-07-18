import OpenAI from "openai";
import { NextResponse } from "next/server";

import { getBackendSessionUser } from "@/services/backend/session";
import type { AiOperation } from "@/services/ai/openai-client";

export const runtime = "nodejs";

const MAX_INPUT_BYTES = 500_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

const requestsByUser = new Map<string, number[]>();

type RequestBody = {
  operation: AiOperation;
  user: string;
  imageDataUrl?: string;
  json?: boolean;
};

// Each JSON operation's prompt must spell out the exact output schema here:
// the client-side agents' prompts are intentionally discarded by this proxy,
// so this is the only schema the model ever sees. Keep these in sync with the
// TypeScript result types in src/services/ai/*.
const SYSTEM_PROMPTS: Record<AiOperation, string> = {
  resume_reader: `You are the SkillFlow Resume Reader for an AI Product Developer fresher. Extract claimed skills, projects, education, certifications and soft skills only from the supplied data. Resume claims are unverified — never mark them verified. Assess against the 15 role competencies (software development fundamentals; AI-assisted coding responsibility; system architecture basics; API integration; AI feature implementation; prompt engineering; code review and debugging; performance optimization basics; security and privacy best practices; technical documentation; LLM and AI API understanding; AI agents and workflow automation basics; RAG and knowledge retrieval basics; AI debugging and evaluation; AI-powered documentation), recommend 1-3 diagnostic focus areas, and never make hiring or appraisal decisions. Set resume_parsing_status.status to "failed" for empty/unreadable/too-short text, "partial" for partly useful text, otherwise "success"; use manual_fallback_data on failed/partial parsing when present. verified_skills and partially_verified_skills must be empty arrays. Respond with valid JSON only, exactly this shape:
{
  "employee_id": string, "employee_name": string, "department": string,
  "role": "AI Product Developer", "employee_type": string,
  "resume_parsing_status": { "status": "success" | "partial" | "failed", "failure_reason": string, "manual_entry_required": boolean, "manual_fallback_used": boolean, "fields_to_confirm": string[], "confidence": number },
  "resume_analysis_summary": string,
  "claimed_skills": [{ "skill": string, "category": string, "source": "resume" | "manual_fallback", "source_in_resume": string, "evidence_strength": "low" | "medium" | "high", "confidence": number, "notes": string }],
  "project_evidence": [{ "project_name": string, "description": string, "skills_claimed_from_project": string[], "evidence_strength": "low" | "medium" | "high", "risk_or_gap": string }],
  "match_analysis": { "matched_competencies": string[], "partially_matched_competencies": string[], "missing_required_competencies": string[], "unsupported_claims": string[], "high_risk_unverified_claims": string[] },
  "first_day_diagnostic_recommendation": { "recommended_focus_competencies": string[], "reason": string, "suggested_task_type": string, "suggested_task_difficulty": string, "required_resources": string[] },
  "roadmap_input": { "claimed_resume_skills": string[], "verified_skills": [], "partially_verified_skills": [], "weak_areas": string[], "resume_based_priority_skills_to_verify": string[] },
  "manager_dashboard_summary": { "resume_signal": string, "skills_to_verify_first": string[], "missing_required_competencies": string[], "note": "Resume skills are unverified and require diagnostic task evidence." }
}`,
  roadmap_creator: `You are the SkillFlow First-Day Roadmap Creator for a fresher AI Product Developer. Use the supplied Resume Reader result and interview notes. Resume claims are unverified. Produce a practical, employee-facing diagnostic roadmap of exactly 8 weeks, one appropriately difficult hands-on task per week (not quizzes), with clear requirements, acceptance criteria, estimated hours and safe learning resources. Do not label the fresher weak. Respond with valid JSON only, exactly this shape:
{
  "title": string,
  "weeks": [
    {
      "weekNumber": number (1-8),
      "theme": string,
      "summary": string (1 sentence),
      "task": {
        "title": string,
        "description": string,
        "requirements": string[],
        "acceptanceCriteria": string[],
        "difficulty": "beginner" | "intermediate" | "advanced",
        "estimatedHours": number,
        "resources": [{ "label": string, "url": string }]
      }
    }
  ]
}
The "weeks" array must contain exactly 8 entries.`,
  work_evaluation: `You are the SkillFlow Work Evaluation Agent. Review only the supplied task-related repository evidence. Compare it to the stated task and acceptance criteria; cite file paths as evidence, identify strengths, gaps, security or quality risks, suggestions, confidence and a 0-100 score. Never infer AI use from style alone and do not treat it as employee disclosure. Respond with valid JSON only, exactly this shape:
{
  "architecture": { "pattern": string, "verdict": string },
  "folderStructure": { "verdict": string },
  "problemSolving": { "verdict": string },
  "codeQuality": { "verdict": string },
  "aiUsage": { "detected": boolean, "verdict": string },
  "evidence": { "filesReviewed": string[] },
  "suggestions": string[],
  "confidence": number (0-1),
  "overallScore": number (0-100)
}`,
  question_generator: `You are the SkillFlow Question Generator Agent. Use only concrete findings from the supplied material — never generic programming trivia.
If the input is a work evaluation report: ask at most two short, easy-to-understand questions necessary to clarify the employee's implementation (an empty array when the report already has enough evidence), responding with valid JSON only: { "questions": string[] }.
If the input contains a question and the employee's answer: ask at most one concise, natural follow-up that probes their answer, responding with valid JSON only: { "followUp": string }.`,
  final_evaluation: `You are the SkillFlow Final Evaluation Agent. Combine only the supplied work-evaluation evidence and employee answers into a clear, fair PM-ready task report. Distinguish evidence from uncertainty and give actionable growth recommendations. Respond with valid JSON only, exactly this shape:
{ "communicationVerdict": string, "finalSuggestions": string[], "overallScore": number (0-100), "confidence": number (0-1) }`,
  weekly_evaluation: `You are the SkillFlow Weekly Evaluation Agent. Summarize the supplied daily final reports into a fair PM-ready weekly summary (2-3 sentences covering strengths, weaknesses, and trend). Do not make employment decisions. Respond with valid JSON only, exactly this shape:
{ "summary": string, "overallScore": number (0-100) }`,
  resume_transcription: "You are the SkillFlow Resume Transcription Agent. Transcribe the attached resume image into clean plain text, including education, skills, projects and experience. Return only the transcription.",
};

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const recent = (requestsByUser.get(userId) ?? []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    requestsByUser.set(userId, recent);
    return true;
  }
  recent.push(now);
  requestsByUser.set(userId, recent);
  return false;
}

export async function POST(request: Request) {
  const sessionUser = await getBackendSessionUser();
  if (!sessionUser) return NextResponse.json({ detail: "Authentication required" }, { status: 401 });
  if (isRateLimited(sessionUser.id)) {
    return NextResponse.json({ detail: "AI request limit reached. Please try again later." }, { status: 429 });
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_INPUT_BYTES) {
    return NextResponse.json({ detail: "AI input is too large" }, { status: 413 });
  }

  let body: RequestBody;
  try {
    body = JSON.parse(raw) as RequestBody;
  } catch {
    return NextResponse.json({ detail: "Invalid AI request" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !(body.operation in SYSTEM_PROMPTS) || !body.user?.trim()) {
    return NextResponse.json({ detail: "A valid AI operation and input are required" }, { status: 400 });
  }
  if (body.imageDataUrl && body.operation !== "resume_transcription") {
    return NextResponse.json({ detail: "Images are supported only for resume transcription" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ detail: "OPENAI_API_KEY is not configured on the server" }, { status: 503 });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const userContent = body.imageDataUrl
      ? [
          { type: "text" as const, text: body.user },
          { type: "image_url" as const, image_url: { url: body.imageDataUrl } },
        ]
      : body.user;
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      temperature: body.imageDataUrl ? 0 : 0.4,
      ...(body.json ? { response_format: { type: "json_object" as const } } : {}),
      messages: [
        { role: "system", content: SYSTEM_PROMPTS[body.operation] },
        { role: "user", content: userContent },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return NextResponse.json({ detail: "OpenAI returned an empty response" }, { status: 502 });
    return NextResponse.json({ content });
  } catch (error) {
    console.error("OpenAI request failed", error);
    return NextResponse.json({ detail: "OpenAI request failed" }, { status: 502 });
  }
}
