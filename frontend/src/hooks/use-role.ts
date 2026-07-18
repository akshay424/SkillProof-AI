import { useUser } from "@/hooks/use-user";
import type { UserRole } from "@/types/user";

export function useRole(): UserRole | undefined {
  const { data } = useUser();
  return data?.profile.role;
}
