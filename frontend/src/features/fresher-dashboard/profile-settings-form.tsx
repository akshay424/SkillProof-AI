"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/glass-card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUpdateUserProfile } from "@/services/queries/users";
import { validateRepositoryUrl } from "@/services/validation/skillflow";
import type { UserProfile } from "@/types/user";

const profileSchema = z.object({
  targetRole: z.string().trim().min(2, "Enter a target role"),
  gitlabRepoUrl: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || validateRepositoryUrl(value) === null, {
      message: "Use a complete HTTPS GitHub, GitLab, or Bitbucket project URL.",
    }),
  gitlabToken: z.string().trim().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

function initials(name: string | null) {
  if (!name) return "U";
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

export function ProfileSettingsForm({ profile }: { profile: UserProfile }) {
  const [showToken, setShowToken] = useState(false);
  const updateProfile = useUpdateUserProfile();
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      targetRole: profile.job_title ?? "AI Product Developer",
      gitlabRepoUrl: profile.gitlab_repo_url ?? "",
      gitlabToken: profile.gitlab_token ?? "",
    },
  });

  const onSubmit = async (values: ProfileValues) => {
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        updates: {
          job_title: values.targetRole,
          gitlab_repo_url: values.gitlabRepoUrl?.trim() || null,
          gitlab_token: values.gitlabToken?.trim() || null,
        },
      });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
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
          <FormField
            control={form.control}
            name="gitlabRepoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repository URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://github.com/your-username/your-project" {...field} />
                </FormControl>
                <FormDescription>
                  Your default GitHub, GitLab, or Bitbucket repo for task evaluations — saves you retyping it each time.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gitlabToken"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GitLab personal access token</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showToken ? "text" : "password"}
                      placeholder="glpat-••••••••••••••••••••"
                      autoComplete="off"
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken((v) => !v)}
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label={showToken ? "Hide token" : "Show token"}
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormDescription>
                  Only needed for private GitLab repos. Requires at least{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">read_repository</code> scope.
                </FormDescription>
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
