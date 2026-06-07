import { resolveWebviewPackAssetOnlineUrl } from "../../../../asset-resolution/global-directory-online-fallback";
import {
  resolveBundledFlowPresetAssetUrl,
  resolveBundledFlowPresetIndexUrl,
} from "./flow-preset-bundled-endpoints";

export const STUDIO_FLOW_PRESET_INDEX_REL_PATH = "libraries/flow-preset/index.json";

export type RemoteFlowPresetIndexEntry = {
  id: string;
  name: string;
  category?: string;
  file: string;
  description?: string;
};

export type RemoteFlowPresetIndex = {
  entries: RemoteFlowPresetIndexEntry[];
};

export function resolveRemoteFlowPresetIndexUrl(): string | null {
  return resolveWebviewPackAssetOnlineUrl(STUDIO_FLOW_PRESET_INDEX_REL_PATH);
}

export function resolveRemoteFlowPresetAssetUrl(fileName: string): string | null {
  const trimmed = fileName.trim().replace(/^\/+/, "");
  if (trimmed.length === 0) {
    return null;
  }
  return resolveWebviewPackAssetOnlineUrl(`libraries/flow-preset/${trimmed}`);
}

export function parseRemoteFlowPresetIndex(raw: unknown): RemoteFlowPresetIndex | null {
  if (raw == null || typeof raw !== "object") {
    return null;
  }
  const entriesRaw = (raw as { entries?: unknown }).entries;
  if (!Array.isArray(entriesRaw)) {
    return null;
  }
  const entries = entriesRaw.filter((entry): entry is RemoteFlowPresetIndexEntry => {
    if (entry == null || typeof entry !== "object") {
      return false;
    }
    const e = entry as RemoteFlowPresetIndexEntry;
    return (
      typeof e.id === "string" &&
      e.id.trim().length > 0 &&
      typeof e.name === "string" &&
      typeof e.file === "string" &&
      e.file.trim().length > 0
    );
  });
  return entries.length > 0 ? { entries } : null;
}

async function fetchJsonIndex(url: string): Promise<RemoteFlowPresetIndex | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return null;
    }
    return parseRemoteFlowPresetIndex(await res.json());
  } catch {
    return null;
  }
}

async function fetchTextAsset(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return null;
    }
    return await res.text();
  } catch {
    return null;
  }
}

export async function fetchRemoteFlowPresetIndex(): Promise<RemoteFlowPresetIndex | null> {
  const online = resolveRemoteFlowPresetIndexUrl();
  if (online != null) {
    const parsed = await fetchJsonIndex(online);
    if (parsed != null) {
      return parsed;
    }
  }
  return fetchJsonIndex(resolveBundledFlowPresetIndexUrl());
}

export async function fetchRemoteFlowPresetAssetText(fileName: string): Promise<string | null> {
  const online = resolveRemoteFlowPresetAssetUrl(fileName);
  if (online != null) {
    const text = await fetchTextAsset(online);
    if (text != null) {
      return text;
    }
  }
  return fetchTextAsset(resolveBundledFlowPresetAssetUrl(fileName));
}
