"use client";

import { CheckCircle2, Loader2, MessageCircleQuestion, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  const [error, setError] = useState<string | null>(null);

  const [evaluation, setEvaluation] = useState<CodeEvaluationResult | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [qaItems, setQaItems] = useState<VivaQuestion[]>([]);
  const [awaitingFollowUp, setAwaitingFollowUp] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const submitDailyReport = useSubmitDailyReport();
  const completeTask = useCompleteTaskAndAdvance();

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setStage("url");
      setGitlabUrl("");
      setError(null);
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
    if (!gitlabUrl.trim()) return;
    setError(null);
    setStage("fetching");
    try {
      const files = await fetchRepoFiles(gitlabUrl, gitlabToken ?? undefined);
      setStage("reviewing");
      const result = await evaluateSubmission(files);
      setEvaluation(result);
      const qs = await generateVivaQuestions(result);
      setQuestions(qs);
      setStage("qa");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStage("url");
    }
  };

  const finishUp = async (items: VivaQuestion[]) => {
    if (!evaluation) return;
    setStage("synthesizing");
    try {
      const synthesis = await synthesizeTaskReport(evaluation, items);

      await submitDailyReport.mutateAsync({
        userId,
        roadmapId,
        task,
        skillName: weekTheme,
        evaluation,
        synthesis,
        qaItems: items,
      });

      if (DEMO_MODE) await completeTask.mutateAsync({ userId, taskId: task.id });

      setFinalScore(synthesis.overallScore);
      setStage("done");
      toast.success("Evaluation report submitted");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to finalize evaluation");
      setStage("qa");
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) return;

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
                <Label htmlFor="gitlab-url">GitLab repository URL</Label>
                <Input
                  id="gitlab-url"
                  placeholder="https://gitlab.com/your-username/your-project"
                  value={gitlabUrl}
                  onChange={(e) => setGitlabUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  For private repos, add a GitLab token in Profile Settings first.
                </p>
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
              </p>
              <Button onClick={() => changeOpen(false)}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
