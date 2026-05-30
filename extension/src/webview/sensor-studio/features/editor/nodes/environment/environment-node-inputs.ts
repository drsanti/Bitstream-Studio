import type { Edge } from "@xyflow/react";

import type { StudioOutputHandleDef } from "../../store/flow-editor.store";
import type { StudioPortType } from "../../store/flow-editor.store";
import {
  coerceFlowWireEnvironmentV1,
  flowWireEnvironmentFromNodeDefaultConfig,
  type FlowWireEnvironmentV1,
} from "./flow-wire-environment";

/** Modulated inputs on the **Environment** node (catalog + runtime `inputHandles` filter). */
export const ENVIRONMENT_INPUT_HANDLE_DEFS: readonly {
  id: string;
  portType: StudioPortType;
  label: string;
}[] = [
  { id: "useCubemapIbl", portType: "boolean", label: "Use IBL" },
  { id: "showBackgroundTexture", portType: "boolean", label: "Background texture" },
  { id: "iblStrength", portType: "number", label: "IBL strength" },
  { id: "iblOffStrengthFrac", portType: "number", label: "IBL off strength" },
  { id: "yawDeg", portType: "number", label: "Environment yaw (°)" },
] as const;

export type EnvironmentInputSocketVisibility = Partial<
  Record<(typeof ENVIRONMENT_INPUT_HANDLE_DEFS)[number]["id"], boolean>
>;

export function readEnvironmentInputSocketVisibility(
  dc: Record<string, unknown>,
): EnvironmentInputSocketVisibility {
  const raw = dc.inputSocketVisibility;
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const o = raw as Record<string, unknown>;
  const out: EnvironmentInputSocketVisibility = {};
  for (const def of ENVIRONMENT_INPUT_HANDLE_DEFS) {
    const v = o[def.id];
    if (v === true) {
      out[def.id] = true;
    }
  }
  return out;
}

/** Build persisted `inputSocketVisibility` after toggling one pin (`true` = shown on node). */
export function buildNextEnvironmentInputSocketVisibility(
  vis: EnvironmentInputSocketVisibility,
  handleId: string,
  visible: boolean,
): Record<string, boolean> {
  const next: Record<string, boolean> = {};
  for (const def of ENVIRONMENT_INPUT_HANDLE_DEFS) {
    const on = def.id === handleId ? visible : vis[def.id] === true;
    if (on) {
      next[def.id] = true;
    }
  }
  return next;
}

/** When an edge targets a modulation handle, that handle must stay visible. */
export function mergeEnvironmentVisibilityWithIncomingEdges(
  nodeId: string,
  visibility: EnvironmentInputSocketVisibility,
  edges: readonly Edge[] | undefined,
): EnvironmentInputSocketVisibility {
  if (edges == null || edges.length === 0) {
    return { ...visibility };
  }
  const next: EnvironmentInputSocketVisibility = { ...visibility };
  const ids = new Set(ENVIRONMENT_INPUT_HANDLE_DEFS.map((d) => d.id));
  for (const e of edges) {
    if (e.target !== nodeId) {
      continue;
    }
    const h = e.targetHandle ?? "in";
    if (ids.has(h)) {
      next[h as keyof EnvironmentInputSocketVisibility] = true;
    }
  }
  return next;
}

export function computeEnvironmentInputHandles(
  visibility: EnvironmentInputSocketVisibility,
): StudioOutputHandleDef[] {
  return ENVIRONMENT_INPUT_HANDLE_DEFS.filter((d) => visibility[d.id] === true).map((d) => ({
    id: d.id,
    portType: d.portType,
    label: d.label,
  }));
}

const ENV_INPUT_ID_SET = new Set(ENVIRONMENT_INPUT_HANDLE_DEFS.map((d) => d.id));

export function environmentNodeHasIncomingOnHandle(
  edges: readonly Edge[] | undefined,
  nodeId: string,
  handleId: string,
): boolean {
  if (edges == null || edges.length === 0) {
    return false;
  }
  for (const e of edges) {
    if (e.target === nodeId && (e.targetHandle ?? "in") === handleId) {
      return true;
    }
  }
  return false;
}

/** True when the socket is shown and has an incoming edge. */
export function environmentModulationHandleIsWired(
  edges: readonly Edge[] | undefined,
  nodeId: string,
  handleId: string,
  visibility: EnvironmentInputSocketVisibility,
): boolean {
  if (visibility[handleId] !== true) {
    return false;
  }
  return environmentNodeHasIncomingOnHandle(edges, nodeId, handleId);
}

export function canHideEnvironmentInputSocket(
  edges: readonly Edge[] | undefined,
  nodeId: string,
  handleId: string,
): boolean {
  return !environmentNodeHasIncomingOnHandle(edges, nodeId, handleId);
}

export function isEnvironmentInputSocketId(handleId: string): boolean {
  return ENV_INPUT_ID_SET.has(handleId);
}

/**
 * Build the environment wire for simulation: start from node `defaultConfig`, then overlay
 * any **wired** modulation handles that are **visible** in `inputSocketVisibility`.
 */
export function computeAggregatedEnvironmentWire(
  nodeId: string,
  defaultConfig: Record<string, unknown>,
  edges: readonly Edge[],
  readIncoming: (targetId: string, targetHandle: string) => unknown | null,
): FlowWireEnvironmentV1 {
  let wire = flowWireEnvironmentFromNodeDefaultConfig(defaultConfig);
  const vis = readEnvironmentInputSocketVisibility(defaultConfig);

  const mergeBool = (handleId: string, key: "useCubemapIbl" | "showBackgroundTexture") => {
    if (vis[handleId] !== true) {
      return;
    }
    if (!environmentNodeHasIncomingOnHandle(edges, nodeId, handleId)) {
      return;
    }
    const v = readIncoming(nodeId, handleId);
    if (typeof v === "boolean") {
      wire = { ...wire, [key]: v };
    } else if (typeof v === "number" && Number.isFinite(v)) {
      wire = { ...wire, [key]: v !== 0 };
    }
  };

  const mergeNum = (handleId: string, key: "iblStrength" | "iblOffStrengthFrac" | "yawDeg") => {
    if (vis[handleId] !== true) {
      return;
    }
    if (!environmentNodeHasIncomingOnHandle(edges, nodeId, handleId)) {
      return;
    }
    const v = readIncoming(nodeId, handleId);
    if (typeof v === "number" && Number.isFinite(v)) {
      wire = { ...wire, [key]: v };
    }
  };

  mergeBool("useCubemapIbl", "useCubemapIbl");
  mergeBool("showBackgroundTexture", "showBackgroundTexture");
  mergeNum("iblStrength", "iblStrength");
  mergeNum("iblOffStrengthFrac", "iblOffStrengthFrac");
  mergeNum("yawDeg", "yawDeg");

  return coerceFlowWireEnvironmentV1(wire);
}
