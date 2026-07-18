"use client";

import { FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { GlassCard } from "@/components/shared/glass-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateRoadmap } from "@/services/ai/roadmap-agent";
import { extractResumeTextFromImage, fileToDataUrl } from "@/services/ai/resume-vision";
import { extractTextFromPdf } from "@/services/pdf/extract-text";
import { useCreateRoadmapFromAgent } from "@/services/queries/roadmaps";
import { useUpdateUserProfile } from "@/services/queries/users";
import { validateGeneratedRoadmap, validateResumeFile, validateRoadmapRequest } from "@/services/validation/skillflow";
import type { UserProfile } from "@/types/user";

export function OnboardingCard({ profile }: { profile: UserProfile }) {
  const [resumeText, setResumeText] = useState(profile.resume_text ?? "");
  const [resumeFileName, setResumeFileName] = useState<string | null>(profile.resume_text ? "Resume on file" : null);
  const [interviewNotes, setInterviewNotes] = useState(profile.interview_notes ?? "");
  const [parsing, setParsing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const pendingRoadmapId = useRef<string | null>(null);

  const updateProfile = useUpdateUserProfile();
  const createRoadmap = useCreateRoadmapFromAgent();

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const validationMessage = validateResumeFile(file);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setParsing(true);
    try {
      const text = file.type === "application/pdf"
        ? await extractTextFromPdf(file)
        : await extractResumeTextFromImage(await fileToDataUrl(file));
      if (text.trim().length < 80) {
        throw new Error("We could not read enough resume content. Upload a clearer file or use a text-based PDF.");
      }
      setResumeText(text);
      setResumeFileName(file.name);
      toast.success("Resume parsed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to read resume file");
    } finally {
      setParsing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
    maxFiles: 1,
    disabled: parsing || generating,
  });

  const canGenerate = resumeText.trim().length > 0 && interviewNotes.trim().length > 0;

  const handleGenerate = async () => {
    const validationMessage = validateRoadmapRequest(resumeText, interviewNotes);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }
    setGenerating(true);
    try {
      const generated = await generateRoadmap(resumeText, interviewNotes);
      const roadmapValidationMessage = validateGeneratedRoadmap(generated);
      if (roadmapValidationMessage) throw new Error(roadmapValidationMessage);
      await updateProfile.mutateAsync({
        id: profile.id,
        updates: { resume_text: resumeText, interview_notes: interviewNotes },
        resumeSummary: generated.resumeAnalysis ?? { resume_text: resumeText },
        interviewEvaluation: { overall: interviewNotes },
      });
      const storageKey = `skillflow:roadmap-request:${profile.id}`;
      const persistedId = typeof window === "undefined" ? null : window.sessionStorage.getItem(storageKey);
      const requestId = pendingRoadmapId.current ?? persistedId ?? `web-roadmap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      pendingRoadmapId.current = requestId;
      if (typeof window !== "undefined") window.sessionStorage.setItem(storageKey, requestId);
      await createRoadmap.mutateAsync({ userId: profile.id, generated, clientRoadmapId: requestId });
      pendingRoadmapId.current = null;
      if (typeof window !== "undefined") window.sessionStorage.removeItem(storageKey);

      toast.success("Your roadmap is ready");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate roadmap");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <GlassCard className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-semibold">Welcome — let&apos;s build your roadmap</h2>
          <p className="text-sm text-muted-foreground">
            Upload your resume and add the interview evaluation notes. AI will generate your
            personalized 8-week project readiness roadmap.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Resume (PDF, JPG, or PNG)</label>
        <div
          {...getRootProps()}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-4 text-sm transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <input {...getInputProps()} />
          {parsing ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : resumeFileName ? (
            <FileText className="h-4 w-4 text-success" />
          ) : (
            <Upload className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-muted-foreground">
            {parsing ? "Reading resume…" : resumeFileName ?? "Drag & drop your resume (PDF or image), or click to browse"}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="interview-notes">
          Interview evaluation notes
        </label>
        <Textarea
          id="interview-notes"
          value={interviewNotes}
          onChange={(e) => setInterviewNotes(e.target.value)}
          rows={5}
          placeholder="e.g. Strong fundamentals in X, limited exposure to Y, recommend starting with..."
          disabled={generating}
        />
      </div>

      <Button onClick={handleGenerate} disabled={!canGenerate || generating || parsing} className="w-full">
        {generating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating your roadmap…
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" /> Generate My Roadmap with AI
          </>
        )}
      </Button>
      {!canGenerate && (
        <p className="text-center text-xs text-muted-foreground">
          Add your resume and interview notes to enable roadmap generation.
        </p>
      )}
    </GlassCard>
  );
}
