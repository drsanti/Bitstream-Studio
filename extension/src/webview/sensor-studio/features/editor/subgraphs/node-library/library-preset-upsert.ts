export type StudioLibraryPresetKind = "nodeGraph";

export type StudioLibraryPresetSource = {
  sourceNodeId: string;
  presetKind: StudioLibraryPresetKind;
};

export type StudioLibraryPresetMeta = {
  id: string;
  sourceNodeId?: string;
  presetKind?: StudioLibraryPresetKind;
  createdAt: string;
  updatedAt: string;
};

export type StudioLibrarySaveResult = {
  id: string;
  updated: boolean;
};

export function findLinkedStudioLibraryPreset<
  T extends { meta: StudioLibraryPresetMeta & { name?: string } },
>(library: T[], source: StudioLibraryPresetSource): T | undefined {
  return library.find(
    (entry) =>
      entry.meta.sourceNodeId === source.sourceNodeId &&
      entry.meta.presetKind === source.presetKind,
  );
}

export function upsertStudioLibraryPreset<T extends { meta: StudioLibraryPresetMeta }>(
  library: T[],
  incoming: T,
  source: StudioLibraryPresetSource,
): { library: T[]; result: StudioLibrarySaveResult } {
  const now = new Date().toISOString();
  const withSource: T = {
    ...incoming,
    meta: {
      ...incoming.meta,
      sourceNodeId: source.sourceNodeId,
      presetKind: source.presetKind,
      updatedAt: now,
    },
  };

  const idx = library.findIndex(
    (entry) =>
      entry.meta.sourceNodeId === source.sourceNodeId &&
      entry.meta.presetKind === source.presetKind,
  );

  if (idx >= 0) {
    const existing = library[idx]!;
    const merged: T = {
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
