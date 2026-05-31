import { resolveWebviewPackAssetOnlineUrl } from "../../../../../asset-resolution/global-directory-online-fallback";

export const STUDIO_NODE_GRAPH_INDEX_REL_PATH = "libraries/node-graph/index.json";

export type RemoteNodeGraphIndexEntry = {
  id: string;
  name: string;
  category?: string;
  file: string;
  description?: string;
};

export type RemoteNodeGraphIndex = {
  entries: RemoteNodeGraphIndexEntry[];
};

export function resolveRemoteNodeGraphIndexUrl(): string | null {
  return resolveWebviewPackAssetOnlineUrl(STUDIO_NODE_GRAPH_INDEX_REL_PATH);
}

export function resolveRemoteNodeGraphAssetUrl(fileName: string): string | null {
  const trimmed = fileName.trim().replace(/^\/+/, "");
  if (trimmed.length === 0) {
    return null;
  }
  return resolveWebviewPackAssetOnlineUrl(`libraries/node-graph/${trimmed}`);
}

export function parseRemoteNodeGraphIndex(raw: unknown): RemoteNodeGraphIndex | null {
  if (raw == null || typeof raw !== "object") {
    return null;
  }
  const entriesRaw = (raw as { entries?: unknown }).entries;
  if (!Array.isArray(entriesRaw)) {
    return null;
  }
  const entries = entriesRaw.filter((entry): entry is RemoteNodeGraphIndexEntry => {
    if (entry == null || typeof entry !== "object") {
      return false;
    }
    const e = entry as RemoteNodeGraphIndexEntry;
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

export async function fetchRemoteNodeGraphIndex(): Promise<RemoteNodeGraphIndex | null> {
  const url = resolveRemoteNodeGraphIndexUrl();
  if (url == null) {
    return null;
  }
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return null;
    }
    return parseRemoteNodeGraphIndex(await res.json());
  } catch {
    return null;
  }
}

export async function fetchRemoteNodeGraphAssetText(fileName: string): Promise<string | null> {
  const url = resolveRemoteNodeGraphAssetUrl(fileName);
  if (url == null) {
    return null;
  }
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
