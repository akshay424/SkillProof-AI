import { completeJSON } from "@/services/ai/openai-client";
import { DEMO_MODE } from "@/utils/demo-mode";

export interface RepoFile {
  path: string;
  content: string;
}

export interface EvaluationTaskContext {
  title: string;
  description: string;
  requirements: string[];
  acceptanceCriteria: string[];
}

export interface CodeEvaluationResult {
  architecture: { pattern: string; verdict: string };
  folderStructure: { verdict: string };
  problemSolving: { verdict: string };
  codeQuality: { verdict: string };
  aiUsage: { detected: boolean; verdict: string };
  evidence: { filesReviewed: string[] };
  suggestions: string[];
  confidence: number;
  overallScore: number;
}

const SYSTEM_PROMPT = `You are a senior software engineer performing a code review for a fresher developer's
task submission. You will be given a list of files (path + content) from their repository. Review
architecture, folder structure, problem solving, code quality, and whether AI-generated code appears to
have been used without understanding. Be specific and cite file paths as evidence. Respond with strict
JSON matching this exact shape, no prose outside JSON:
{
  "architecture": { "pattern": string, "verdict": string },
  "folderStructure": { "verdict": string },
  "problemSolving": { "verdict": string },
  "codeQuality": { "verdict": string },
  "aiUsage": { "detected": boolean, "verdict": string },
  "evidence": { "filesReviewed": string[] },
  "suggestions": string[],
  "confidence": number (0-1),
  "overallScore": number (0-100)
}`;

const DEMO_EVALUATION: CodeEvaluationResult = {
  architecture: { pattern: "MVC", verdict: "Reasonable separation for a single screen; no clear repository layer yet." },
  folderStructure: { verdict: "Widgets, services, and models are separated but services are still called directly from widgets." },
  problemSolving: { verdict: "Handles the happy path and empty-state validation correctly." },
  codeQuality: { verdict: "Consistent naming; some duplication between validators that could be extracted." },
  aiUsage: { detected: false, verdict: "No signs of unexplained AI-generated boilerplate." },
  evidence: { filesReviewed: ["lib/screens/login_screen.dart", "lib/services/auth_service.dart"] },
  suggestions: ["Extract form validators into a shared utility", "Introduce a repository layer between UI and services"],
  confidence: 0.82,
  overallScore: 78,
};

export async function evaluateSubmission(
  files: RepoFile[],
  task: EvaluationTaskContext,
): Promise<CodeEvaluationResult> {
  if (DEMO_MODE) {
    return DEMO_EVALUATION;
  }

  const user = JSON.stringify({
    assigned_task: task,
    repository_files: files,
  });
  return completeJSON<CodeEvaluationResult>("work_evaluation", user, SYSTEM_PROMPT);
}
