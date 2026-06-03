import type { Edge } from "@xyflow/react";
import type {
  FlowCanvasEdgeRoutingStyle,
  FlowCanvasPreferences,
} from "../../../persistence/flow-canvas-preferences";
import { FLOW_CANVAS_EDGE_ROUTING_TO_REACT_FLOW } from "../../../persistence/flow-canvas-preferences";
import type { FlowGraphNode, StudioPortType } from "../store/flow-editor.store";
import { applyEdgeBundleOffsets } from "./flow-edge-bundle-offset";
import { applyEdgeBusLaneOffsets } from "./flow-edge-bus-lane-offset";
import { applyParallelEdgeOffsets } from "./flow-edge-parallel-offset";
import { buildFlowEdgeMarkerEnd } from "./flow-edge-markers";
import { formatFlowPortTypeLabel } from "./flow-edge-port-label";
import {
  resolveFlowEdgeSourceHealth,
  type FlowEdgeHealthTone,
} from "./flow-edge-source-health";
import { edgeSelectionAdjustments } from "./flow-edge-selection-style";

export { buildFlowNodeIdMap } from "./flow-edge-source-health";

export type FlowPortThemeColors = {
  numberColor: string;
  booleanColor: string;
  stringColor: string;
  eventColor: string;
  vector3Color: string;
  quaternionColor: string;
  environmentColor: string;
  cameraColor: string;
  glbAnimationColor: string;
  transformColor: string;
  fogColor: string;
  studioLightColor: string;
  postProcessingColor: string;
  contactShadowsColor: string;
  particleEmitterColor: string;
  audioBusColor: string;
  physicsSceneColor: string;
  physicsColliderColor: string;
  physicsBodyColor: string;
};

export type FlowEdgeDecorPrefs = Pick<
  FlowCanvasPreferences,
  | "edgeRoutingStyle"
  | "edgeStrokeWidth"
  | "edgeAnimated"
  | "edgeIdleOpacity"
  | "dimUnrelatedEdgesOnSelection"
  | "smoothStepBorderRadius"
  | "edgeShowMarkers"
  | "edgeMarkerSize"
  | "edgeMarkerHideBelowZoom"
  | "edgeShowTypeLabel"
  | "edgeSelectionHighlight"
  | "liveEdgeHighlight"
  | "staleEdgeDash"
  | "edgeParallelSpacing"
  | "edgeBundleMode"
  | "edgeBundleSpacing"
  | "edgeBusLaneSpacing"
  | "edgeBusLaneSort"
  | "edgeInteractionWidth"
  | "edgeStepLaneHop"
>;

const STEP_LANE_HOP_RADIUS_BOOST = 4;

export type FlowEdgeDecorContext = {
  selectedNodeIds: ReadonlySet<string>;
  viewportZoom: number;
  hoveredEdgeId: string | null;
  nodeById: ReadonlyMap<string, FlowGraphNode>;
  /** Downstream path highlight from edge context menu. */
  highlightedPathEdgeIds?: ReadonlySet<string>;
};

export const FLOW_EDGE_FALLBACK_STROKE = "rgb(113 113 122)";

const DIMMED_OPACITY_CAP = 0.42;

export function buildFlowPortColorMap(colors: FlowPortThemeColors): Record<StudioPortType, string> {
  return {
    number: colors.numberColor,
    boolean: colors.booleanColor,
    string: colors.stringColor,
    event: colors.eventColor,
    vector3: colors.vector3Color,
    quaternion: colors.quaternionColor,
    environment: colors.environmentColor,
    camera: colors.cameraColor,
    glbAnimation: colors.glbAnimationColor,
    transform: colors.transformColor,
    fog: colors.fogColor,
    studioLight: colors.studioLightColor,
    postProcessing: colors.postProcessingColor,
    contactShadows: colors.contactShadowsColor,
    particleEmitter: colors.particleEmitterColor,
    audioBus: colors.audioBusColor,
    physicsScene: colors.physicsSceneColor,
    physicsCollider: colors.physicsColliderColor,
    physicsBody: colors.physicsBodyColor,
  };
}

export function strokeForPortType(
  colorByType: Record<string, string>,
  portType: StudioPortType | null | undefined,
): string {
  if (portType == null) {
    return FLOW_EDGE_FALLBACK_STROKE;
  }
  return colorByType[portType] ?? FLOW_EDGE_FALLBACK_STROKE;
}

function edgeTouchesSelection(edge: Edge, selectedNodeIds: ReadonlySet<string>): boolean {
  if (selectedNodeIds.size === 0) {
    return false;
  }
  return (
    (edge.source != null && selectedNodeIds.has(edge.source)) ||
    (edge.target != null && selectedNodeIds.has(edge.target))
  );
}

export function resolveFlowEdgeOpacity(
  edge: Edge,
  prefs: Pick<FlowEdgeDecorPrefs, "edgeIdleOpacity" | "dimUnrelatedEdgesOnSelection">,
  context: FlowEdgeDecorContext | undefined,
): number {
  const idle = prefs.edgeIdleOpacity;
  const selected = context?.selectedNodeIds;
  if (
    prefs.dimUnrelatedEdgesOnSelection &&
    selected != null &&
    selected.size > 0
  ) {
    if (edgeTouchesSelection(edge, selected)) {
      return 1;
    }
    return Math.min(idle, DIMMED_OPACITY_CAP);
  }
  return idle;
}

function healthStrokeAdjustments(
  health: FlowEdgeHealthTone,
  prefs: Pick<FlowEdgeDecorPrefs, "liveEdgeHighlight" | "staleEdgeDash">,
): { strokeDasharray?: string; filter?: string; strokeWidthBoost?: number } {
  if (health === "live" && prefs.liveEdgeHighlight) {
    return {
      filter: "drop-shadow(0 0 4px rgba(52, 211, 153, 0.45))",
      strokeWidthBoost: 0.5,
    };
  }
  if ((health === "stale" || health === "offline") && prefs.staleEdgeDash) {
    return { strokeDasharray: "6 4" };
  }
  return {};
}

export function shouldShowEdgeTypeLabel(
  edge: Edge,
  prefs: Pick<FlowEdgeDecorPrefs, "edgeShowTypeLabel">,
  hoveredEdgeId: string | null,
): boolean {
  if (prefs.edgeShowTypeLabel === "always") {
    return true;
  }
  if (prefs.edgeShowTypeLabel === "hover") {
    return hoveredEdgeId === edge.id;
  }
  if (prefs.edgeShowTypeLabel === "selected") {
    return edge.selected === true;
  }
  return false;
}

function mergeStrokeFilters(...filters: Array<string | undefined>): string | undefined {
  const parts = filters.filter((f) => f != null && f.length > 0);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

function pathOptionsForRouting(
  edgeRoutingStyle: FlowCanvasEdgeRoutingStyle,
  smoothStepBorderRadius: number,
  parallelOffset: number | undefined,
  stepLaneHop: boolean,
): { borderRadius: number; offset: number } | undefined {
  if (edgeRoutingStyle === "smoothstep" || edgeRoutingStyle === "step") {
    const hopBoost =
      stepLaneHop && parallelOffset != null && parallelOffset !== 0
        ? STEP_LANE_HOP_RADIUS_BOOST
        : 0;
    return {
      borderRadius: smoothStepBorderRadius + hopBoost,
      offset: parallelOffset ?? 0,
    };
  }
  if (
    edgeRoutingStyle === "bezier" &&
    parallelOffset != null &&
    parallelOffset !== 0
  ) {
    return { borderRadius: 0, offset: parallelOffset };
  }
  return undefined;
}

export function decorateFlowEdges(
  edges: Edge[],
  colorByType: Record<string, string>,
  prefs: FlowEdgeDecorPrefs,
  context?: FlowEdgeDecorContext,
): Edge[] {
  const rfType = FLOW_CANVAS_EDGE_ROUTING_TO_REACT_FLOW[prefs.edgeRoutingStyle];
  const nodeById = context?.nodeById;
  let layoutEdges = applyEdgeBundleOffsets(
    applyParallelEdgeOffsets(edges, prefs.edgeParallelSpacing),
    prefs.edgeBundleMode,
    prefs.edgeBundleSpacing,
  );
  if (nodeById != null && prefs.edgeBusLaneSpacing > 0) {
    layoutEdges = applyEdgeBusLaneOffsets(
      layoutEdges,
      nodeById,
      prefs.edgeBusLaneSpacing,
      prefs.edgeBusLaneSort,
    );
  }
  const spacedEdges = layoutEdges;
  const zoom = context?.viewportZoom ?? 1;
  const showMarkers =
    prefs.edgeShowMarkers && zoom >= prefs.edgeMarkerHideBelowZoom;
  const hoveredEdgeId = context?.hoveredEdgeId ?? null;
  const highlightedPathEdgeIds = context?.highlightedPathEdgeIds;

  return spacedEdges.map((edge) => {
    const portType = typeof edge.label === "string" ? edge.label : "";
    const stroke = strokeForPortType(colorByType, portType as StudioPortType);
    const opacity = resolveFlowEdgeOpacity(edge, prefs, context);
    const health =
      nodeById != null ? resolveFlowEdgeSourceHealth(edge, nodeById) : null;
    const healthStyle = healthStrokeAdjustments(health, prefs);
    const isEdgeSelected = edge.selected === true;
    const selectionStyle = isEdgeSelected
      ? edgeSelectionAdjustments(stroke, prefs.edgeSelectionHighlight)
      : null;
    const strokeWidth =
      prefs.edgeStrokeWidth +
      (healthStyle.strokeWidthBoost ?? 0) +
      (selectionStyle?.strokeWidthBoost ?? 0);
    const showLabel = shouldShowEdgeTypeLabel(edge, prefs, hoveredEdgeId);
    const strokeFilter = mergeStrokeFilters(healthStyle.filter, selectionStyle?.filter);
    const parallelOffset =
      typeof edge.pathOptions?.offset === "number" ? edge.pathOptions.offset : undefined;
    const pathOptions = pathOptionsForRouting(
      prefs.edgeRoutingStyle,
      prefs.smoothStepBorderRadius,
      parallelOffset,
      prefs.edgeStepLaneHop,
    );

    return {
      ...edge,
      type: rfType,
      interactionWidth: prefs.edgeInteractionWidth,
      animated: prefs.edgeAnimated,
      ...(pathOptions != null ? { pathOptions } : {}),
      ...(showMarkers ? { markerEnd: buildFlowEdgeMarkerEnd(stroke, prefs.edgeMarkerSize) } : {}),
      label: showLabel ? formatFlowPortTypeLabel(portType) : undefined,
      ...(showLabel
        ? {
            labelShowBg: true,
            labelBgPadding: [5, 3] as [number, number],
            labelBgBorderRadius: 4,
            labelBgStyle: { fill: "rgb(9 9 11 / 0.88)" },
          }
        : { labelShowBg: false }),
      style: {
        ...(edge.style ?? {}),
        stroke,
        strokeWidth,
        opacity: isEdgeSelected ? 1 : opacity,
        ...(healthStyle.strokeDasharray != null
          ? { strokeDasharray: healthStyle.strokeDasharray }
          : {}),
        ...(strokeFilter != null ? { filter: strokeFilter } : {}),
      },
      ...(showLabel
        ? {
            labelStyle: {
              fill: stroke,
              fontSize: 10,
              fontWeight: 600,
            },
          }
        : {}),
      className: [
        edge.className,
        health === "live" && prefs.liveEdgeHighlight ? "studio-flow-edge--live" : "",
        highlightedPathEdgeIds?.has(edge.id) ? "studio-flow-edge--path-highlight" : "",
        isEdgeSelected ? "studio-flow-edge--selected" : "",
      ]
        .filter(Boolean)
        .join(" "),
    };
  });
}
