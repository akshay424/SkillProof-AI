import type { Metadata } from "next";

import { SignupForm } from "@/features/auth/signup-form";

export const metadata: Metadata = { title: "Create account — SkillProof AI" };

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-lg font-semibold">Create your account</h2>
        <p className="text-sm text-muted-foreground">
          Start your AI-powered path to project readiness.
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
