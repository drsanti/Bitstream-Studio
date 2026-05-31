/** Flow canvas chrome — serializable for flow JSON and localStorage. */

export type FlowCanvasGridSize = 12 | 16 | 20 | 24 | 32;

/** React Flow built-in edge path styles (mapped in FlowCanvas). */
export type FlowCanvasEdgeRoutingStyle =
  | "bezier"
  | "smoothstep"
  | "step"
  | "straight";

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
};

export const DEFAULT_FLOW_CANVAS_PREFERENCES: FlowCanvasPreferences = {
  snapToGrid: false,
  gridSize: 16,
  showGrid: true,
  showMinimap: false,
  backgroundHex: null,
  autoFitViewOnReplace: true,
  edgeRoutingStyle: "bezier",
};

const GRID_SIZES = new Set<number>([12, 16, 20, 24, 32]);

const EDGE_ROUTING_STYLES = new Set<string>(["bezier", "smoothstep", "step", "straight"]);

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
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
  return merged;
}
