"use client";

import { motion } from "framer-motion";

import { GlassCard } from "@/components/shared/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/use-user";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function GreetingCard() {
  const { data: user, isLoading } = useUser();
  const firstName = user?.profile.full_name?.split(" ")[0];

  return (
    <GlassCard className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {isLoading ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <h2 className="text-2xl font-semibold tracking-tight">
            {getGreeting()}
            {firstName ? `, ${firstName}` : ""}
          </h2>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s where your project readiness stands today.
        </p>
      </motion.div>
    </GlassCard>
  );
}
