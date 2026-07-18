import type { Metadata } from "next";

import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const metadata: Metadata = { title: "Set new password — SkillProof AI" };

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-lg font-semibold">Set a new password</h2>
        <p className="text-sm text-muted-foreground">Choose a strong password for your account.</p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
