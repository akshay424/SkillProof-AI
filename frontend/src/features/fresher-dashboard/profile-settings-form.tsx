"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { GlassCard } from "@/components/shared/glass-card";
import { useUpdateUserProfile } from "@/services/queries/users";
import { createClient } from "@/services/supabase/client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { UserProfile } from "@/types/user";

const profileSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  jobTitle: z.string().optional(),
  gitlabToken: z.string().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

function initials(name: string | null) {
  if (!name) return "U";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function ProfileSettingsForm({ profile }: { profile: UserProfile }) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const updateProfile = useUpdateUserProfile();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.full_name ?? "",
      jobTitle: profile.job_title ?? "",
      gitlabToken: profile.gitlab_token ?? "",
    },
  });

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      if (DEMO_MODE) {
        toast.info("Avatar upload is disabled in demo mode.");
        return;
      }

      setUploading(true);
      try {
        const supabase = createClient();
        const path = `${profile.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        await updateProfile.mutateAsync({
          id: profile.id,
          updates: { avatar_url: data.publicUrl },
        });
        setAvatarUrl(data.publicUrl);
        toast.success("Avatar updated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to upload avatar");
      } finally {
        setUploading(false);
      }
    },
    [profile.id, updateProfile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
    disabled: uploading,
  });

  const onSubmit = async (values: ProfileValues) => {
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        updates: {
          full_name: values.fullName,
          job_title: values.jobTitle || null,
          gitlab_token: values.gitlabToken || null,
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
          <AvatarImage src={avatarUrl ?? undefined} alt={profile.full_name ?? "User"} />
          <AvatarFallback className="text-lg">{initials(profile.full_name)}</AvatarFallback>
        </Avatar>
        <div
          {...getRootProps()}
          className={`flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-muted-foreground">
            {uploading ? "Uploading..." : "Drag & drop or click to upload a new avatar"}
          </span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="jobTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job title</FormLabel>
                <FormControl>
                  <Input placeholder="Flutter Developer Trainee" {...field} />
                </FormControl>
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
                  Used to clone private GitLab repositories when you submit a task. Needs at least{" "}
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
