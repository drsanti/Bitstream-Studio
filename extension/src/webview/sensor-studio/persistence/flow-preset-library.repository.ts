import type { StudioFlowPresetFile } from "../features/editor/flow-library/studio-flow-preset-file";
import {
  STUDIO_FLOW_PRESET_MARKER,
  STUDIO_FLOW_PRESET_VERSION,
} from "../features/editor/flow-library/studio-flow-preset-file";

const STORAGE_KEY = "sensor-studio:flow-preset-library:v1";

function getWebLocalStorage(): Storage | null {
  if (typeof globalThis === "undefined") {
    return null;
  }
  const g = globalThis as unknown as { localStorage?: Storage; window?: { localStorage?: Storage } };
  if (typeof g.window !== "undefined" && g.window?.localStorage != null) {
    return g.window.localStorage;
  }
  if (g.localStorage != null) {
    return g.localStorage;
  }
  return null;
}

export type PersistedFlowPresetLibraryV1 = {
  version: 1;
  updatedAt: string;
  presets: StudioFlowPresetFile[];
};

function isValidPreset(raw: unknown): raw is StudioFlowPresetFile {
  if (raw == null || typeof raw !== "object") {
    return false;
  }
  const o = raw as Partial<StudioFlowPresetFile>;
  return (
    o.marker === STUDIO_FLOW_PRESET_MARKER &&
    o.version === STUDIO_FLOW_PRESET_VERSION &&
    o.meta != null &&
    typeof o.meta.name === "string" &&
    o.document != null &&
    Array.isArray((o.document as { nodes?: unknown }).nodes) &&
    Array.isArray((o.document as { edges?: unknown }).edges)
  );
}

export function readPersistedFlowPresetLibrary(): StudioFlowPresetFile[] {
  const ls = getWebLocalStorage();
  if (ls == null) {
    return [];
  }
  const raw = ls.getItem(STORAGE_KEY);
  if (raw == null) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedFlowPresetLibraryV1>;
    if (parsed.version !== 1 || !Array.isArray(parsed.presets)) {
      return [];
    }
    return parsed.presets.filter(isValidPreset);
  } catch {
    return [];
  }
}

export function writePersistedFlowPresetLibrary(presets: StudioFlowPresetFile[]): void {
  const ls = getWebLocalStorage();
  if (ls == null) {
    return;
  }
  const payload: PersistedFlowPresetLibraryV1 = {
    version: 1,
    updatedAt: new Date().toISOString(),
    presets,
  };
  ls.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearPersistedFlowPresetLibrary(): void {
  const ls = getWebLocalStorage();
  if (ls == null) {
    return;
  }
  ls.removeItem(STORAGE_KEY);
}
