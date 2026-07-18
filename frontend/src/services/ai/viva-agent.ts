import { completeJSON } from "@/services/ai/openai-client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { CodeEvaluationResult } from "@/services/ai/evaluation-agent";

const QUESTIONS_SYSTEM_PROMPT = `You are a senior technical interviewer conducting a real-time viva for a
fresher developer, based ONLY on their submitted code evaluation. Never ask generic programming trivia —
every question must reference a specific choice evident in their code review (a pattern used, a library
choice, a missing layer, an error-handling gap, etc). Ask exactly 3 questions, ordered from easiest to
hardest. Respond with strict JSON: { "questions": string[] }`;

const FOLLOW_UP_SYSTEM_PROMPT = `You are a senior technical interviewer. Given the question you just asked
and the candidate's answer, ask ONE short, natural follow-up question that probes deeper into their answer
(e.g. asks them to justify a tradeoff, handle an edge case, or explain a consequence). Respond with strict
JSON: { "followUp": string }`;

const DEMO_QUESTIONS = [
  "Why did you choose Dio over the built-in http package for the weather API client?",
  "Your code doesn't have a repository layer between the UI and AuthService — what would change if you added one?",
  "How does your login screen handle a network timeout versus an invalid-credentials error differently?",
];

const DEMO_FOLLOW_UP = "Can you walk through what happens in your code if that call fails midway through?";

export async function generateVivaQuestions(evaluation: CodeEvaluationResult): Promise<string[]> {
  if (DEMO_MODE) {
    return DEMO_QUESTIONS;
  }

  const user = JSON.stringify(evaluation);
  const result = await completeJSON<{ questions: string[] }>("question_generator", user, QUESTIONS_SYSTEM_PROMPT);
  return result.questions;
}

export async function generateFollowUp(question: string, answer: string): Promise<string> {
  if (DEMO_MODE) {
    return DEMO_FOLLOW_UP;
  }

  const user = `Question: ${question}\nAnswer: ${answer}`;
  const result = await completeJSON<{ followUp: string }>("question_generator", user, FOLLOW_UP_SYSTEM_PROMPT);
  return result.followUp;
}
