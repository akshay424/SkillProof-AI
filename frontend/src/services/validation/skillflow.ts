const MAX_RESUME_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_RESUME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export function validateResumeFile(file: File): string | null {
  if (!ACCEPTED_RESUME_TYPES.has(file.type)) {
    return "Upload your resume as a PDF, JPG, or PNG file.";
  }
  if (file.size === 0) return "The selected resume file is empty. Choose a valid file.";
  if (file.size > MAX_RESUME_SIZE_BYTES) return "Resume file must be 10 MB or smaller.";
  return null;
}

export function validateRoadmapRequest(resumeText: string, interviewNotes: string): string | null {
  if (resumeText.trim().length < 80) {
    return "Add a readable resume with enough detail (at least 80 characters) before generating a roadmap.";
  }
  if (interviewNotes.trim().length < 10) {
    return "Add at least a short interview evaluation note before generating a roadmap.";
  }
  return null;
}

export function validateRepositoryUrl(value: string): string | null {
  if (!value.trim()) return "Enter your GitHub, GitLab, or Bitbucket repository URL to evaluate this task.";
  try {
    const url = new URL(value.trim());
    const segments = url.pathname.split("/").filter(Boolean);
    if (url.protocol !== "https:" || !["github.com", "gitlab.com", "bitbucket.org"].includes(url.hostname.toLowerCase()) || segments.length < 2) {
      return "Use a complete HTTPS GitHub, GitLab, or Bitbucket project URL, for example https://github.com/owner/repository.";
    }
  } catch {
    return "Enter a valid GitHub, GitLab, or Bitbucket repository URL.";
  }
  return null;
}

export function validateGitBranch(value: string): string | null {
  return /^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/.test(value.trim())
    ? null
    : "Enter a valid Git branch name, for example evaluate.";
}

export function validateAiDisclosure(usedAi: boolean, details: string): string | null {
  return !usedAi || details.trim().length >= 5
    ? null
    : "Briefly describe how AI assisted your work, or uncheck the AI assistance option.";
}

export function validateEmployeeAnswer(answer: string): string | null {
  return answer.trim().length >= 8
    ? null
    : "Please add a short answer (at least 8 characters) so the evaluation can use your explanation.";
}

export function validateGeneratedRoadmap(value: unknown): string | null {
  if (!value || typeof value !== "object") return "AI returned an invalid roadmap. Please try again.";
  const roadmap = value as { title?: unknown; weeks?: unknown };
  if (typeof roadmap.title !== "string" || !roadmap.title.trim() || !Array.isArray(roadmap.weeks) || roadmap.weeks.length !== 8) {
    return "AI returned an incomplete roadmap. Please try again.";
  }
  const validTasks = roadmap.weeks.every((week) => {
    if (!week || typeof week !== "object") return false;
    const task = (week as { task?: unknown }).task;
    return !!task && typeof task === "object" && typeof (task as { title?: unknown }).title === "string";
  });
  return validTasks ? null : "AI returned a roadmap with incomplete tasks. Please try again.";
}

export function validateReportScore(score: number): string | null {
  return Number.isFinite(score) && score >= 0 && score <= 100
    ? null
    : "AI returned an invalid report score. Please try again.";
}

export function validateInternalRedirectPath(value: string | null): string | null {
  if (!value) return null;
  return value.startsWith("/") && !value.startsWith("//") ? value : null;
}
