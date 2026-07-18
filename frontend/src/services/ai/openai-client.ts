import OpenAI from "openai";

/**
 * Calls OpenAI directly from the browser — no backend proxy. This means
 * NEXT_PUBLIC_OPENAI_API_KEY is shipped in the client bundle and readable by
 * anyone who opens devtools. Accepted as a known, explicit tradeoff for this
 * phase; do not use a production/unrestricted key here.
 */
let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "NEXT_PUBLIC_OPENAI_API_KEY is not set. Add it to frontend/.env.local to use AI features.",
    );
  }

  if (!client) {
    client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }
  return client;
}

export const DEFAULT_MODEL = "gpt-4o";

export async function completeJSON<T>(system: string, user: string): Promise<T> {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  return JSON.parse(content) as T;
}
