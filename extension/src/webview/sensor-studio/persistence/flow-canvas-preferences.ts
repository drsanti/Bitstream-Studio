/** Flow canvas chrome — serializable for flow JSON and localStorage. */

export type FlowCanvasGridSize = 12 | 16 | 20 | 24 | 32;

/** React Flow built-in edge path styles (mapped in FlowCanvas). */
export type FlowCanvasEdgeRoutingStyle =
  | "bezier"
  | "smoothstep"
  | "step"
  | "straight";

export type FlowCanvasEdgeStrokeWidth = 1.5 | 2 | 2.5;

export type FlowCanvasEdgeMarkerSize = "small" | "medium";

export type FlowCanvasEdgeTypeLabelMode = "never" | "hover" | "always" | "selected";

export type FlowCanvasEdgeSelectionHighlight = "subtle" | "normal" | "strong";

export type FlowCanvasHandleSizePx = 10 | 12 | 14;

export type FlowCanvasHandleBorderWidthPx = 1 | 2;

/** Fan bundled wires from shared sources/targets (orthogonal path offset). */
export type FlowCanvasEdgeBundleMode = "off" | "fanOut" | "fanIn" | "both";

/** Target sort axis for bus-lane fan-out (LR layout → vertical, TB → horizontal). */
export type FlowCanvasEdgeBusLaneSort = "vertical" | "horizontal";

export type FlowCanvasInteractionMode = "select" | "pan";

export type FlowCanvasNodeSelectionRingWidthPx = 1 | 2 | 3;

export type FlowCanvasPreferences = {
  snapToGrid: boolean;
  gridSize: FlowCanvasGridSize;
  showGrid: boolean;
  showMinimap: boolean;
  /** `null` = use Sensor Studio theme canvas color. */
  backgroundHex: string | null;
  /** Fit view after demo template or JSON import without a saved viewport. */
  autoFitViewOnReplace: boolean;
  edgeRoutingStyle: FlowCanvasEdgeRoutingStyle;
  /** Left-drag on empty pane: marquee select vs pan viewport. */
  interactionMode: FlowCanvasInteractionMode;
  /** Wire stroke width (px). */
  edgeStrokeWidth: FlowCanvasEdgeStrokeWidth;
  /** Animated dash along wires. */
  edgeAnimated: boolean;
  /** Opacity for wires not highlighted by selection (0.25–1). */
  edgeIdleOpacity: number;
  /** Draw selected wires above nodes. */
  elevateEdgesOnSelect: boolean;
  /** Thicker / brighter stroke on wire hover. */
  edgeHoverHighlight: boolean;
  /** Fade wires that do not touch the current node selection. */
  dimUnrelatedEdgesOnSelection: boolean;
  /** Corner radius for smoothstep / step paths (px). */
  smoothStepBorderRadius: number;
  /** Preview wire width while dragging a connection (px). */
  connectionLineStrokeWidth: number;
  /** Snap distance when dropping a connection on a handle (px). */
  connectionRadius: number;
  /** Direction arrows at wire targets (hidden when zoomed out). */
  edgeShowMarkers: boolean;
  edgeMarkerSize: FlowCanvasEdgeMarkerSize;
  /** Hide markers when viewport zoom is below this value (0.3–1). */
  edgeMarkerHideBelowZoom: number;
  edgeShowTypeLabel: FlowCanvasEdgeTypeLabelMode;
  /** Visual weight for selected wires (port-tinted glow). */
  edgeSelectionHighlight: FlowCanvasEdgeSelectionHighlight;
  /** Brighter stroke when the source node has live sensor health. */
  liveEdgeHighlight: boolean;
  /** Dashed stroke when the source node is stale or offline. */
  staleEdgeDash: boolean;
  handleSizePx: FlowCanvasHandleSizePx;
  handleBorderWidthPx: FlowCanvasHandleBorderWidthPx;
  /** Lower opacity on handles with no connected wire. */
  handleDimWhenUnwired: boolean;
  /** Opacity for unwired handles when {@link handleDimWhenUnwired} is true (0.15–0.85). */
  handleUnwiredDimOpacity: number;
  /** Fan parallel wires between the same node pair (0 = off, px spacing). */
  edgeParallelSpacing: number;
  /** Bundle fan-out / fan-in from shared sockets (orthogonal offset). */
  edgeBundleMode: FlowCanvasEdgeBundleMode;
  /** Per-wire offset spacing when bundling is enabled (0 = off). */
  edgeBundleSpacing: number;
  /** Ordered fan-out lanes from shared outputs after layout (0 = off). */
  edgeBusLaneSpacing: number;
  edgeBusLaneSort: FlowCanvasEdgeBusLaneSort;
  /** Easier wire picking (React Flow interaction path width). */
  edgeInteractionWidth: number;
  /** Extra corner radius on offset step/smooth wires (visual hop, not true overlap bridge). */
  edgeStepLaneHop: boolean;
  /** Cyan ring overlay on selected flow nodes (catalog, notes, groups). */
  showNodeSelectionRing: boolean;
  /** React Flow marquee rectangle while drag-selecting on the canvas. */
  showMarqueeSelectionRect: boolean;
  /** `#RRGGBB` stroke for the per-node selection ring. */
  nodeSelectionRingHex: string;
  nodeSelectionRingOpacity: number;
  nodeSelectionRingWidthPx: FlowCanvasNodeSelectionRingWidthPx;
  /** `#RRGGBB` stroke/fill for the marquee selection rectangle. */
  marqueeSelectionHex: string;
  marqueeSelectionOpacity: number;
};

export const DEFAULT_FLOW_CANVAS_PREFERENCES: FlowCanvasPreferences = {
  snapToGrid: false,
  gridSize: 16,
  showGrid: true,
  showMinimap: false,
  backgroundHex: null,
  autoFitViewOnReplace: true,
  edgeRoutingStyle: "bezier",
  interactionMode: "select",
  edgeStrokeWidth: 2,
  edgeAnimated: true,
  edgeIdleOpacity: 1,
  elevateEdgesOnSelect: true,
  edgeHoverHighlight: true,
  dimUnrelatedEdgesOnSelection: false,
  smoothStepBorderRadius: 8,
  connectionLineStrokeWidth: 2,
  connectionRadius: 28,
  edgeShowMarkers: false,
  edgeMarkerSize: "small",
  edgeMarkerHideBelowZoom: 0.55,
  edgeShowTypeLabel: "never",
  edgeSelectionHighlight: "normal",
  liveEdgeHighlight: false,
  staleEdgeDash: false,
  handleSizePx: 12,
  handleBorderWidthPx: 2,
  handleDimWhenUnwired: false,
  handleUnwiredDimOpacity: 0.38,
  edgeParallelSpacing: 0,
  edgeBundleMode: "off",
  edgeBundleSpacing: 12,
  edgeBusLaneSpacing: 0,
  edgeBusLaneSort: "vertical",
  edgeInteractionWidth: 20,
  edgeStepLaneHop: false,
  showNodeSelectionRing: true,
  showMarqueeSelectionRect: false,
  nodeSelectionRingHex: "#32fafa",
  nodeSelectionRingOpacity: 0.4,
  nodeSelectionRingWidthPx: 2,
  marqueeSelectionHex: "#3b82f6",
  marqueeSelectionOpacity: 0.28,
};

const GRID_SIZES = new Set<number>([12, 16, 20, 24, 32]);

const EDGE_ROUTING_STYLES = new Set<string>(["bezier", "smoothstep", "step", "straight"]);
const INTERACTION_MODES = new Set<string>(["select", "pan"]);
const EDGE_STROKE_WIDTHS = new Set<number>([1.5, 2, 2.5]);
const EDGE_MARKER_SIZES = new Set<string>(["small", "medium"]);
const EDGE_TYPE_LABEL_MODES = new Set<string>(["never", "hover", "always", "selected"]);
const EDGE_SELECTION_HIGHLIGHT = new Set<string>(["subtle", "normal", "strong"]);
const HANDLE_SIZE_PX = new Set<number>([10, 12, 14]);
const HANDLE_BORDER_PX = new Set<number>([1, 2]);
const EDGE_BUNDLE_MODES = new Set<string>(["off", "fanOut", "fanIn", "both"]);
const EDGE_BUS_LANE_SORT = new Set<string>(["vertical", "horizontal"]);
const NODE_SELECTION_RING_WIDTH_PX = new Set<number>([1, 2, 3]);

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

export function coerceFiniteInRange(
  raw: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, n));
}

function coerceEdgeStrokeWidth(raw: unknown): FlowCanvasEdgeStrokeWidth {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (EDGE_STROKE_WIDTHS.has(n)) {
    return n as FlowCanvasEdgeStrokeWidth;
  }
  return DEFAULT_FLOW_CANVAS_PREFERENCES.edgeStrokeWidth;
}

/** Map preference id → React Flow edge `type` string. */
export const FLOW_CANVAS_EDGE_ROUTING_TO_REACT_FLOW: Record<
  FlowCanvasEdgeRoutingStyle,
  string
> = {
  bezier: "default",
  smoothstep: "smoothstep",
  step: "step",
  straight: "straight",
};

export function coerceFlowCanvasPreferences(raw: unknown): FlowCanvasPreferences {
  if (raw == null || typeof raw !== "object") {
    return { ...DEFAULT_FLOW_CANVAS_PREFERENCES };
  }
  const o = raw as Record<string, unknown>;
  const gridRaw = o.gridSize;
  const gridSize =
    typeof gridRaw === "number" && GRID_SIZES.has(gridRaw)
      ? (gridRaw as FlowCanvasGridSize)
      : DEFAULT_FLOW_CANVAS_PREFERENCES.gridSize;
  const edgeRaw = o.edgeRoutingStyle;
  const edgeRoutingStyle =
    typeof edgeRaw === "string" && EDGE_ROUTING_STYLES.has(edgeRaw)
      ? (edgeRaw as FlowCanvasEdgeRoutingStyle)
      : DEFAULT_FLOW_CANVAS_PREFERENCES.edgeRoutingStyle;
  return {
    snapToGrid: o.snapToGrid === true,
    gridSize,
    showGrid: o.showGrid !== false,
    showMinimap: o.showMinimap === true,
    backgroundHex:
      o.backgroundHex === null
        ? null
        : isHexColor(o.backgroundHex)
          ? o.backgroundHex
          : DEFAULT_FLOW_CANVAS_PREFERENCES.backgroundHex,
    autoFitViewOnReplace: o.autoFitViewOnReplace !== false,
    edgeRoutingStyle,
    interactionMode:
      typeof o.interactionMode === "string" && INTERACTION_MODES.has(o.interactionMode)
        ? (o.interactionMode as FlowCanvasInteractionMode)
        : DEFAULT_FLOW_CANVAS_PREFERENCES.interactionMode,
    edgeStrokeWidth: coerceEdgeStrokeWidth(o.edgeStrokeWidth),
    edgeAnimated: o.edgeAnimated !== false,
    edgeIdleOpacity: coerceFiniteInRange(o.edgeIdleOpacity, 1, 0.25, 1),
    elevateEdgesOnSelect: o.elevateEdgesOnSelect !== false,
    edgeHoverHighlight: o.edgeHoverHighlight !== false,
    dimUnrelatedEdgesOnSelection: o.dimUnrelatedEdgesOnSelection === true,
    smoothStepBorderRadius: Math.round(
      coerceFiniteInRange(o.smoothStepBorderRadius, 8, 0, 24),
    ),
    connectionLineStrokeWidth: coerceFiniteInRange(o.connectionLineStrokeWidth, 2, 1, 4),
    connectionRadius: Math.round(coerceFiniteInRange(o.connectionRadius, 28, 8, 56)),
    edgeShowMarkers: o.edgeShowMarkers === true,
    edgeMarkerSize:
      typeof o.edgeMarkerSize === "string" && EDGE_MARKER_SIZES.has(o.edgeMarkerSize)
        ? (o.edgeMarkerSize as FlowCanvasEdgeMarkerSize)
        : DEFAULT_FLOW_CANVAS_PREFERENCES.edgeMarkerSize,
    edgeMarkerHideBelowZoom: coerceFiniteInRange(o.edgeMarkerHideBelowZoom, 0.55, 0.3, 1),
    edgeShowTypeLabel:
      typeof o.edgeShowTypeLabel === "string" && EDGE_TYPE_LABEL_MODES.has(o.edgeShowTypeLabel)
        ? (o.edgeShowTypeLabel as FlowCanvasEdgeTypeLabelMode)
        : DEFAULT_FLOW_CANVAS_PREFERENCES.edgeShowTypeLabel,
    edgeSelectionHighlight:
      typeof o.edgeSelectionHighlight === "string" &&
      EDGE_SELECTION_HIGHLIGHT.has(o.edgeSelectionHighlight)
        ? (o.edgeSelectionHighlight as FlowCanvasEdgeSelectionHighlight)
        : DEFAULT_FLOW_CANVAS_PREFERENCES.edgeSelectionHighlight,
    liveEdgeHighlight: o.liveEdgeHighlight === true,
    staleEdgeDash: o.staleEdgeDash === true,
    handleSizePx:
      typeof o.handleSizePx === "number" && HANDLE_SIZE_PX.has(o.handleSizePx)
        ? (o.handleSizePx as FlowCanvasHandleSizePx)
        : DEFAULT_FLOW_CANVAS_PREFERENCES.handleSizePx,
    handleBorderWidthPx:
      typeof o.handleBorderWidthPx === "number" && HANDLE_BORDER_PX.has(o.handleBorderWidthPx)
        ? (o.handleBorderWidthPx as FlowCanvasHandleBorderWidthPx)
        : DEFAULT_FLOW_CANVAS_PREFERENCES.handleBorderWidthPx,
    handleDimWhenUnwired: o.handleDimWhenUnwired === true,
    handleUnwiredDimOpacity: coerceFiniteInRange(
      o.handleUnwiredDimOpacity,
      DEFAULT_FLOW_CANVAS_PREFERENCES.handleUnwiredDimOpacity,
      0.15,
      0.85,
    ),
    edgeParallelSpacing: Math.round(
      coerceFiniteInRange(o.edgeParallelSpacing, 0, 0, 32),
    ),
    edgeBundleMode:
      typeof o.edgeBundleMode === "string" && EDGE_BUNDLE_MODES.has(o.edgeBundleMode)
        ? (o.edgeBundleMode as FlowCanvasEdgeBundleMode)
        : DEFAULT_FLOW_CANVAS_PREFERENCES.edgeBundleMode,
    edgeBundleSpacing: Math.round(
      coerceFiniteInRange(o.edgeBundleSpacing, 12, 0, 32),
    ),
    edgeBusLaneSpacing: Math.round(
      coerceFiniteInRange(o.edgeBusLaneSpacing, 0, 0, 32),
    ),
    edgeBusLaneSort:
      typeof o.edgeBusLaneSort === "string" && EDGE_BUS_LANE_SORT.has(o.edgeBusLaneSort)
        ? (o.edgeBusLaneSort as FlowCanvasEdgeBusLaneSort)
        : DEFAULT_FLOW_CANVAS_PREFERENCES.edgeBusLaneSort,
    edgeInteractionWidth: Math.round(
      coerceFiniteInRange(o.edgeInteractionWidth, 20, 8, 40),
    ),
    edgeStepLaneHop: o.edgeStepLaneHop === true,
    showNodeSelectionRing: o.showNodeSelectionRing !== false,
    showMarqueeSelectionRect: o.showMarqueeSelectionRect === true,
    nodeSelectionRingHex: isHexColor(o.nodeSelectionRingHex)
      ? o.nodeSelectionRingHex
      : DEFAULT_FLOW_CANVAS_PREFERENCES.nodeSelectionRingHex,
    nodeSelectionRingOpacity: coerceFiniteInRange(
      o.nodeSelectionRingOpacity,
      DEFAULT_FLOW_CANVAS_PREFERENCES.nodeSelectionRingOpacity,
      0.15,
      1,
    ),
    nodeSelectionRingWidthPx:
      typeof o.nodeSelectionRingWidthPx === "number" &&
      NODE_SELECTION_RING_WIDTH_PX.has(o.nodeSelectionRingWidthPx)
        ? (o.nodeSelectionRingWidthPx as FlowCanvasNodeSelectionRingWidthPx)
        : DEFAULT_FLOW_CANVAS_PREFERENCES.nodeSelectionRingWidthPx,
    marqueeSelectionHex: isHexColor(o.marqueeSelectionHex)
      ? o.marqueeSelectionHex
      : DEFAULT_FLOW_CANVAS_PREFERENCES.marqueeSelectionHex,
    marqueeSelectionOpacity: coerceFiniteInRange(
      o.marqueeSelectionOpacity,
      DEFAULT_FLOW_CANVAS_PREFERENCES.marqueeSelectionOpacity,
      0.1,
      1,
    ),
  };
}

export function mergeFlowCanvasPreferences(
  prev: FlowCanvasPreferences,
  patch: Partial<FlowCanvasPreferences>,
): FlowCanvasPreferences {
  const merged = { ...prev, ...patch };
  if (patch.gridSize != null && !GRID_SIZES.has(patch.gridSize)) {
    merged.gridSize = prev.gridSize;
  }
  if (
    patch.backgroundHex !== undefined &&
    patch.backgroundHex !== null &&
    !isHexColor(patch.backgroundHex)
  ) {
    merged.backgroundHex = prev.backgroundHex;
  }
  if (
    patch.edgeRoutingStyle != null &&
    !EDGE_ROUTING_STYLES.has(patch.edgeRoutingStyle)
  ) {
    merged.edgeRoutingStyle = prev.edgeRoutingStyle;
  }
  if (
    patch.interactionMode != null &&
    !INTERACTION_MODES.has(patch.interactionMode)
  ) {
    merged.interactionMode = prev.interactionMode;
  }
  if (patch.edgeStrokeWidth != null) {
    merged.edgeStrokeWidth = coerceEdgeStrokeWidth(patch.edgeStrokeWidth);
  }
  if (patch.edgeIdleOpacity != null) {
    merged.edgeIdleOpacity = coerceFiniteInRange(patch.edgeIdleOpacity, prev.edgeIdleOpacity, 0.25, 1);
  }
  if (patch.smoothStepBorderRadius != null) {
    merged.smoothStepBorderRadius = Math.round(
      coerceFiniteInRange(patch.smoothStepBorderRadius, prev.smoothStepBorderRadius, 0, 24),
    );
  }
  if (patch.connectionLineStrokeWidth != null) {
    merged.connectionLineStrokeWidth = coerceFiniteInRange(
      patch.connectionLineStrokeWidth,
      prev.connectionLineStrokeWidth,
      1,
      4,
    );
  }
  if (patch.connectionRadius != null) {
    merged.connectionRadius = Math.round(
      coerceFiniteInRange(patch.connectionRadius, prev.connectionRadius, 8, 56),
    );
  }
  if (patch.edgeMarkerSize != null && !EDGE_MARKER_SIZES.has(patch.edgeMarkerSize)) {
    merged.edgeMarkerSize = prev.edgeMarkerSize;
  }
  if (patch.edgeShowTypeLabel != null && !EDGE_TYPE_LABEL_MODES.has(patch.edgeShowTypeLabel)) {
    merged.edgeShowTypeLabel = prev.edgeShowTypeLabel;
  }
  if (
    patch.edgeSelectionHighlight != null &&
    !EDGE_SELECTION_HIGHLIGHT.has(patch.edgeSelectionHighlight)
  ) {
    merged.edgeSelectionHighlight = prev.edgeSelectionHighlight;
  }
  if (patch.edgeMarkerHideBelowZoom != null) {
    merged.edgeMarkerHideBelowZoom = coerceFiniteInRange(
      patch.edgeMarkerHideBelowZoom,
      prev.edgeMarkerHideBelowZoom,
      0.3,
      1,
    );
  }
  if (patch.handleSizePx != null && !HANDLE_SIZE_PX.has(patch.handleSizePx)) {
    merged.handleSizePx = prev.handleSizePx;
  }
  if (patch.handleBorderWidthPx != null && !HANDLE_BORDER_PX.has(patch.handleBorderWidthPx)) {
    merged.handleBorderWidthPx = prev.handleBorderWidthPx;
  }
  if (patch.edgeParallelSpacing != null) {
    merged.edgeParallelSpacing = Math.round(
      coerceFiniteInRange(patch.edgeParallelSpacing, prev.edgeParallelSpacing, 0, 32),
    );
  }
  if (patch.edgeBundleMode != null && !EDGE_BUNDLE_MODES.has(patch.edgeBundleMode)) {
    merged.edgeBundleMode = prev.edgeBundleMode;
  }
  if (patch.edgeBundleSpacing != null) {
    merged.edgeBundleSpacing = Math.round(
      coerceFiniteInRange(patch.edgeBundleSpacing, prev.edgeBundleSpacing, 0, 32),
    );
  }
  if (patch.edgeBusLaneSpacing != null) {
    merged.edgeBusLaneSpacing = Math.round(
      coerceFiniteInRange(patch.edgeBusLaneSpacing, prev.edgeBusLaneSpacing, 0, 32),
    );
  }
  if (patch.edgeBusLaneSort != null && !EDGE_BUS_LANE_SORT.has(patch.edgeBusLaneSort)) {
    merged.edgeBusLaneSort = prev.edgeBusLaneSort;
  }
  if (patch.edgeInteractionWidth != null) {
    merged.edgeInteractionWidth = Math.round(
      coerceFiniteInRange(patch.edgeInteractionWidth, prev.edgeInteractionWidth, 8, 40),
    );
  }
  if (
    patch.nodeSelectionRingHex !== undefined &&
    patch.nodeSelectionRingHex !== null &&
    !isHexColor(patch.nodeSelectionRingHex)
  ) {
    merged.nodeSelectionRingHex = prev.nodeSelectionRingHex;
  }
  if (patch.nodeSelectionRingOpacity != null) {
    merged.nodeSelectionRingOpacity = coerceFiniteInRange(
      patch.nodeSelectionRingOpacity,
      prev.nodeSelectionRingOpacity,
      0.15,
      1,
    );
  }
  if (
    patch.nodeSelectionRingWidthPx != null &&
    !NODE_SELECTION_RING_WIDTH_PX.has(patch.nodeSelectionRingWidthPx)
  ) {
    merged.nodeSelectionRingWidthPx = prev.nodeSelectionRingWidthPx;
  }
  if (
    patch.marqueeSelectionHex !== undefined &&
    patch.marqueeSelectionHex !== null &&
    !isHexColor(patch.marqueeSelectionHex)
  ) {
    merged.marqueeSelectionHex = prev.marqueeSelectionHex;
  }
  if (patch.marqueeSelectionOpacity != null) {
    merged.marqueeSelectionOpacity = coerceFiniteInRange(
      patch.marqueeSelectionOpacity,
      prev.marqueeSelectionOpacity,
      0.1,
      1,
    );
  }
  return merged;
}
