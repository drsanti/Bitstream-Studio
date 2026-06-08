import type { Edge } from "@xyflow/react";
import type { StudioAssetDescriptor } from "../../../asset-browser/studio-asset.types";
import type { StudioNodeData } from "../../store/flow-editor.store";
import { resolveMaterialWireSocketLabel } from "../material/mesh-material-config";
import { resolveMeshWireSocketLabel } from "../mesh/mesh-primitive-config";
import { resolveAnimationWireSocketBadgeText } from "./resolve-animation-wire-socket-label";
import {
  resolveCameraWireSocketLabel,
  resolveEnvironmentWireSocketLabel,
} from "./structured-socket-preview-label";

function serializeRecord(rec: Record<string, unknown> | undefined): string {
  if (rec == null || Object.keys(rec).length === 0) {
    return "";
  }
  return JSON.stringify(rec);
}

function resolveIncidentEdgeSignature(
  nodeFlowId: string,
  edges: readonly Edge[],
): string {
  return edges
    .filter((e) => e.source === nodeFlowId || e.target === nodeFlowId)
    .map(
      (e) =>
        `${e.source}:${e.sourceHandle ?? ""}->${e.target}:${e.targetHandle ?? ""}`,
    )
    .sort()
    .join("|");
}

function resolveStructuredSocketPreviewLabels(
  data: StudioNodeData,
  descriptors: readonly StudioAssetDescriptor[],
): string {
  const animLabel =
    data.liveAnimationWire != null
      ? resolveAnimationWireSocketBadgeText({
          wire: data.liveAnimationWire,
          catalogNodeId: data.nodeId,
        }).label
      : "";

  return [
    data.liveMaterialWire != null ? resolveMaterialWireSocketLabel(data.liveMaterialWire) : "",
    data.liveMeshWire != null ? resolveMeshWireSocketLabel(data.liveMeshWire) : "",
    animLabel,
    data.liveEnvironmentWire != null
      ? resolveEnvironmentWireSocketLabel(data.liveEnvironmentWire, descriptors)
      : "",
    data.liveCameraWire != null ? resolveCameraWireSocketLabel(data.liveCameraWire) : "",
  ].join("\0");
}

/**
 * Layout-only fingerprint for socket chrome — wiring + structured wire badges.
 * Excludes per-tick scalars (`liveValue`, `live*ByHandle`) so auto-fit does not
 * re-run on every simulation frame.
 */
export function resolveFlowNodeSocketPreviewLayoutKey(
  nodeFlowId: string,
  data: StudioNodeData,
  edges: readonly Edge[],
  descriptors: readonly StudioAssetDescriptor[] = [],
): string {
  return [
    resolveIncidentEdgeSignature(nodeFlowId, edges),
    resolveStructuredSocketPreviewLabels(data, descriptors),
  ].join("\0");
}

/**
 * Full socket preview fingerprint (layout + streaming scalars). Prefer
 * {@link resolveFlowNodeSocketPreviewLayoutKey} for measure/layout effect deps.
 */
export function resolveFlowNodeSocketPreviewChromeKey(
  nodeFlowId: string,
  data: StudioNodeData,
  edges: readonly Edge[],
  descriptors: readonly StudioAssetDescriptor[] = [],
): string {
  return [
    resolveFlowNodeSocketPreviewLayoutKey(nodeFlowId, data, edges, descriptors),
    serializeRecord(data.liveInputNumberByHandle as Record<string, unknown> | undefined),
    serializeRecord(data.liveInputStringByHandle as Record<string, unknown> | undefined),
    serializeRecord(data.liveInputBooleanByHandle as Record<string, unknown> | undefined),
    serializeRecord(data.liveInputVector3ByHandle as Record<string, unknown> | undefined),
    serializeRecord(data.liveNumberByHandle as Record<string, unknown> | undefined),
    serializeRecord(data.liveStringByHandle as Record<string, unknown> | undefined),
    serializeRecord(data.liveVector3ByHandle as Record<string, unknown> | undefined),
    data.liveValue != null ? String(data.liveValue) : "",
  ].join("\0");
}
