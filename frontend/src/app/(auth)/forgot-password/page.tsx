import Link from "next/link";

export const metadata = { title: "Password support — SkillProof AI" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-4 text-center">
      <h2 className="text-lg font-semibold">Password reset is managed by your administrator</h2>
      <p className="text-sm text-muted-foreground">The current backend does not provide a password-reset endpoint.</p>
      <Link href="/login" className="text-sm font-medium text-primary hover:underline">Back to sign in</Link>
    </div>
  );
}
