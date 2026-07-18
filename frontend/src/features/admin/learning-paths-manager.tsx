"use client";

import { BookOpen, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { GlassCard } from "@/components/shared/glass-card";
import { ListRowsSkeleton } from "@/components/shared/loading-skeletons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useCreateLearningPath,
  useDeleteLearningPath,
  useLearningPaths,
  useUpdateLearningPath,
} from "@/services/queries/learning-paths";

export function LearningPathsManager({ organizationId }: { organizationId: string | undefined }) {
  const { data: paths, isLoading } = useLearningPaths(organizationId);
  const createPath = useCreateLearningPath();
  const updatePath = useUpdateLearningPath();
  const deletePath = useDeleteLearningPath();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    if (!organizationId || !name.trim()) return;
    try {
      await createPath.mutateAsync({ organization_id: organizationId, name, description });
      toast.success("Learning path created");
      setName("");
      setDescription("");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create learning path");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updatePath.mutateAsync({ id, updates: { is_active: isActive } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update learning path");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePath.mutateAsync(id);
      toast.success("Learning path deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete learning path");
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Learning Paths</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> New path
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create learning path</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="path-name">Name</Label>
                <Input
                  id="path-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Flutter Project Readiness Track"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="path-description">Description</Label>
                <Input
                  id="path-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="8-week roadmap covering..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createPath.isPending || !name.trim()}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <ListRowsSkeleton rows={3} />
      ) : !paths || paths.length === 0 ? (
        <EmptyState icon={BookOpen} title="No learning paths yet" description="Create one to start assigning roadmaps." />
      ) : (
        <ul className="space-y-2">
          {paths.map((path) => (
            <li
              key={path.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{path.name}</p>
                {path.description && (
                  <p className="line-clamp-1 text-xs text-muted-foreground">{path.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={path.is_active}
                  onCheckedChange={(checked) => handleToggleActive(path.id, checked)}
                  aria-label="Toggle active"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDelete(path.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
