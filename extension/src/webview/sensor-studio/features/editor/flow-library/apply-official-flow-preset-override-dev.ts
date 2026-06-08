import type { StudioDemoTemplateId } from "../store/flow-editor.store";
import {
  parseStudioFlowPresetFile,
  serializeStudioFlowPresetFile,
  type StudioFlowPresetFile,
} from "./studio-flow-preset-file";
import { templateIdFromOfficialFlowPresetId } from "./demo-template-flow-preset-category";

export const FLOW_PRESET_APPLY_OVERRIDE_DEV_API = "/__dev_api/flow-preset/apply-override";
export const FLOW_PRESET_COMMIT_OVERRIDE_DEV_API = "/__dev_api/flow-preset/commit-override";
export const FLOW_PRESET_FINALIZE_OVERRIDES_DEV_API = "/__dev_api/flow-preset/finalize-overrides";
export const FLOW_PRESET_REGEN_DEV_API = "/__dev_api/flow-preset/regen";
export const FLOW_PRESET_PUBLISH_STATUS_DEV_API = "/__dev_api/flow-preset/publish-status";
export const FLOW_PRESET_PREPARE_PUBLISH_DEV_API = "/__dev_api/flow-preset/prepare-publish";

export type FlowPresetPublishStatus = {
  ok: true;
  githubTokenConfigured: boolean;
  freeRepoPath: string;
  freeRepoExists: boolean;
  stagedPackPath: string;
  bundledPackPath: string;
  bundledJsonCount: number;
};

export type ApplyOfficialFlowPresetOverrideDevResult =
  | { ok: true; path: string; warning?: string }
  | { ok: false; error: string };

export function isFlowPresetOverrideDevApiAvailable(): boolean {
  return import.meta.env.DEV;
}

export async function applyOfficialFlowPresetOverrideToRepoDev(
  templateId: StudioDemoTemplateId,
  preset: StudioFlowPresetFile,
): Promise<ApplyOfficialFlowPresetOverrideDevResult> {
  if (!isFlowPresetOverrideDevApiAvailable()) {
    return { ok: false, error: "Override dev API is only available in Vite dev." };
  }
  try {
    const res = await fetch(FLOW_PRESET_APPLY_OVERRIDE_DEV_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId,
        content: serializeStudioFlowPresetFile(preset),
      }),
    });
    const payload = (await res.json()) as ApplyOfficialFlowPresetOverrideDevResult;
    if (!res.ok) {
      return { ok: false, error: payload.ok === false ? payload.error : `HTTP ${res.status}` };
    }
    return payload;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function applyOfficialFlowPresetOverrideFileToRepoDev(
  file: File,
): Promise<ApplyOfficialFlowPresetOverrideDevResult> {
  if (!isFlowPresetOverrideDevApiAvailable()) {
    return { ok: false, error: "Override dev API is only available in Vite dev." };
  }
  const text = await file.text();
  const parsed = parseStudioFlowPresetFile(text);
  if (parsed == null) {
    return { ok: false, error: "Selected file is not a valid trn-flow-preset." };
  }

  let templateId = templateIdFromOfficialFlowPresetId(parsed.meta.id);
  if (templateId == null) {
    const stem = file.name.replace(/\.trn-flow-preset\.json$/i, "").replace(/\.json$/i, "");
    if (/^[a-z0-9-]+$/.test(stem)) {
      templateId = stem as StudioDemoTemplateId;
    }
  }
  if (templateId == null) {
    return {
      ok: false,
      error: "Could not determine template id from file name or meta.id (expected official-{templateId}).",
    };
  }

  try {
    const res = await fetch(FLOW_PRESET_APPLY_OVERRIDE_DEV_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId, content: text }),
    });
    const payload = (await res.json()) as ApplyOfficialFlowPresetOverrideDevResult;
    if (!res.ok) {
      return { ok: false, error: payload.ok === false ? payload.error : `HTTP ${res.status}` };
    }
    return payload;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function fetchFlowPresetPublishStatusDev(): Promise<
  FlowPresetPublishStatus | { ok: false; error: string }
> {
  if (!isFlowPresetOverrideDevApiAvailable()) {
    return { ok: false, error: "Publish dev API is only available in Vite dev." };
  }
  try {
    const res = await fetch(FLOW_PRESET_PUBLISH_STATUS_DEV_API);
    const payload = (await res.json()) as FlowPresetPublishStatus | { ok: false; error: string };
    if (!res.ok || payload.ok === false) {
      return { ok: false, error: "error" in payload ? payload.error : `HTTP ${res.status}` };
    }
    return payload;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export type PrepareOfficialFlowPresetsPublishResult =
  | {
      ok: true;
      regen: true;
      staged: {
        stagedPackPath: string;
        fileCount: number;
        nextStep?: string;
      };
      published?: {
        fileCount: number;
        repo: string;
        branch: string;
        remotePrefix: string;
      };
    }
  | { ok: false; step?: string; error: string };

export async function prepareOfficialFlowPresetsPublishDev(args: {
  publishOnline: boolean;
}): Promise<PrepareOfficialFlowPresetsPublishResult> {
  if (!isFlowPresetOverrideDevApiAvailable()) {
    return { ok: false, error: "Publish dev API is only available in Vite dev." };
  }
  try {
    const res = await fetch(FLOW_PRESET_PREPARE_PUBLISH_DEV_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publishOnline: args.publishOnline }),
    });
    const payload = (await res.json()) as PrepareOfficialFlowPresetsPublishResult;
    if (!res.ok || !payload.ok) {
      return {
        ok: false,
        step: "step" in payload ? payload.step : undefined,
        error: "error" in payload ? payload.error : `HTTP ${res.status}`,
      };
    }
    return payload;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export type CommitOfficialFlowPresetOverrideFullDevResult =
  | {
      ok: true;
      path: string;
      warning?: string;
      regen: true;
      staged: {
        stagedPackPath: string;
        fileCount: number;
        nextStep?: string;
      };
      published?: {
        fileCount: number;
        repo: string;
        branch: string;
        remotePrefix: string;
      };
    }
  | { ok: false; step?: string; error: string };

export async function commitOfficialFlowPresetOverrideFullDev(args: {
  templateId: StudioDemoTemplateId;
  preset: StudioFlowPresetFile;
  publishOnline: boolean;
}): Promise<CommitOfficialFlowPresetOverrideFullDevResult> {
  if (!isFlowPresetOverrideDevApiAvailable()) {
    return { ok: false, error: "Override dev API is only available in Vite dev." };
  }
  try {
    const res = await fetch(FLOW_PRESET_COMMIT_OVERRIDE_DEV_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: args.templateId,
        content: serializeStudioFlowPresetFile(args.preset),
        publishOnline: args.publishOnline,
      }),
    });
    const payload = (await res.json()) as CommitOfficialFlowPresetOverrideFullDevResult;
    if (!res.ok || !payload.ok) {
      return {
        ok: false,
        step: "step" in payload ? payload.step : undefined,
        error: "error" in payload ? payload.error : `HTTP ${res.status}`,
      };
    }
    return payload;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function finalizeOfficialFlowPresetOverridesDev(args: {
  publishOnline: boolean;
}): Promise<CommitOfficialFlowPresetOverrideFullDevResult> {
  if (!isFlowPresetOverrideDevApiAvailable()) {
    return { ok: false, error: "Finalize dev API is only available in Vite dev." };
  }
  try {
    const res = await fetch(FLOW_PRESET_FINALIZE_OVERRIDES_DEV_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publishOnline: args.publishOnline }),
    });
    const payload = (await res.json()) as CommitOfficialFlowPresetOverrideFullDevResult;
    if (!res.ok || !payload.ok) {
      return {
        ok: false,
        step: "step" in payload ? payload.step : undefined,
        error: "error" in payload ? payload.error : `HTTP ${res.status}`,
      };
    }
    return payload;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function regenerateOfficialFlowPresetsDev(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (!isFlowPresetOverrideDevApiAvailable()) {
    return { ok: false, error: "Regen dev API is only available in Vite dev." };
  }
  try {
    const res = await fetch(FLOW_PRESET_REGEN_DEV_API, { method: "POST" });
    const payload = (await res.json()) as { ok: boolean; error?: string };
    if (!res.ok || !payload.ok) {
      return { ok: false, error: payload.error ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
