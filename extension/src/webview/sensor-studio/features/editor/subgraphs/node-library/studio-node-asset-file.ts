import type { Edge, Node } from "@xyflow/react";
import type { StudioSubgraphDocument } from "../studio-subgraph.types";
import { normalizeNodeAssetForStudio } from "./normalize-node-asset-for-studio";

export const STUDIO_NODE_ASSET_MARKER = "trn-node-asset" as const;
export const STUDIO_NODE_ASSET_VERSION = 1 as const;
export const STUDIO_NODE_ASSET_DRAG_KIND = "nodeAsset" as const;

export type StudioNodeAssetCategory =
  | "animation"
  | "data"
  | "scene"
  | "math"
  | "utility"
  | "composition";

export type StudioNodeAssetDependencies = {
  modelUrls?: string[];
  hdriPresets?: string[];
  dataChannels?: string[];
};

export type StudioNodeAssetMeta = {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  category?: StudioNodeAssetCategory;
  createdAt: string;
  updatedAt: string;
  appVersion?: string;
  /** Set when saved from a graph node — repeat saves update the same library row. */
  sourceNodeId?: string;
  presetKind?: "nodeGraph";
};

export type StudioNodeAssetFile = {
  marker: typeof STUDIO_NODE_ASSET_MARKER;
  version: typeof STUDIO_NODE_ASSET_VERSION;
  meta: StudioNodeAssetMeta;
  nodes: Node[];
  edges: Edge[];
  subgraphs: Record<string, StudioSubgraphDocument>;
  dependencies?: StudioNodeAssetDependencies;
};

export function createStudioNodeAssetId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `asset_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createStudioNodeAssetMeta(
  name: string,
  patch?: Partial<StudioNodeAssetMeta>,
): StudioNodeAssetMeta {
  const now = new Date().toISOString();
  return {
    id: patch?.id ?? createStudioNodeAssetId(),
    name,
    description: patch?.description,
    tags: patch?.tags,
    category: patch?.category ?? "composition",
    createdAt: patch?.createdAt ?? now,
    updatedAt: now,
    appVersion: patch?.appVersion,
    sourceNodeId: patch?.sourceNodeId,
    presetKind: patch?.presetKind,
  };
}

export function serializeStudioNodeAssetFile(asset: StudioNodeAssetFile): string {
  return JSON.stringify(asset, null, 2);
}

export function parseStudioNodeAssetFile(text: string): StudioNodeAssetFile | null {
  try {
    const raw = JSON.parse(text) as Partial<StudioNodeAssetFile>;
    const host = Array.isArray(raw.nodes)
      ? raw.nodes.find(
          (n) =>
            (n as { type?: string }).type === "studio-node-group" ||
            (n as { type?: string }).type === "nodeGroup",
        )
      : undefined;
    if ((host as { type?: string } | undefined)?.type === "nodeGroup") {
      return normalizeNodeAssetForStudio(raw);
    }
    if (raw?.marker !== STUDIO_NODE_ASSET_MARKER || raw.version !== STUDIO_NODE_ASSET_VERSION) {
      return null;
    }
    if (!raw.meta || typeof raw.meta.name !== "string") {
      return null;
    }
    if (!Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) {
      return null;
    }
    if (raw.subgraphs == null || typeof raw.subgraphs !== "object" || Array.isArray(raw.subgraphs)) {
      return null;
    }
    if (!host || (host as { type?: string }).type !== "studio-node-group") {
      return null;
    }

    return {
      marker: STUDIO_NODE_ASSET_MARKER,
      version: STUDIO_NODE_ASSET_VERSION,
      meta: {
        id: typeof raw.meta.id === "string" ? raw.meta.id : createStudioNodeAssetId(),
        name: raw.meta.name,
        description: typeof raw.meta.description === "string" ? raw.meta.description : undefined,
        tags: Array.isArray(raw.meta.tags) ? (raw.meta.tags as string[]) : undefined,
        category: raw.meta.category as StudioNodeAssetCategory | undefined,
        createdAt:
          typeof raw.meta.createdAt === "string" ? raw.meta.createdAt : new Date().toISOString(),
        updatedAt:
          typeof raw.meta.updatedAt === "string" ? raw.meta.updatedAt : new Date().toISOString(),
        appVersion: typeof raw.meta.appVersion === "string" ? raw.meta.appVersion : undefined,
        sourceNodeId:
          typeof raw.meta.sourceNodeId === "string" ? raw.meta.sourceNodeId : undefined,
        presetKind: raw.meta.presetKind === "nodeGraph" ? "nodeGraph" : undefined,
      },
      nodes: raw.nodes as Node[],
      edges: raw.edges as Edge[],
      subgraphs: raw.subgraphs as Record<string, StudioSubgraphDocument>,
      dependencies: raw.dependencies as StudioNodeAssetDependencies | undefined,
    };
  } catch {
    return null;
  }
}

export function downloadStudioNodeAssetFile(asset: StudioNodeAssetFile, filename?: string): void {
  if (typeof document === "undefined") {
    return;
  }
  const safe =
    filename ??
    `${asset.meta.name
      .trim()
      .replace(/[^\w-]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 64) || "node-asset"}.trn-node-asset.json`;
  const blob = new Blob([serializeStudioNodeAssetFile(asset)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safe.endsWith(".json") ? safe : `${safe}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Ensure import does not collide with existing library ids. */
export function rekeyStudioNodeAssetMeta(asset: StudioNodeAssetFile): StudioNodeAssetFile {
  const now = new Date().toISOString();
  return {
    ...asset,
    meta: {
      ...asset.meta,
      id: createStudioNodeAssetId(),
      sourceNodeId: undefined,
      createdAt: asset.meta.createdAt ?? now,
      updatedAt: now,
    },
  };
}

export function studioNodeAssetFromDragPayload(
  data: Record<string, unknown>,
  library: StudioNodeAssetFile[],
  remoteLibrary?: Record<string, StudioNodeAssetFile>,
): StudioNodeAssetFile | null {
  if (data.dragKind !== STUDIO_NODE_ASSET_DRAG_KIND || typeof data.assetId !== "string") {
    return null;
  }
  const fromLibrary = library.find((a) => a.meta.id === data.assetId);
  if (fromLibrary != null) {
    return fromLibrary;
  }
  const fromRemote = remoteLibrary?.[data.assetId];
  if (fromRemote != null) {
    return fromRemote;
  }
  const embedded = data.asset;
  if (embedded != null && typeof embedded === "object") {
    return parseStudioNodeAssetFile(JSON.stringify(embedded));
  }
  return null;
}
