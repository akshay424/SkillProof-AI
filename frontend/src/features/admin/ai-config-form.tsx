"use client";

import { Brain, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/shared/glass-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { useAIConfiguration, useUpdateAIConfiguration } from "@/services/queries/ai-configuration";

export function AIConfigForm({ organizationId }: { organizationId: string | undefined }) {
  const { data: config, isLoading } = useAIConfiguration(organizationId);
  const updateConfig = useUpdateAIConfiguration();

  const [provider, setProvider] = useState<"openai" | "gemini">("openai");
  const [modelName, setModelName] = useState("");
  const [temperature, setTemperature] = useState(0.3);
  const [maxTokens, setMaxTokens] = useState(2000);

  useEffect(() => {
    if (config) {
      setProvider(config.provider);
      setModelName(config.model_name);
      setTemperature(config.temperature);
      setMaxTokens(config.max_tokens);
    }
  }, [config]);

  const handleSave = async () => {
    if (!config) return;
    try {
      await updateConfig.mutateAsync({
        id: config.id,
        updates: { provider, model_name: modelName, temperature, max_tokens: maxTokens },
      });
      toast.success("AI configuration updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update configuration");
    }
  };

  return (
    <GlassCard className="max-w-xl space-y-5 p-6">
      <h3 className="font-semibold">AI Configuration</h3>

      {isLoading ? (
        <Skeleton className="h-56 w-full rounded-xl" />
      ) : !config ? (
        <EmptyState icon={Brain} title="No AI configuration found for this organization" />
      ) : (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as "openai" | "gemini")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI (GPT-5)</SelectItem>
                <SelectItem value="gemini">Google Gemini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-name">Model name</Label>
            <Input id="model-name" value={modelName} onChange={(e) => setModelName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Temperature</Label>
              <span className="text-sm text-muted-foreground tabular-nums">{temperature.toFixed(1)}</span>
            </div>
            <Slider
              value={[temperature]}
              min={0}
              max={1}
              step={0.1}
              onValueChange={([value]) => setTemperature(value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-tokens">Max tokens</Label>
            <Input
              id="max-tokens"
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
            />
          </div>

          <Button onClick={handleSave} disabled={updateConfig.isPending}>
            {updateConfig.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save configuration
          </Button>
        </div>
      )}
    </GlassCard>
  );
}
