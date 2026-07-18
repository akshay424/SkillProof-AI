export type AiOperation =
  | "resume_reader"
  | "roadmap_creator"
  | "roadmap_creator_adaptive"
  | "work_evaluation"
  | "question_generator"
  | "final_evaluation"
  | "weekly_evaluation"
  | "roadmap_completion"
  | "resume_transcription";

/**
 * Calls the same-origin AI proxy (`/api/ai/complete`). The OpenAI key and the
 * system prompts both live server-side, keyed by `operation` — the client never
 * ships the key and cannot inject a prompt. `_clientPrompt` is accepted for
 * call-site readability only and is intentionally ignored by the server.
 */
export async function completeJSON<T>(
  operation: Exclude<AiOperation, "resume_transcription">,
  user: string,
  _clientPrompt?: string,
): Promise<T> {
  void _clientPrompt;
  const response = await fetch("/api/ai/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, user, json: true }),
  });
  const body = await response.json().catch(() => ({})) as { content?: string; detail?: string };
  if (!response.ok) throw new Error(body.detail ?? "AI request failed");
  if (!body.content) throw new Error("AI returned an empty response");
  return JSON.parse(body.content) as T;
}

export async function completeVision(user: string, imageDataUrl: string): Promise<string> {
  const response = await fetch("/api/ai/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation: "resume_transcription", user, imageDataUrl }),
  });
  const body = await response.json().catch(() => ({})) as { content?: string; detail?: string };
  if (!response.ok) throw new Error(body.detail ?? "AI vision request failed");
  if (!body.content) throw new Error("AI returned an empty response");
  return body.content;
}
