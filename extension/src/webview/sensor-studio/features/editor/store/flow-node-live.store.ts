import { create } from "zustand";
import type { FlowGraphNode } from "./flow-editor.store";
import {
  extractStudioNodeLiveSlice,
  isStudioNodeLiveSliceEqual,
  type StudioNodeLiveSlice,
} from "./studio-node-live.slice";

type FlowNodeLiveStore = {
  tickRevision: number;
  byNodeId: Readonly<Record<string, StudioNodeLiveSlice>>;
  applyTickPatches: (patches: ReadonlyMap<string, StudioNodeLiveSlice>) => boolean;
  hydrateFromGraphNodes: (nodes: readonly FlowGraphNode[]) => void;
  removeNode: (nodeId: string) => void;
  resetAll: () => void;
};

function applyLivePatchesToRecord(
  current: Readonly<Record<string, StudioNodeLiveSlice>>,
  patches: ReadonlyMap<string, StudioNodeLiveSlice>,
): { next: Record<string, StudioNodeLiveSlice>; changed: boolean } {
  if (patches.size === 0) {
    return { next: current as Record<string, StudioNodeLiveSlice>, changed: false };
  }
  let changed = false;
  const next: Record<string, StudioNodeLiveSlice> = { ...current };
  for (const [nodeId, patch] of patches) {
    const prev = next[nodeId];
    if (isStudioNodeLiveSliceEqual(prev, patch)) {
      continue;
    }
    changed = true;
    next[nodeId] = patch;
  }
  return { next, changed };
}

export const useFlowNodeLiveStore = create<FlowNodeLiveStore>((set, get) => ({
  tickRevision: 0,
  byNodeId: {},
  applyTickPatches: (patches) => {
    const { next, changed } = applyLivePatchesToRecord(get().byNodeId, patches);
    if (!changed) {
      return false;
    }
    set((state) => ({
      byNodeId: next,
      tickRevision: state.tickRevision + 1,
    }));
    return true;
  },
  hydrateFromGraphNodes: (nodes) => {
    const byNodeId: Record<string, StudioNodeLiveSlice> = {};
    for (const node of nodes) {
      if (node.type !== "studio") {
        continue;
      }
      const slice = extractStudioNodeLiveSlice(node.data);
      if (Object.keys(slice).length > 0) {
        byNodeId[node.id] = slice;
      }
    }
    set({ byNodeId, tickRevision: 0 });
  },
  removeNode: (nodeId) =>
    set((state) => {
      if (state.byNodeId[nodeId] == null) {
        return state;
      }
      const next = { ...state.byNodeId };
      delete next[nodeId];
      return { byNodeId: next, tickRevision: state.tickRevision + 1 };
    }),
  resetAll: () => set({ byNodeId: {}, tickRevision: 0 }),
}));

export function readFlowNodeLiveSlice(nodeId: string): StudioNodeLiveSlice | undefined {
  return useFlowNodeLiveStore.getState().byNodeId[nodeId];
}

export function mergeFlowGraphNodesWithLive(
  nodes: readonly FlowGraphNode[],
  liveByNodeId: Readonly<Record<string, StudioNodeLiveSlice>> = useFlowNodeLiveStore.getState()
    .byNodeId,
): FlowGraphNode[] {
  return nodes.map((node) => {
    if (node.type !== "studio") {
      return node;
    }
    const live = liveByNodeId[node.id];
    if (live == null) {
      return node;
    }
    return {
      ...node,
      data: {
        ...node.data,
        ...live,
      },
    };
  });
}
