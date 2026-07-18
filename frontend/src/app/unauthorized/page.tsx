import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <ShieldAlert className="h-12 w-12 text-warning" />
      <h1 className="text-2xl font-semibold">You don&apos;t have access to this page</h1>
      <p className="max-w-sm text-muted-foreground">
        Your account role doesn&apos;t permit viewing this section. If you think this is a
        mistake, reach out to your administrator.
      </p>
      <Button asChild>
        <Link href="/">Back to my dashboard</Link>
      </Button>
    </div>
  );
}
