import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getBackendSessionUser } from "@/services/backend/session";
import { DEMO_MODE } from "@/utils/demo-mode";

export default async function PmLayout({ children }: { children: React.ReactNode }) {
  if (!DEMO_MODE) {
    const user = await getBackendSessionUser();
    if (!user) redirect("/login");
    if (user.role !== "pm") redirect("/unauthorized");
  }

  return <AppShell role="pm">{children}</AppShell>;
}
