import { Sparkles } from "lucide-react";

import { GlassCard } from "@/components/shared/glass-card";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </span>
        <h1 className="text-xl font-semibold tracking-tight">SkillProof AI</h1>
        <p className="text-sm text-muted-foreground">Transform Learning into Project Readiness</p>
      </div>
      <GlassCard className="w-full max-w-md p-8">{children}</GlassCard>
    </div>
  );
}
