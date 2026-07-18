"use client";

import { CheckCircle2, Loader2, MessageCircleQuestion, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { evaluateSubmission, type CodeEvaluationResult } from "@/services/ai/evaluation-agent";
import { synthesizeTaskReport } from "@/services/ai/report-agent";
import { generateFollowUp, generateVivaQuestions } from "@/services/ai/viva-agent";
import { fetchRepoFiles } from "@/services/gitlab/fetch-repo";
import { useCompleteTaskAndAdvance } from "@/services/queries/roadmaps";
import { useSubmitDailyReport } from "@/services/queries/reports";
import { useEvaluationReports } from "@/services/queries/reports";
import { validateAiDisclosure, validateEmployeeAnswer, validateGitBranch, validateReportScore, validateRepositoryUrl } from "@/services/validation/skillflow";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { VivaQuestion } from "@/types/report";
import type { Task } from "@/types/task";

type Stage = "url" | "fetching" | "reviewing" | "qa" | "synthesizing" | "done";

export function EvaluateDialog({
  userId,
  roadmapId,
  task,
  weekTheme,
  gitlabToken,
}: {
  userId: string;
  roadmapId: string;
  task: Task;
  weekTheme: string;
  gitlabToken: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("url");
  const [gitlabUrl, setGitlabUrl] = useState("");
  const [gitlabBranch, setGitlabBranch] = useState("evaluate");
  const [error, setError] = useState<string | null>(null);
  const [usedAi, setUsedAi] = useState(false);
  const [aiDisclosure, setAiDisclosure] = useState("");

  const [evaluation, setEvaluation] = useState<CodeEvaluationResult | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [qaItems, setQaItems] = useState<VivaQuestion[]>([]);
  const [awaitingFollowUp, setAwaitingFollowUp] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const submitDailyReport = useSubmitDailyReport();
  const completeTask = useCompleteTaskAndAdvance();
  const { data: reports } = useEvaluationReports(userId);
  const hasSubmittedTaskReport = reports?.some((report) =>
    report.report_type === "task"
    && report.roadmap_id === roadmapId
    && (report.report_payload?.task_id === task.id),
  ) ?? false;

  const changeOpen = (next: boolean) => {
    if (next && hasSubmittedTaskReport) {
      toast.info("This task has already been evaluated. Wait for the next task to be assigned before submitting another evaluation.");
      return;
    }
    setOpen(next);
    if (!next) {
      setStage("url");
      setGitlabUrl("");
      setGitlabBranch("evaluate");
      setError(null);
      setUsedAi(false);
      setAiDisclosure("");
      setEvaluation(null);
      setQuestions([]);
      setQuestionIndex(0);
      setQaItems([]);
      setAwaitingFollowUp(false);
      setCurrentAnswer("");
      setFinalScore(null);
    }
  };

  const handleFetchAndReview = async () => {
    if (!roadmapId) {
      setError("No active roadmap is available for this task. Refresh the page or ask your PM for help.");
      return;
    }
    const validationMessage = validateRepositoryUrl(gitlabUrl);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    const branchValidationMessage = validateGitBranch(gitlabBranch);
    if (branchValidationMessage) {
      setError(branchValidationMessage);
      return;
    }
    const disclosureValidationMessage = validateAiDisclosure(usedAi, aiDisclosure);
    if (disclosureValidationMessage) {
      setError(disclosureValidationMessage);
      return;
    }
    setError(null);
    setStage("fetching");
    try {
      const files = await fetchRepoFiles(gitlabUrl, gitlabBranch.trim(), gitlabToken ?? undefined);
      setStage("reviewing");
      const result = await evaluateSubmission(files, {
        title: task.title,
        description: task.description ?? "No additional task description was provided.",
        requirements: task.requirements,
        acceptanceCriteria: task.acceptance_criteria,
      });
      setEvaluation(result);
      const qs = (await generateVivaQuestions(result)).slice(0, 2);
      setQuestions(qs);
      if (qs.length === 0) {
        await finishUp([], result);
        return;
      }
      setStage("qa");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStage("url");
    }
  };

  const finishUp = async (items: VivaQuestion[], evaluationOverride?: CodeEvaluationResult) => {
    const evaluationToSubmit = evaluationOverride ?? evaluation;
    if (!evaluationToSubmit) return;
    setStage("synthesizing");
    try {
      const synthesis = await synthesizeTaskReport(evaluationToSubmit, items);
      const scoreValidationMessage = validateReportScore(synthesis.overallScore);
      if (scoreValidationMessage) throw new Error(scoreValidationMessage);

      await submitDailyReport.mutateAsync({
        userId,
        roadmapId,
        task,
        skillName: weekTheme,
        evaluation: evaluationToSubmit,
        synthesis,
        qaItems: items,
        aiUsageDisclosure: { usedAi, details: aiDisclosure.trim() },
      });

      if (DEMO_MODE) await completeTask.mutateAsync({ userId, taskId: task.id });

      setFinalScore(synthesis.overallScore);
      setStage("done");
      toast.success("Evaluation report submitted");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to finalize evaluation");
      setStage(items.length > 0 ? "qa" : "url");
    }
  };

  const handleSubmitAnswer = async () => {
    const validationMessage = validateEmployeeAnswer(currentAnswer);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setError(null);

    if (!awaitingFollowUp) {
      try {
        const followUp = await generateFollowUp(questions[questionIndex], currentAnswer);
        setQaItems((prev) => [
          ...prev,
          { question: questions[questionIndex], answer: currentAnswer, followUp, followUpAnswer: null },
        ]);
        setCurrentAnswer("");
        setAwaitingFollowUp(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to generate follow-up");
      }
      return;
    }

    const updated = qaItems.map((item, i) =>
      i === qaItems.length - 1 ? { ...item, followUpAnswer: currentAnswer } : item,
    );
    setQaItems(updated);
    setCurrentAnswer("");
    setAwaitingFollowUp(false);

    if (questionIndex + 1 < questions.length) {
      setQuestionIndex((i) => i + 1);
    } else {
      await finishUp(updated);
    }
  };

  return (
    <>
      <Button size="sm" onClick={() => changeOpen(true)}>
        <Sparkles className="mr-2 h-4 w-4" /> Evaluate
      </Button>

      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent
          className="max-w-lg"
          onInteractOutside={(e) => {
            if (stage !== "url" && stage !== "done") e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Evaluate: {task.title}
            </DialogTitle>
          </DialogHeader>

          {stage === "url" && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="gitlab-url">Repository URL</Label>
                <Input
                  id="gitlab-url"
                  placeholder="https://github.com/your-username/your-project"
                  value={gitlabUrl}
                  onChange={(e) => setGitlabUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  SkillFlow evaluates the <strong>evaluate</strong> branch by default. Public GitHub and GitLab repositories are supported.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gitlab-branch">Branch to evaluate</Label>
                <Input
                  id="gitlab-branch"
                  placeholder="evaluate"
                  value={gitlabBranch}
                  onChange={(e) => setGitlabBranch(e.target.value)}
                />
              </div>
              <div className="space-y-2 rounded-lg border border-border/70 p-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="ai-assistance"
                    checked={usedAi}
                    onCheckedChange={(checked) => setUsedAi(checked === true)}
                  />
                  <Label htmlFor="ai-assistance">I used AI assistance for this task</Label>
                </div>
                {usedAi && (
                  <Textarea
                    value={aiDisclosure}
                    onChange={(e) => setAiDisclosure(e.target.value)}
                    rows={2}
                    placeholder="Briefly state which tool you used and what it helped with."
                  />
                )}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <DialogFooter>
                <Button onClick={handleFetchAndReview} disabled={!gitlabUrl.trim()}>
                  Fetch &amp; Evaluate
                </Button>
              </DialogFooter>
            </div>
          )}

          {(stage === "fetching" || stage === "reviewing" || stage === "synthesizing") && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {stage === "fetching" && "Fetching your repository…"}
                {stage === "reviewing" && "AI is reviewing your code…"}
                {stage === "synthesizing" && "Synthesizing your final evaluation…"}
              </p>
            </div>
          )}

          {stage === "qa" && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MessageCircleQuestion className="h-3.5 w-3.5" />
                Question {questionIndex + 1} of {questions.length}
                {awaitingFollowUp ? " — follow-up" : ""}
              </div>
              <p className="text-sm font-medium">
                {awaitingFollowUp ? qaItems[qaItems.length - 1]?.followUp : questions[questionIndex]}
              </p>
              <Textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                rows={4}
                placeholder="Type your answer…"
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <DialogFooter>
                <Button onClick={handleSubmitAnswer} disabled={!currentAnswer.trim()}>
                  {awaitingFollowUp && questionIndex + 1 === questions.length
                    ? "Submit & Finish"
                    : "Submit Answer"}
                </Button>
              </DialogFooter>
            </div>
          )}

          {stage === "done" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
              <p className="font-medium">Evaluation complete</p>
              <p className="text-3xl font-semibold tabular-nums">{finalScore}/100</p>
              <p className="text-sm text-muted-foreground">
                Your report has been stored and is visible in Reports and the PM dashboard.
                {!DEMO_MODE && " Your next task will appear after roadmap progression is updated."}
              </p>
              <Button onClick={() => changeOpen(false)}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
