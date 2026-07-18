import { redirect } from "next/navigation";

import { getBackendSessionUser } from "@/services/backend/session";
import { DEMO_MODE } from "@/utils/demo-mode";

export default async function RootPage() {
  if (DEMO_MODE) {
    redirect("/fresher");
  }

  const user = await getBackendSessionUser();
  if (!user) {
    redirect("/login");
  }
  redirect(`/${user.role}`);
}
