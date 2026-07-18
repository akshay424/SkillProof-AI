export async function completeJSON<T>(system: string, user: string): Promise<T> {
  const response = await fetch("/api/ai/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user, json: true }),
  });
  const body = await response.json().catch(() => ({})) as { content?: string; detail?: string };
  if (!response.ok) throw new Error(body.detail ?? "AI request failed");
  if (!body.content) throw new Error("AI returned an empty response");
  return JSON.parse(body.content) as T;
}

export async function completeVision(system: string, user: string, imageDataUrl: string): Promise<string> {
  const response = await fetch("/api/ai/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user, imageDataUrl }),
  });
  const body = await response.json().catch(() => ({})) as { content?: string; detail?: string };
  if (!response.ok) throw new Error(body.detail ?? "AI vision request failed");
  if (!body.content) throw new Error("AI returned an empty response");
  return body.content;
}
