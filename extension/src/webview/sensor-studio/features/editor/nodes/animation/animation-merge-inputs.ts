import type { StudioOutputHandleDef } from "../../store/flow-editor.store";
import type { Edge } from "@xyflow/react";
import type { FlowGraphNode } from "../../store/flow-editor.store";

/** Config key — number of ordered `glbAnimation` inputs (2–8). */
export const ANIMATION_MERGE_INPUT_COUNT_KEY = "animationInputCount";

export const ANIMATION_MERGE_MIN_INPUTS = 2;
export const ANIMATION_MERGE_MAX_INPUTS = 8;
export const ANIMATION_MERGE_DEFAULT_INPUTS = 3;

/** Stable handle ids: `a`…`h` (legacy graphs use `a`/`b`/`c` for the first three). */
export const ANIMATION_MERGE_INPUT_HANDLE_IDS = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
] as const;

export type AnimationMergeInputHandleId = (typeof ANIMATION_MERGE_INPUT_HANDLE_IDS)[number];

export const ANIMATION_MERGE_OUTPUT_HANDLE: StudioOutputHandleDef = {
  id: "out",
  portType: "glbAnimation",
  label: "Out",
};

export function readAnimationMergeInputCount(defaultConfig: Record<string, unknown>): number {
  const raw = defaultConfig[ANIMATION_MERGE_INPUT_COUNT_KEY];
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) {
    return ANIMATION_MERGE_DEFAULT_INPUTS;
  }
  return Math.min(
    ANIMATION_MERGE_MAX_INPUTS,
    Math.max(ANIMATION_MERGE_MIN_INPUTS, Math.round(n)),
  );
}

export function animationMergeInputHandleId(index: number): AnimationMergeInputHandleId {
  const id = ANIMATION_MERGE_INPUT_HANDLE_IDS[index];
  if (id == null) {
    throw new RangeError(`animation merge input index out of range: ${index}`);
  }
  return id;
}

export function computeAnimationMergeInputHandles(
  defaultConfig: Record<string, unknown>,
): StudioOutputHandleDef[] {
  const count = readAnimationMergeInputCount(defaultConfig);
  return ANIMATION_MERGE_INPUT_HANDLE_IDS.slice(0, count).map((id, index) => ({
    id,
    portType: "glbAnimation",
    label: String(index + 1),
  }));
}

export function listAnimationMergeInputHandleIds(
  defaultConfig: Record<string, unknown>,
): AnimationMergeInputHandleId[] {
  const count = readAnimationMergeInputCount(defaultConfig);
  return [...ANIMATION_MERGE_INPUT_HANDLE_IDS.slice(0, count)];
}

export function isAnimationMergeInputHandleId(handleId: string): boolean {
  return (ANIMATION_MERGE_INPUT_HANDLE_IDS as readonly string[]).includes(handleId);
}

/** Drop edges wired to merge inputs that no longer exist after lowering `animationInputCount`. */
export function pruneAnimationMergeEdges(
  nodes: readonly FlowGraphNode[],
  edges: readonly Edge[],
): Edge[] {
  const allowedByTarget = new Map<string, Set<string>>();
  for (const node of nodes) {
    if (node.type !== "studio" || node.data.nodeId !== "animation-merge") {
      continue;
    }
    allowedByTarget.set(
      node.id,
      new Set(listAnimationMergeInputHandleIds(node.data.defaultConfig)),
    );
  }
  if (allowedByTarget.size === 0) {
    return [...edges];
  }
  return edges.filter((edge) => {
    const allowed = allowedByTarget.get(edge.target);
    if (allowed == null) {
      return true;
    }
    const targetHandle = edge.targetHandle ?? "";
    if (targetHandle.length === 0) {
      return true;
    }
    if (!isAnimationMergeInputHandleId(targetHandle)) {
      return true;
    }
    return allowed.has(targetHandle);
  });
}
