import type { Edge } from "@xyflow/react";
import type { FlowGraphNode, StudioOutputHandleDef } from "../../store/flow-editor.store";
import {
  ANIMATION_MERGE_DEFAULT_INPUTS,
  ANIMATION_MERGE_INPUT_COUNT_KEY,
  ANIMATION_MERGE_MAX_INPUTS,
  ANIMATION_MERGE_MIN_INPUTS,
  animationMergeInputHandleId,
  isAnimationMergeInputHandleId,
  readAnimationMergeInputCount,
} from "./animation-merge-inputs";

export const ANIMATION_MIX_WEIGHTS_KEY = "mixWeights";
export const ANIMATION_MIX_NORMALIZE_WEIGHTS_KEY = "normalizeWeights";

export const ANIMATION_MIX_OUTPUT_HANDLE: StudioOutputHandleDef = {
  id: "out",
  portType: "glbAnimation",
  label: "Out",
};

export function readAnimationMixInputCount(defaultConfig: Record<string, unknown>): number {
  return readAnimationMergeInputCount(defaultConfig);
}

export function animationMixWeightHandleId(index: number): string {
  return `w${animationMergeInputHandleId(index)}`;
}

export function isAnimationMixWeightHandleId(handleId: string): boolean {
  return /^w[a-h]$/.test(handleId);
}

export function listAnimationMixHandleIds(defaultConfig: Record<string, unknown>): string[] {
  const count = readAnimationMixInputCount(defaultConfig);
  const ids: string[] = [];
  for (let i = 0; i < count; i += 1) {
    ids.push(animationMergeInputHandleId(i));
    ids.push(animationMixWeightHandleId(i));
  }
  return ids;
}

export function defaultEqualMixWeights(count: number): number[] {
  const safe = Math.min(
    ANIMATION_MERGE_MAX_INPUTS,
    Math.max(ANIMATION_MERGE_MIN_INPUTS, Math.round(count)),
  );
  const each = 1 / safe;
  return Array.from({ length: safe }, () => each);
}

export function readMixWeights(
  defaultConfig: Record<string, unknown>,
  count: number,
): number[] {
  const raw = defaultConfig[ANIMATION_MIX_WEIGHTS_KEY];
  const base = defaultEqualMixWeights(count);
  if (!Array.isArray(raw)) {
    return base;
  }
  for (let i = 0; i < count; i += 1) {
    const v = raw[i];
    const n = typeof v === "number" ? v : Number(v);
    base[i] = Number.isFinite(n) ? Math.max(0, n) : base[i]!;
  }
  return base;
}

export function ensureMixWeightsForCount(
  defaultConfig: Record<string, unknown>,
  count: number,
): number[] {
  return readMixWeights(defaultConfig, count);
}

export function readNormalizeMixWeights(defaultConfig: Record<string, unknown>): boolean {
  return defaultConfig[ANIMATION_MIX_NORMALIZE_WEIGHTS_KEY] !== false;
}

export function computeAnimationMixInputHandles(
  defaultConfig: Record<string, unknown>,
): StudioOutputHandleDef[] {
  const count = readAnimationMixInputCount(defaultConfig);
  const handles: StudioOutputHandleDef[] = [];
  for (let i = 0; i < count; i += 1) {
    handles.push({
      id: animationMergeInputHandleId(i),
      portType: "glbAnimation",
      label: String(i + 1),
    });
    handles.push({
      id: animationMixWeightHandleId(i),
      portType: "number",
      label: `W${i + 1}`,
    });
  }
  return handles;
}

export function pruneAnimationMixEdges(
  nodes: readonly FlowGraphNode[],
  edges: readonly Edge[],
): Edge[] {
  const allowedByTarget = new Map<string, Set<string>>();
  for (const node of nodes) {
    if (node.type !== "studio" || node.data.nodeId !== "animation-mix") {
      continue;
    }
    allowedByTarget.set(node.id, new Set(listAnimationMixHandleIds(node.data.defaultConfig)));
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
    const isAnim = listAnimationMergeInputHandleIds({}).length; // noop - use regex
    if (!isAnimationMergeInputHandleId(targetHandle) && !isAnimationMixWeightHandleId(targetHandle)) {
      return true;
    }
    return allowed.has(targetHandle);
  });
}

export {
  ANIMATION_MERGE_INPUT_COUNT_KEY,
  ANIMATION_MERGE_MIN_INPUTS,
  ANIMATION_MERGE_MAX_INPUTS,
  ANIMATION_MERGE_DEFAULT_INPUTS,
};
