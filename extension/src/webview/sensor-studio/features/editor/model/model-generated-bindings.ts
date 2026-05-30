/**
 * Optional links between a **Model** (`model-select`) flow node and other nodes
 * spawned from / scoped to that model (e.g. future GLB-derived palette).
 *
 * - Child nodes store `sourceModelNodeId` = React Flow id of the parent Model node.
 * - Parent Model nodes store `generatedChildNodeIds` (maintained by the editor store).
 */

export const STUDIO_SOURCE_MODEL_NODE_ID_KEY = "sourceModelNodeId" as const;
export const STUDIO_GENERATED_CHILD_NODE_IDS_KEY = "generatedChildNodeIds" as const;

/** Optional metadata on flow nodes spawned from GLB extraction (Library **GLB** tab). */
export const STUDIO_GLB_EXTRACT_KIND_KEY = "glbExtractKind" as const;
export const STUDIO_GLB_EXTRACT_REF_KEY = "glbExtractRef" as const;

/** Catalog ids that auto-bind to a lone selected **Model** when added from the palette or canvas drop. */
export const STUDIO_CATALOG_IDS_SPAWN_LINKED_TO_MODEL: readonly string[] = ["model-viewer", "glb-animation-bundle"];

export function catalogEntrySpawnsLinkedToModel(catalogNodeId: string): boolean {
  return STUDIO_CATALOG_IDS_SPAWN_LINKED_TO_MODEL.includes(catalogNodeId);
}

type FlowEditorLikeForModelParent = {
  nodes: { id: string; data: { nodeId: string } }[];
  selectedNodeId: string | null;
  selectedNodeIds: string[];
};

/**
 * When exactly one node is selected and it is `model-select`, return its React Flow id.
 */
export function resolveSingleModelSelectParentId(
  state: FlowEditorLikeForModelParent,
): string | null {
  const ids =
    state.selectedNodeIds.length > 0
      ? state.selectedNodeIds
      : state.selectedNodeId != null
        ? [state.selectedNodeId]
        : [];
  if (ids.length !== 1) {
    return null;
  }
  const n = state.nodes.find((x) => x.id === ids[0]);
  if (n == null || n.data.nodeId !== "model-select") {
    return null;
  }
  return n.id;
}

export function readSourceModelNodeId(
  config: Record<string, unknown> | null | undefined,
): string | undefined {
  if (config == null) {
    return undefined;
  }
  const v = config[STUDIO_SOURCE_MODEL_NODE_ID_KEY];
  if (typeof v !== "string") {
    return undefined;
  }
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

/** Minimal flow node shape for resolving a linked **`model-select`** GLB URL. */
export type StudioModelUrlResolverNode = {
  id: string;
  data: { nodeId: string; defaultConfig: Record<string, unknown> };
};

/**
 * Resolve **`selectedModelUrl`** from the **`model-select`** node whose id is **`sourceModelNodeId`**.
 */
export function resolveStudioSourceModelGlbUrl(
  nodes: readonly StudioModelUrlResolverNode[],
  sourceModelNodeId: string | undefined | null,
): string | null {
  if (sourceModelNodeId == null || sourceModelNodeId.trim().length === 0) {
    return null;
  }
  const n = nodes.find((x) => x.id === sourceModelNodeId);
  if (n == null || n.data.nodeId !== "model-select") {
    return null;
  }
  const u = n.data.defaultConfig["selectedModelUrl"];
  return typeof u === "string" && u.trim().length > 0 ? u.trim() : null;
}

export function readGeneratedChildNodeIds(
  config: Record<string, unknown> | null | undefined,
): string[] {
  if (config == null) {
    return [];
  }
  const v = config[STUDIO_GENERATED_CHILD_NODE_IDS_KEY];
  if (!Array.isArray(v)) {
    return [];
  }
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

/**
 * When both kind and ref are set, the node was spawned from **Library → GLB** (extraction row).
 */
export function readGlbExtractTag(
  config: Record<string, unknown> | null | undefined,
): { kind: string; ref: string } | null {
  if (config == null) {
    return null;
  }
  const kindRaw = config[STUDIO_GLB_EXTRACT_KIND_KEY];
  const refRaw = config[STUDIO_GLB_EXTRACT_REF_KEY];
  if (typeof kindRaw !== "string" || kindRaw.trim().length === 0) {
    return null;
  }
  if (typeof refRaw !== "string" || refRaw.trim().length === 0) {
    return null;
  }
  return { kind: kindRaw.trim(), ref: refRaw.trim() };
}

function sameIdListOrder(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

type StudioLikeNode = {
  id: string;
  data: { nodeId: string; defaultConfig: Record<string, unknown> };
};

/**
 * Recompute each `model-select` node's `generatedChildNodeIds` from all nodes
 * that declare `sourceModelNodeId` pointing at that model. Preserves canvas order.
 */
export function reconcileStudioModelGeneratedChildIds<T extends StudioLikeNode>(nodes: T[]): T[] {
  const parentToChildren = new Map<string, string[]>();
  for (const n of nodes) {
    const pid = readSourceModelNodeId(n.data.defaultConfig);
    if (pid == null) {
      continue;
    }
    const list = parentToChildren.get(pid);
    if (list == null) {
      parentToChildren.set(pid, [n.id]);
    } else {
      list.push(n.id);
    }
  }

  let changed = false;
  const next = nodes.map((n) => {
    if (n.data.nodeId !== "model-select") {
      return n;
    }
    const computed = parentToChildren.get(n.id) ?? [];
    const prev = readGeneratedChildNodeIds(n.data.defaultConfig);
    if (sameIdListOrder(prev, computed)) {
      return n;
    }
    changed = true;
    return {
      ...n,
      data: {
        ...n.data,
        defaultConfig: {
          ...n.data.defaultConfig,
          [STUDIO_GENERATED_CHILD_NODE_IDS_KEY]: computed,
        },
      },
    };
  });
  return changed ? next : nodes;
}

/**
 * When duplicating a selection, remap `sourceModelNodeId` if the parent model node
 * was duplicated in the same operation so children stay attached to the new parent.
 */
export function remapSourceModelNodeIdAfterDuplicate<T extends StudioLikeNode>(
  nodes: T[],
  idMap: ReadonlyMap<string, string>,
): T[] {
  let changed = false;
  const next = nodes.map((nn) => {
    const pid = readSourceModelNodeId(nn.data.defaultConfig);
    if (pid == null || !idMap.has(pid)) {
      return nn;
    }
    const nextPid = idMap.get(pid);
    if (nextPid == null || nextPid === pid) {
      return nn;
    }
    changed = true;
    return {
      ...nn,
      data: {
        ...nn.data,
        defaultConfig: {
          ...nn.data.defaultConfig,
          [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: nextPid,
        },
      },
    };
  });
  return changed ? next : nodes;
}
