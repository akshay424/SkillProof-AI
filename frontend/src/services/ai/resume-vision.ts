import { getOpenAIClient, DEFAULT_MODEL } from "@/services/ai/openai-client";
import { DEMO_MODE } from "@/utils/demo-mode";

const DEMO_RESUME_TEXT =
  "Aarav Kumar — B.Tech Computer Science. Projects: a Flutter expense tracker app, a React portfolio site. Skills: Dart, Flutter, Git, basic REST API consumption.";

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

export async function extractResumeTextFromImage(dataUrl: string): Promise<string> {
  if (DEMO_MODE) {
    return DEMO_RESUME_TEXT;
  }

  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Transcribe this resume image into clean plain text — include all sections (education, skills, projects, experience) verbatim. Return only the transcribed text, no commentary.",
          },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("Couldn't read any text from this image.");
  }
  return text;
}
