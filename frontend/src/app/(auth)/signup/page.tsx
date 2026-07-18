import Link from "next/link";

export const metadata = { title: "Account provisioning — SkillProof AI" };

export default function SignupPage() {
  return (
    <div className="space-y-4 text-center">
      <h2 className="text-lg font-semibold">Accounts are provisioned by your administrator</h2>
      <p className="text-sm text-muted-foreground">The current backend does not provide self-service account creation.</p>
      <Link href="/login" className="text-sm font-medium text-primary hover:underline">Back to sign in</Link>
    </div>
  );
}
