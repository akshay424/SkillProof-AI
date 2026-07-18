export type AiOperation =
  | "resume_reader"
  | "roadmap_creator"
  | "work_evaluation"
  | "question_generator"
  | "final_evaluation"
  | "weekly_evaluation"
  | "resume_transcription";

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
