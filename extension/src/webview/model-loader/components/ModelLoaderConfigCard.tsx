import React from "react";
import { Eye, EyeOff, Save } from "lucide-react";
import { Button } from "../../ui/components/Button";
import { Input } from "../../ui/components/Input";
import type { ModelLoaderConfig } from "../types";
import { ModelLoaderGroupCard } from "./ModelLoaderGroupCard";

export interface ModelLoaderConfigCardProps {
  config: ModelLoaderConfig;
  onChange: (next: ModelLoaderConfig) => void;
  onSave: () => Promise<void>;
  loading: boolean;
  isExtension: boolean;
  buttonClassName?: string;
  /**
   * `grouped`: collapsible "Model Store Credentials" section (default).
   * `plain`: same fields without the section chrome (e.g. inside a dialog).
   */
  layout?: "grouped" | "plain";
}

export function ModelLoaderConfigCard({
  config,
  onChange,
  onSave,
  loading,
  isExtension,
  buttonClassName,
  layout = "grouped",
}: ModelLoaderConfigCardProps) {
  const apiKeyFieldId = React.useId();
  const [showApiKey, setShowApiKey] = React.useState(false);
  const glassInputClassName =
    "h-7 !py-0.5 rounded-md border border-white/10 bg-neutral-950/80 backdrop-blur-md px-3 text-sm leading-tight text-gray-200 placeholder:text-gray-400 focus:border-white/25 focus:outline-none focus:ring-1 focus:ring-white/10";

  const fields = (
    <>
      <Input
        label="Base URL"
        value={config.baseUrl}
        onChange={(e) => onChange({ ...config, baseUrl: e.target.value })}
        placeholder="https://admin.tesaiot.com"
        inputClassName={glassInputClassName}
      />
      <div className="space-y-1">
        <label
          htmlFor={apiKeyFieldId}
          className="block text-sm text-gray-400 mb-1"
        >
          API Key
        </label>
        <div className="relative">
          <input
            id={apiKeyFieldId}
            type={showApiKey ? "text" : "password"}
            value={config.apiKey}
            onChange={(e) => onChange({ ...config, apiKey: e.target.value })}
            placeholder={isExtension ? "Leave blank to keep stored secret" : "API Key"}
            className="w-full rounded-md border border-white/10 bg-neutral-950/80 backdrop-blur-md px-3 py-1 pr-9 text-sm text-gray-200 placeholder:text-gray-400 focus:border-white/25 focus:outline-none focus:ring-1 focus:ring-white/10"
          />
          <button
            type="button"
            onClick={() => setShowApiKey((prev) => !prev)}
            className="absolute inset-y-0 right-2 inline-flex items-center text-slate-400 hover:text-slate-200"
            aria-label={showApiKey ? "Hide API key" : "Show API key"}
            title={showApiKey ? "Hide API key" : "Show API key"}
          >
            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {isExtension && config.hasStoredApiKey && config.apiKey.trim() === "" && (
          <p className="text-[11px] text-emerald-400/90">
            A stored API key will be used for requests. Enter a new key only to replace it.
          </p>
        )}
      </div>
      <Input
        label="CA Cert Path (optional)"
        value={config.caCertPath ?? ""}
        onChange={(e) => onChange({ ...config, caCertPath: e.target.value })}
        placeholder="Path to CA cert"
        inputClassName={glassInputClassName}
      />
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="secondary"
          className={
            buttonClassName ??
            "inline-flex items-center gap-1.5 border border-gray-400/35 bg-slate-700/30 backdrop-blur-md px-2.5 py-1 text-[11px] text-white shadow-sm shadow-black/20 hover:bg-slate-600/35"
          }
          onClick={() => void onSave()}
          disabled={loading}
        >
          <Save className="h-3.5 w-3.5" />
          Save Config
        </Button>
      </div>
    </>
  );

  if (layout === "plain") {
    return <div className="space-y-3">{fields}</div>;
  }

  return (
    <ModelLoaderGroupCard title="Model Store Credentials" defaultOpen={false}>
      {fields}
    </ModelLoaderGroupCard>
  );
}
