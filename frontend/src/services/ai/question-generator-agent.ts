import { completeJSON, hasOpenAIKey } from "@/services/ai/openai-client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { WorkEvaluationOutput, QuestionGeneratorOutput } from "@/types/evaluation";

// Implements the Question Generator Agent from agents/question-generator.md: ask the
// minimum number of questions (default 1, max 2) needed to clarify a real evidence gap
// the Work Evaluation Agent already flagged — never a new gap, never generic trivia.
const SYSTEM_PROMPT = `You are the Question Generator Agent. Given a completed Work Evaluation Report, select
the minimum number of practical questions needed to clarify it. Default to exactly one question. Ask a
second question only when it covers a separate high-priority gap the first question cannot reasonably
answer. The Work Evaluation Report is the only source of truth — do not invent a new gap or ask about a
competency the report didn't flag. Selection priority: (1) insufficient_evidence for an in-scope
competency, (2) lowest-confidence in-scope competency, (3) an acceptance criterion marked partially_met or
not_verifiable, (4) a repeated gap affecting the next task. Test understanding of the completed work, not
memorization. If the report has no meaningful gap, return question_count 0 with no_question_reason.
Respond with strict JSON matching this exact shape, no prose outside JSON:
{
  "question_count": number,
  "questions": [{ "question_id": string, "competency": string, "question": string, "reason": string, "expected_answer_evidence": string[], "required": boolean }],
  "no_question_reason": string|null,
  "selection_summary": string,
  "requires_human_review": boolean
}`;

const DEMO_QUESTIONS: QuestionGeneratorOutput = {
  question_count: 1,
  questions: [
    {
      question_id: "QUESTION-001",
      competency: "REST API consumption",
      question:
        "Your error handling shows one generic error message for the sign-in call — how would you change your code to show a different message for a network timeout versus invalid credentials?",
      reason: "The Work Evaluation Report found the error handling doesn't distinguish error types.",
      expected_answer_evidence: [
        "Recognizes the difference between a timeout/network error and a 401/invalid-credentials response",
        "Describes checking the error type or status code before choosing the message",
      ],
      required: true,
    },
  ],
  no_question_reason: null,
  selection_summary: "One question was sufficient to clarify the highest-priority gap (error-type handling).",
  requires_human_review: true,
};

export async function runQuestionGeneratorAgent(evaluation: WorkEvaluationOutput): Promise<QuestionGeneratorOutput> {
  if (DEMO_MODE || !hasOpenAIKey()) {
    return DEMO_QUESTIONS;
  }

  if (!evaluation.question_needed) {
    return {
      question_count: 0,
      questions: [],
      no_question_reason: "The Work Evaluation Report contains sufficient evidence for all in-scope competencies.",
      selection_summary: "No follow-up question required.",
      requires_human_review: true,
    };
  }

  const user = JSON.stringify(evaluation);
  return completeJSON<QuestionGeneratorOutput>(SYSTEM_PROMPT, user);
}
