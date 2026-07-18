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

const SYSTEM_PROMPTS: Record<AiOperation, string> = {
  resume_reader: "You are the SkillFlow Resume Reader for an AI Product Developer fresher. Extract claimed skills, projects, education, certifications and soft skills only from the supplied data. Resume claims are unverified. Assess the 15 supplied role competencies, recommend 1-3 diagnostic focus areas, do not make hiring or appraisal decisions, and return valid JSON matching the requested schema only.",
  roadmap_creator: "You are the SkillFlow First-Day Roadmap Creator for a fresher AI Product Developer. Use the supplied Resume Reader result and interview notes. Resume claims are unverified. Produce a practical, employee-facing eight-week diagnostic roadmap with one appropriately difficult task per week, clear requirements, acceptance criteria, estimated hours and safe learning resources. Return valid JSON matching the requested schema only.",
  work_evaluation: "You are the SkillFlow Work Evaluation Agent. Review only the supplied task-related repository evidence. Compare it to the stated task and acceptance criteria; cite file paths, identify strengths, gaps, security or quality risks, suggestions, confidence and a 0-100 score. Never infer AI use from style alone and do not treat it as employee disclosure. Return valid JSON matching the requested schema only.",
  question_generator: "You are the SkillFlow Question Generator Agent. From the supplied work evaluation, ask at most two short, easy-to-understand questions that are necessary to clarify the employee's implementation. Ask none when the report has enough evidence. Use only concrete code-review findings. If given an answer, ask at most one concise follow-up only when needed. Return valid JSON matching the requested schema only.",
  final_evaluation: "You are the SkillFlow Final Evaluation Agent. Combine only the supplied work-evaluation evidence and employee answers into a clear, fair PM-ready task report. Distinguish evidence from uncertainty, give actionable growth recommendations, confidence and a 0-100 score. Return valid JSON matching the requested schema only.",
  weekly_evaluation: "You are the SkillFlow Weekly Evaluation Agent. Summarize the supplied daily final reports into a fair PM-ready weekly report: evidence-based strengths, risks, performance trend, next-week focus and a 0-100 score. Do not make employment decisions. Return valid JSON matching the requested schema only.",
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
