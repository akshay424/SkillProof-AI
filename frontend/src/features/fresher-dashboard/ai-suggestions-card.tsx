import { Sparkles } from "lucide-react";

import { GlassCard } from "@/components/shared/glass-card";

export function AISuggestionsCard() {
  return (
    <GlassCard className="flex flex-col gap-3 p-6">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <h3 className="font-semibold">AI Suggestions</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Personalized suggestions are generated from your submitted code and evaluation history. This
        activates once your first project submission has been reviewed.
      </p>
    </GlassCard>
  );
}
