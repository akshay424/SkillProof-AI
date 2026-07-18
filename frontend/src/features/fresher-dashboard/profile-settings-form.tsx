"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/glass-card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUpdateUserProfile } from "@/services/queries/users";
import type { UserProfile } from "@/types/user";

const profileSchema = z.object({
  targetRole: z.string().min(2, "Enter a target role"),
});

type ProfileValues = z.infer<typeof profileSchema>;

function initials(name: string | null) {
  if (!name) return "U";
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

export function ProfileSettingsForm({ profile }: { profile: UserProfile }) {
  const updateProfile = useUpdateUserProfile();
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { targetRole: profile.job_title ?? "AI Product Developer" },
  });

  const onSubmit = async (values: ProfileValues) => {
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        updates: { job_title: values.targetRole },
      });
      toast.success("Target role updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update target role");
    }
  };

  return (
    <GlassCard className="max-w-xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-lg">{initials(profile.full_name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{profile.full_name ?? "Fresher"}</p>
          <p className="text-sm text-muted-foreground">Identity details are managed by the backend administrator.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="targetRole"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target role</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </form>
      </Form>
    </GlassCard>
  );
}
