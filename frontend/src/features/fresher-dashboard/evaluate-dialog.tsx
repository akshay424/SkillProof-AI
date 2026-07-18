"use client";

import { AlertTriangle, CheckCircle2, Loader2, MessageCircleQuestion, Sparkles } from "lucide-react";
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
import { useUser } from "@/hooks/use-user";
import { fetchWorkEvidence } from "@/services/gitlab/fetch-work-evidence";
import { runWorkEvaluationAgent } from "@/services/ai/work-evaluation-agent";
import { runQuestionGeneratorAgent } from "@/services/ai/question-generator-agent";
import { runFinalEvaluationAgent } from "@/services/ai/final-evaluation-agent";
import { runRoadmapCreatorAgentModeB } from "@/services/ai/roadmap-creator-agent";
import { useCreateRoadmapFromAgent } from "@/services/queries/roadmaps";
import { useCreateDailyReport } from "@/services/queries/reports";
import { useRecordSkillScores } from "@/services/queries/skill-scores";
import type { GeneratedQuestion, QuestionAnswerInput, WorkEvaluationOutput } from "@/types/evaluation";
import type { DiagnosticTask, RoadmapRecord } from "@/types/roadmap";

type Stage = "setup" | "fetching" | "evaluating" | "qa" | "finalizing" | "done";

export function EvaluateDialog({
  userId,
  roadmap,
  task,
  gitlabToken,
  gitlabRepoUrl,
}: {
  userId: string;
  roadmap: RoadmapRecord;
  task: DiagnosticTask;
  gitlabToken: string | null;
  gitlabRepoUrl: string | null;
}) {
  const { data: user } = useUser();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("setup");
  const [gitlabUrl, setGitlabUrl] = useState(gitlabRepoUrl ?? "");
  const [branch, setBranch] = useState("evaluate");
  const [employeeExplanation, setEmployeeExplanation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [workEvaluation, setWorkEvaluation] = useState<WorkEvaluationOutput | null>(null);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswerInput[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [needsHumanReview, setNeedsHumanReview] = useState(false);

  const createRoadmap = useCreateRoadmapFromAgent();
  const createReport = useCreateDailyReport();
  const recordScores = useRecordSkillScores();

  const reset = () => {
    setStage("setup");
    setGitlabUrl(gitlabRepoUrl ?? "");
    setBranch("evaluate");
    setEmployeeExplanation("");
    setError(null);
    setWorkEvaluation(null);
    setQuestions([]);
    setQuestionIndex(0);
    setAnswers([]);
    setCurrentAnswer("");
    setFinalScore(null);
    setNeedsHumanReview(false);
  };

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const finalize = async (qa: QuestionAnswerInput[], evaluation: WorkEvaluationOutput) => {
    setStage("finalizing");
    try {
      const evidence = await fetchWorkEvidence(gitlabUrl, branch, gitlabToken ?? undefined);

      const finalEvaluation = await runFinalEvaluationAgent({
        employeeId: userId,
        employeeName: user?.profile.full_name ?? "Fresher",
        task,
        evidence,
        evaluation,
        answers: qa,
      });

      await createReport.mutateAsync({ userId, roadmapId: roadmap.id, report: finalEvaluation });

      await recordScores.mutateAsync({
        userId,
        scores: finalEvaluation.competencies
          .filter((c) => c.proposed_score !== null)
          .map((c) => ({ skillName: c.name, score: Math.round(((c.proposed_score ?? 0) / 4) * 100) })),
        source: "task_evaluation",
      });

      const nextPayload = await runRoadmapCreatorAgentModeB({
        employeeId: userId,
        employeeName: user?.profile.full_name ?? "Fresher",
        targetRole: roadmap.target_role ?? "AI Product Developer",
        previousPayload: roadmap.roadmap_payload,
        finalEvaluation,
      });

      await createRoadmap.mutateAsync({
        userId,
        title: nextPayload.roadmap_summary || "Adaptive Roadmap",
        targetRole: roadmap.target_role ?? "AI Product Developer",
        payload: nextPayload,
      });

      setFinalScore(finalEvaluation.overall_result.proposed_score ?? evaluation.overall_task_score);
      setNeedsHumanReview(finalEvaluation.human_review.required);
      setStage("done");
      toast.success("Evaluation complete");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to finalize evaluation");
      setStage("qa");
    }
  };

  const handleFetchAndEvaluate = async () => {
    if (!gitlabUrl.trim() || !employeeExplanation.trim()) return;
    setError(null);
    setStage("fetching");
    try {
      const evidence = await fetchWorkEvidence(gitlabUrl, branch, gitlabToken ?? undefined);
      setStage("evaluating");

      const evaluation = await runWorkEvaluationAgent({ task, evidence, employeeExplanation });
      setWorkEvaluation(evaluation);

      const questionGen = await runQuestionGeneratorAgent(evaluation);
      if (questionGen.question_count === 0) {
        await finalize([], evaluation);
        return;
      }

      setQuestions(questionGen.questions);
      setQuestionIndex(0);
      setStage("qa");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStage("setup");
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || !workEvaluation) return;

    const q = questions[questionIndex];
    const updated = [...answers, { question_id: q.question_id, competency: q.competency, question: q.question, answer: currentAnswer }];
    setAnswers(updated);
    setCurrentAnswer("");

    if (questionIndex + 1 < questions.length) {
      setQuestionIndex((i) => i + 1);
    } else {
      await finalize(updated, workEvaluation);
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
            if (stage !== "setup" && stage !== "done") e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Evaluate: {task.task_title}
            </DialogTitle>
          </DialogHeader>

          {stage === "setup" && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="gitlab-url">GitLab repository URL</Label>
                <Input
                  id="gitlab-url"
                  placeholder="https://gitlab.com/your-username/your-project"
                  value={gitlabUrl}
                  onChange={(e) => setGitlabUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gitlab-branch">Branch</Label>
                <Input id="gitlab-branch" value={branch} onChange={(e) => setBranch(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  For private repos, add a GitLab token in Profile Settings first.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee-explanation">Explain your approach</Label>
                <Textarea
                  id="employee-explanation"
                  value={employeeExplanation}
                  onChange={(e) => setEmployeeExplanation(e.target.value)}
                  rows={4}
                  placeholder="What did you build, what tradeoffs did you make, and did you use AI assistance anywhere?"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <DialogFooter>
                <Button onClick={handleFetchAndEvaluate} disabled={!gitlabUrl.trim() || !employeeExplanation.trim()}>
                  Fetch &amp; Evaluate
                </Button>
              </DialogFooter>
            </div>
          )}

          {(stage === "fetching" || stage === "evaluating" || stage === "finalizing") && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {stage === "fetching" && "Fetching your repository activity…"}
                {stage === "evaluating" && "AI is evaluating your work…"}
                {stage === "finalizing" && "Finalizing your evaluation and updating your roadmap…"}
              </p>
            </div>
          )}

          {stage === "qa" && questions[questionIndex] && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MessageCircleQuestion className="h-3.5 w-3.5" />
                Question {questionIndex + 1} of {questions.length}
              </div>
              <p className="text-sm font-medium">{questions[questionIndex].question}</p>
              <p className="text-xs text-muted-foreground">{questions[questionIndex].reason}</p>
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
                  {questionIndex + 1 === questions.length ? "Submit & Finish" : "Submit Answer"}
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
                Your report has been added to Reports and your roadmap has been updated with a new task.
              </p>
              {needsHumanReview && (
                <p className="flex items-center gap-1.5 text-xs text-warning">
                  <AlertTriangle className="h-3.5 w-3.5" /> Flagged for PM review before it&apos;s final.
                </p>
              )}
              <Button onClick={() => changeOpen(false)}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
