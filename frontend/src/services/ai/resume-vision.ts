import { completeVision } from "@/services/ai/openai-client";
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

  return completeVision(
    "You are a resume transcription agent. Transcribe this resume image into clean plain text, including education, skills, projects, and experience. Return only the transcribed text.",
    "Transcribe the attached resume image.",
    dataUrl,
  );
}
