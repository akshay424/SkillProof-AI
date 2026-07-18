import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_INPUT_BYTES = 500_000;

type RequestBody = {
  system: string;
  user: string;
  imageDataUrl?: string;
  json?: boolean;
};

export async function POST(request: Request) {
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

  if (!body.system?.trim() || !body.user?.trim()) {
    return NextResponse.json({ detail: "system and user are required" }, { status: 400 });
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
        { role: "system", content: body.system },
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
