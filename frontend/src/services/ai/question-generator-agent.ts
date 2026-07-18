import { completeJSON } from "@/services/ai/openai-client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { WorkEvaluationOutput, QuestionGeneratorOutput } from "@/types/evaluation";

// Implements the Question Generator Agent from agents/question-generator.md: ask the
// minimum number of questions (default 1, max 2) needed to clarify a real evidence gap
// the Work Evaluation Agent already flagged — never a new gap, never generic trivia.
// The full output contract lives server-side under the "question_generator" operation.

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
  if (DEMO_MODE) {
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
  return completeJSON<QuestionGeneratorOutput>("question_generator", user);
}
