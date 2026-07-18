"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { GlassCard } from "@/components/shared/glass-card";
import { ListRowsSkeleton } from "@/components/shared/loading-skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePromptTemplates, useUpdatePromptTemplate } from "@/services/queries/prompt-templates";
import type { PromptTemplate } from "@/types/report";

export function PromptTemplatesTable({
  organizationId,
  updatedBy,
}: {
  organizationId: string | undefined;
  updatedBy: string | undefined;
}) {
  const { data: templates, isLoading } = usePromptTemplates(organizationId);
  const updateTemplate = useUpdatePromptTemplate();
  const [editing, setEditing] = useState<PromptTemplate | null>(null);
  const [draftBody, setDraftBody] = useState("");

  const openEditor = (template: PromptTemplate) => {
    setEditing(template);
    setDraftBody(template.template_body);
  };

  const handleSave = async () => {
    if (!editing || !updatedBy) return;
    try {
      await updateTemplate.mutateAsync({
        id: editing.id,
        updates: { template_body: draftBody },
        updatedBy,
      });
      toast.success("Prompt template updated");
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update template");
    }
  };

  const handleToggleActive = async (template: PromptTemplate, isActive: boolean) => {
    if (!updatedBy) return;
    try {
      await updateTemplate.mutateAsync({
        id: template.id,
        updates: { is_active: isActive },
        updatedBy,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update template");
    }
  };

  return (
    <GlassCard className="p-6">
      <h3 className="mb-4 font-semibold">Prompt Templates</h3>
      {isLoading ? (
        <ListRowsSkeleton rows={3} />
      ) : !templates || templates.length === 0 ? (
        <EmptyState icon={Sparkles} title="No prompt templates yet" />
      ) : (
        <ul className="space-y-2">
          {templates.map((template) => (
            <li
              key={template.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{template.name}</p>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {template.key}
                  </Badge>
                </div>
                <p className="line-clamp-1 text-xs text-muted-foreground">{template.template_body}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Switch
                  checked={template.is_active}
                  onCheckedChange={(checked) => handleToggleActive(template, checked)}
                  aria-label="Toggle active"
                />
                <Button variant="outline" size="sm" onClick={() => openEditor(template)}>
                  Edit
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="template-body">Template body</Label>
            <Textarea
              id="template-body"
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Variables: {editing?.variables.map((v) => `{{${v}}}`).join(", ") || "none"}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={updateTemplate.isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}
