"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Server, XCircle } from "lucide-react";

import { GlassCard } from "@/components/shared/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/services/api-client";
import { DEMO_MODE } from "@/utils/demo-mode";

interface HealthResponse {
  status: string;
}

interface MeResponse {
  id: string;
  role: string;
}

export function SystemStatusWidget() {
  const health = useQuery({
    queryKey: ["backend-health"],
    queryFn: () => apiFetch<HealthResponse>("/health"),
    retry: false,
    enabled: !DEMO_MODE,
  });

  const me = useQuery({
    queryKey: ["backend-auth-me"],
    queryFn: () => apiFetch<MeResponse>("/auth/me"),
    retry: false,
    enabled: !DEMO_MODE,
  });

  const isLoading = health.isLoading || me.isLoading;

  return (
    <GlassCard className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Server className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold">Backend System Status</h3>
      </div>

      {DEMO_MODE ? (
        <p className="text-sm text-muted-foreground">
          Demo mode is showing static data — the FastAPI backend isn&apos;t running, so this check
          is skipped. Turn off <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_DEMO_MODE</code>{" "}
          and connect a real Supabase project to see this go live.
        </p>
      ) : isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
            <span>API health check</span>
            {health.isSuccess ? (
              <span className="flex items-center gap-1 text-success">
                <CheckCircle2 className="h-4 w-4" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-destructive">
                <XCircle className="h-4 w-4" /> Unreachable
              </span>
            )}
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
            <span>JWT verification (/auth/me)</span>
            {me.isSuccess ? (
              <span className="flex items-center gap-1 text-success">
                <CheckCircle2 className="h-4 w-4" /> Verified as {me.data.role}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-destructive">
                <XCircle className="h-4 w-4" /> Failed
              </span>
            )}
          </div>
          {(health.isError || me.isError) && (
            <p className="text-xs text-muted-foreground">
              Make sure the FastAPI backend is running and NEXT_PUBLIC_API_URL is configured.
            </p>
          )}
        </div>
      )}
    </GlassCard>
  );
}
