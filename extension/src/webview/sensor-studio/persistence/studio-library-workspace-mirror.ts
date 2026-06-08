import type { StudioFlowPresetFile } from "../features/editor/flow-library/studio-flow-preset-file";
import type { StudioNodeAssetFile } from "../features/editor/subgraphs/node-library/studio-node-asset-file";

export const STUDIO_LIBRARY_WORKSPACE_MIRROR_VERSION = 1 as const;

export type StudioLibraryWorkspaceMirrorV1 = {
  version: typeof STUDIO_LIBRARY_WORKSPACE_MIRROR_VERSION;
  updatedAt: string;
  flowPresets: StudioFlowPresetFile[];
  groupAssets: StudioNodeAssetFile[];
};

type TimestampedMeta = { id: string; updatedAt: string };

function mergeByUpdatedAt<T extends { meta: TimestampedMeta }>(local: T[], remote: T[]): T[] {
  const byId = new Map(local.map((entry) => [entry.meta.id, entry]));
  for (const entry of remote) {
    const existing = byId.get(entry.meta.id);
    if (
      existing == null ||
      entry.meta.updatedAt.localeCompare(existing.meta.updatedAt) > 0
    ) {
      byId.set(entry.meta.id, entry);
    }
  }
  return [...byId.values()];
}

export function mergeStudioLibraryWorkspaceMirror(args: {
  localFlows: StudioFlowPresetFile[];
  localGroups: StudioNodeAssetFile[];
  mirror: StudioLibraryWorkspaceMirrorV1;
}): {
  flowPresets: StudioFlowPresetFile[];
  groupAssets: StudioNodeAssetFile[];
} {
  return {
    flowPresets: mergeByUpdatedAt(args.localFlows, args.mirror.flowPresets),
    groupAssets: mergeByUpdatedAt(args.localGroups, args.mirror.groupAssets),
  };
}

export function buildStudioLibraryWorkspaceMirror(args: {
  flowPresets: StudioFlowPresetFile[];
  groupAssets: StudioNodeAssetFile[];
}): StudioLibraryWorkspaceMirrorV1 {
  return {
    version: STUDIO_LIBRARY_WORKSPACE_MIRROR_VERSION,
    updatedAt: new Date().toISOString(),
    flowPresets: args.flowPresets,
    groupAssets: args.groupAssets,
  };
}

export function parseStudioLibraryWorkspaceMirror(raw: string): StudioLibraryWorkspaceMirrorV1 | null {
  try {
    const parsed = JSON.parse(raw) as Partial<StudioLibraryWorkspaceMirrorV1>;
    if (parsed.version !== STUDIO_LIBRARY_WORKSPACE_MIRROR_VERSION) {
      return null;
    }
    if (!Array.isArray(parsed.flowPresets) || !Array.isArray(parsed.groupAssets)) {
      return null;
    }
    return {
      version: STUDIO_LIBRARY_WORKSPACE_MIRROR_VERSION,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
      flowPresets: parsed.flowPresets,
      groupAssets: parsed.groupAssets,
    };
  } catch {
    return null;
  }
}

export function isStudioLibraryWorkspaceMirrorEmpty(mirror: StudioLibraryWorkspaceMirrorV1): boolean {
  return mirror.flowPresets.length === 0 && mirror.groupAssets.length === 0;
}
