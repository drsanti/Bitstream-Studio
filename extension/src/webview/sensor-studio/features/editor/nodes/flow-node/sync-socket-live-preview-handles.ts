import type { StudioNodeData, StudioOutputHandleDef } from "../../store/flow-editor.store";
import {
  isStudioLiveReadingsInputNodeId,
  isStudioSensorTapNodeId,
  STUDIO_HANDLE_IN,
  studioFlowPinKey,
} from "../../store/flow-editor.store";
import type {
  LiveReadingStreamTone,
  LiveScalarReadingColorHints,
} from "./readings/live-reading-colors";
import {
  resolveInputScalarHintFromUpstream,
  type IncomingFlowEdge,
} from "./resolve-input-scalar-hints";
import type { StudioPortType } from "../port-accent";

/** Bundled wire types — no scalar/bool/string preview on the socket row. */
export const SOCKET_PREVIEW_STRUCTURED_PORT_TYPES = new Set<StudioPortType>([
  "environment",
  "camera",
  "glbAnimation",
  "transform",
  "fog",
  "studioLight",
  "postProcessing",
  "contactShadows",
  "particleEmitter",
  "event",
]);

export function isStructuredSocketPreviewPortType(portType: StudioPortType): boolean {
  return SOCKET_PREVIEW_STRUCTURED_PORT_TYPES.has(portType);
}

function narrowNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  return null;
}

function narrowVec3(v: unknown): { x: number; y: number; z: number } | null {
  if (v == null || typeof v !== "object" || !("x" in v)) {
    return null;
  }
  const o = v as { x: unknown; y: unknown; z: unknown };
  if (
    typeof o.x === "number" &&
    Number.isFinite(o.x) &&
    typeof o.y === "number" &&
    Number.isFinite(o.y) &&
    typeof o.z === "number" &&
    Number.isFinite(o.z)
  ) {
    return { x: o.x, y: o.y, z: o.z };
  }
  return null;
}

function narrowQuat(v: unknown): { w: number; x: number; y: number; z: number } | null {
  if (v == null || typeof v !== "object" || !("w" in v)) {
    return null;
  }
  const o = v as { w: unknown; x: unknown; y: unknown; z: unknown };
  if (
    typeof o.w === "number" &&
    Number.isFinite(o.w) &&
    typeof o.x === "number" &&
    Number.isFinite(o.x) &&
    typeof o.y === "number" &&
    Number.isFinite(o.y) &&
    typeof o.z === "number" &&
    Number.isFinite(o.z)
  ) {
    return { w: o.w, x: o.x, y: o.y, z: o.z };
  }
  return null;
}

function resolveOutputHandles(data: StudioNodeData): StudioOutputHandleDef[] {
  if (data.outputHandles != null && data.outputHandles.length > 0) {
    return data.outputHandles;
  }
  if (data.outputType != null) {
    return [{ id: "out", portType: data.outputType, label: "Out" }];
  }
  return [];
}

/** Populate per-handle live preview maps from evaluated pin values (Policy A — all dataflow nodes). */
export function syncSocketLivePreviewHandlesFromPinValues(args: {
  nodeId: string;
  flowNodeId: string;
  data: StudioNodeData;
  pinValues: Map<string, unknown>;
  base: StudioNodeData;
}): void {
  const { nodeId, flowNodeId, data, pinValues, base } = args;

  if (isStudioLiveReadingsInputNodeId(nodeId) || isStudioSensorTapNodeId(nodeId)) {
    return;
  }

  const handles = resolveOutputHandles(data);
  if (handles.length === 0) {
    return;
  }

  const numbers: Record<string, number> = {};
  const booleans: Record<string, boolean> = {};
  const strings: Record<string, string> = {};
  const vector3: Record<string, { x: number; y: number; z: number }> = {};

  for (const h of handles) {
    if (isStructuredSocketPreviewPortType(h.portType)) {
      continue;
    }
    const pin = pinValues.get(studioFlowPinKey(flowNodeId, h.id));
    if (h.portType === "number") {
      const n = narrowNumber(pin);
      if (n != null) {
        numbers[h.id] = n;
      }
    } else if (h.portType === "boolean") {
      if (typeof pin === "boolean") {
        booleans[h.id] = pin;
      }
    } else if (h.portType === "string") {
      if (typeof pin === "string") {
        strings[h.id] = pin;
      }
    } else if (h.portType === "vector3") {
      const v = narrowVec3(pin);
      if (v != null) {
        vector3[h.id] = v;
      }
    } else if (h.portType === "quaternion") {
      const q = narrowQuat(pin);
      if (q != null && h.id === "out") {
        base.liveQuaternionWire = q;
      }
    }
  }

  if (Object.keys(numbers).length > 0) {
    base.liveNumberByHandle = numbers;
  }
  if (Object.keys(booleans).length > 0) {
    base.liveBooleanByHandle = booleans;
  }
  if (Object.keys(strings).length > 0) {
    base.liveStringByHandle = strings;
  }
  if (Object.keys(vector3).length > 0) {
    base.liveVector3ByHandle = vector3;
  }
}

function resolveInputHandles(data: StudioNodeData): StudioOutputHandleDef[] {
  if (data.inputHandles != null && data.inputHandles.length > 0) {
    return data.inputHandles;
  }
  if (data.inputType != null) {
    return [{ id: STUDIO_HANDLE_IN, portType: data.inputType, label: "In" }];
  }
  return [];
}

/** Populate per-handle live preview maps from wired incoming values (Policy A — input pins). */
export function syncSocketLivePreviewInputHandlesFromIncoming(args: {
  nodeId: string;
  flowNodeId: string;
  readIncoming: (handleId: string) => unknown;
  data: StudioNodeData;
  base: StudioNodeData;
  incomingByTarget?: Map<string, IncomingFlowEdge[]>;
  nodeById?: Map<string, { id: string; type?: string; data: StudioNodeData }>;
}): void {
  const { nodeId, flowNodeId, readIncoming, data, base, incomingByTarget, nodeById } = args;

  if (isStudioLiveReadingsInputNodeId(nodeId) || isStudioSensorTapNodeId(nodeId)) {
    return;
  }

  const handles = resolveInputHandles(data);
  if (handles.length === 0) {
    return;
  }

  const numbers: Record<string, number> = {};
  const booleans: Record<string, boolean> = {};
  const strings: Record<string, string> = {};
  const vector3: Record<string, { x: number; y: number; z: number }> = {};
  const scalarHints: Record<string, LiveScalarReadingColorHints & { streamMode: LiveReadingStreamTone }> =
    {};

  for (const h of handles) {
    if (isStructuredSocketPreviewPortType(h.portType)) {
      continue;
    }
    let incoming = readIncoming(h.id);
    if (
      nodeId === "model-viewer" &&
      h.id === STUDIO_HANDLE_IN &&
      h.portType === "string" &&
      (typeof incoming !== "string" || incoming.trim().length === 0)
    ) {
      incoming = typeof base.liveValue === "string" ? base.liveValue : incoming;
    }
    if (h.portType === "number") {
      const n = narrowNumber(incoming);
      if (n != null) {
        numbers[h.id] = n;
      }
      if (incomingByTarget != null && nodeById != null) {
        const hint = resolveInputScalarHintFromUpstream({
          targetFlowId: flowNodeId,
          targetHandle: h.id,
          incomingByTarget,
          nodeById,
        });
        if (hint != null) {
          scalarHints[h.id] = hint;
        }
      }
    } else if (h.portType === "boolean") {
      if (typeof incoming === "boolean") {
        booleans[h.id] = incoming;
      }
    } else if (h.portType === "string") {
      if (typeof incoming === "string" && incoming.trim().length > 0) {
        strings[h.id] = incoming.trim();
      }
    } else if (h.portType === "vector3") {
      const v = narrowVec3(incoming);
      if (v != null) {
        vector3[h.id] = v;
      }
    }
  }

  if (Object.keys(numbers).length > 0) {
    base.liveInputNumberByHandle = numbers;
  }
  if (Object.keys(booleans).length > 0) {
    base.liveInputBooleanByHandle = booleans;
  }
  if (Object.keys(strings).length > 0) {
    base.liveInputStringByHandle = strings;
  }
  if (Object.keys(vector3).length > 0) {
    base.liveInputVector3ByHandle = vector3;
  }
  if (Object.keys(scalarHints).length > 0) {
    base.liveInputScalarHintsByHandle = scalarHints;
  }
}
