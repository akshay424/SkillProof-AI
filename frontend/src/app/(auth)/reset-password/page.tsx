import Link from "next/link";

export const metadata = { title: "Password support — SkillProof AI" };

export default function ResetPasswordPage() {
  return (
    <div className="space-y-4 text-center">
      <h2 className="text-lg font-semibold">Password reset is unavailable</h2>
      <p className="text-sm text-muted-foreground">Please contact your administrator to reset a backend account.</p>
      <Link href="/login" className="text-sm font-medium text-primary hover:underline">Back to sign in</Link>
    </div>
  );
}
