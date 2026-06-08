import {
  isStudioFlowPresetCategory,
  type StudioFlowPresetCategory,
  type StudioFlowPresetFile,
} from "./studio-flow-preset-file";

export type FlowPresetUpsertSource = {
  sourceScopeId: string;
  presetKind: StudioFlowPresetFile["meta"]["presetKind"];
};

export type FlowPresetSaveResult = {
  id: string;
  updated: boolean;
};

export function findLinkedFlowPreset(
  library: StudioFlowPresetFile[],
  source: FlowPresetUpsertSource,
): StudioFlowPresetFile | undefined {
  return library.find(
    (entry) =>
      entry.meta.sourceScopeId === source.sourceScopeId &&
      entry.meta.presetKind === source.presetKind,
  );
}

export function upsertFlowPreset(
  library: StudioFlowPresetFile[],
  incoming: StudioFlowPresetFile,
  source: FlowPresetUpsertSource,
): { library: StudioFlowPresetFile[]; result: FlowPresetSaveResult } {
  const now = new Date().toISOString();
  const withSource: StudioFlowPresetFile = {
    ...incoming,
    meta: {
      ...incoming.meta,
      sourceScopeId: source.sourceScopeId,
      presetKind: source.presetKind,
      updatedAt: now,
    },
  };

  const idx = library.findIndex(
    (entry) =>
      entry.meta.sourceScopeId === source.sourceScopeId &&
      entry.meta.presetKind === source.presetKind,
  );

  if (idx >= 0) {
    const existing = library[idx]!;
    const merged: StudioFlowPresetFile = {
      ...withSource,
      meta: {
        ...withSource.meta,
        id: existing.meta.id,
        createdAt: existing.meta.createdAt,
      },
    };
    const next = [...library];
    next[idx] = merged;
    return { library: next, result: { id: existing.meta.id, updated: true } };
  }

  return {
    library: [...library, withSource],
    result: { id: withSource.meta.id, updated: false },
  };
}

export function replaceFlowPresetById(
  library: StudioFlowPresetFile[],
  presetId: string,
  incoming: StudioFlowPresetFile,
): { library: StudioFlowPresetFile[]; result: FlowPresetSaveResult } | null {
  const idx = library.findIndex((entry) => entry.meta.id === presetId);
  if (idx < 0) {
    return null;
  }
  const existing = library[idx]!;
  const now = new Date().toISOString();
  const merged: StudioFlowPresetFile = {
    ...incoming,
    meta: {
      ...incoming.meta,
      id: existing.meta.id,
      createdAt: existing.meta.createdAt,
      updatedAt: now,
    },
  };
  const next = [...library];
  next[idx] = merged;
  return { library: next, result: { id: presetId, updated: true } };
}

export function patchFlowPresetMeta(
  library: StudioFlowPresetFile[],
  presetId: string,
  patch: {
    name: string;
    category: StudioFlowPresetCategory;
    description?: string;
  },
): StudioFlowPresetFile[] | null {
  const idx = library.findIndex((entry) => entry.meta.id === presetId);
  if (idx < 0) {
    return null;
  }
  const existing = library[idx]!;
  const category = isStudioFlowPresetCategory(patch.category) ? patch.category : "custom";
  const next = [...library];
  next[idx] = {
    ...existing,
    meta: {
      ...existing.meta,
      name: patch.name.trim(),
      category,
      description: patch.description,
      updatedAt: new Date().toISOString(),
    },
  };
  return next;
}
