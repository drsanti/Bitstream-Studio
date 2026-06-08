import { resolveStudioNodeSourceId } from "../../../../core/device/resolve-studio-node-source-id";
import type { LucideIcon } from "lucide-react";
import { ChartSpline, CornerDownRight, Minus, Route } from "lucide-react";
import type { SensorHealthStatus, StudioNode } from "../../store/flow-editor.store";
import type {
  FlowCanvasEdgeBundleMode,
  FlowCanvasEdgeBusLaneSort,
  FlowCanvasEdgeSelectionHighlight,
  FlowCanvasEdgeMarkerSize,
  FlowCanvasEdgeRoutingStyle,
  FlowCanvasEdgeStrokeWidth,
  FlowCanvasEdgeTypeLabelMode,
  FlowCanvasGridSize,
  FlowCanvasHandleBorderWidthPx,
  FlowCanvasHandleSizePx,
  FlowCanvasNodeSelectionRingWidthPx,
} from "../flow-canvas-ui-persistence";

export const CANVAS_GRID_SIZE_OPTIONS: {
  value: FlowCanvasGridSize;
  label: string;
  hint: string;
}[] = [
  { value: 12, label: "12", hint: "Fine grid — 12 px snap and dot spacing." },
  { value: 16, label: "16", hint: "Default grid — 16 px snap and dot spacing." },
  { value: 20, label: "20", hint: "Medium grid — 20 px snap and dot spacing." },
  { value: 24, label: "24", hint: "Coarse grid — 24 px snap and dot spacing." },
  { value: 32, label: "32", hint: "Large grid — 32 px snap and dot spacing." },
];

export const CANVAS_EDGE_ROUTING_OPTIONS: {
  value: FlowCanvasEdgeRoutingStyle;
  label: string;
  Icon?: LucideIcon;
  hint: string;
}[] = [
  {
    value: "bezier",
    label: "Bezier",
    Icon: ChartSpline,
    hint: "Curved wires (default React Flow bezier paths).",
  },
  {
    value: "smoothstep",
    label: "Smooth",
    Icon: Route,
    hint: "Rounded corners with smooth horizontal/vertical segments.",
  },
  {
    value: "step",
    label: "Step",
    Icon: CornerDownRight,
    hint: "Orthogonal step paths with sharp corners.",
  },
  {
    value: "straight",
    label: "Straight",
    Icon: Minus,
    hint: "Direct straight lines between ports.",
  },
];

export const CANVAS_EDGE_TYPE_LABEL_OPTIONS: {
  value: FlowCanvasEdgeTypeLabelMode;
  label: string;
  hint: string;
}[] = [
  { value: "never", label: "Off", hint: "Hide port type badges on wires." },
  { value: "hover", label: "Hover", hint: "Badge while the pointer is over a wire." },
  { value: "selected", label: "Selected", hint: "Badge only on the selected wire." },
  { value: "always", label: "Always", hint: "Badge on every wire." },
];

export const CANVAS_EDGE_SELECTION_HIGHLIGHT_OPTIONS: {
  value: FlowCanvasEdgeSelectionHighlight;
  label: string;
  hint: string;
}[] = [
  { value: "subtle", label: "Subtle", hint: "Light port-colored glow on selected wires." },
  { value: "normal", label: "Normal", hint: "Clear port-colored glow (default)." },
  { value: "strong", label: "Strong", hint: "Thickest stroke and brightest glow." },
];

export const CANVAS_EDGE_MARKER_SIZE_OPTIONS: {
  value: FlowCanvasEdgeMarkerSize;
  label: string;
  hint: string;
}[] = [
  { value: "small", label: "Small", hint: "Compact direction arrow at wire end." },
  { value: "medium", label: "Med", hint: "Larger arrow for dense graphs." },
];

export const CANVAS_HANDLE_SIZE_OPTIONS: {
  value: FlowCanvasHandleSizePx;
  label: string;
  hint: string;
}[] = [
  { value: 10, label: "10", hint: "Compact socket hit target." },
  { value: 12, label: "12", hint: "Default socket size." },
  { value: 14, label: "14", hint: "Larger sockets for touch / precision." },
];

export const CANVAS_HANDLE_BORDER_OPTIONS: {
  value: FlowCanvasHandleBorderWidthPx;
  label: string;
  hint: string;
}[] = [
  { value: 1, label: "1 px", hint: "Thin socket ring." },
  { value: 2, label: "2 px", hint: "Default socket ring." },
];

export const CANVAS_EDGE_STROKE_WIDTH_OPTIONS: {
  value: FlowCanvasEdgeStrokeWidth;
  label: string;
  hint: string;
}[] = [
  { value: 1.5, label: "Thin", hint: "1.5 px stroke — lighter graph." },
  { value: 2, label: "Normal", hint: "2 px stroke (default)." },
  { value: 2.5, label: "Bold", hint: "2.5 px stroke — easier to see." },
];

export const CANVAS_EDGE_BUS_LANE_SORT_OPTIONS: {
  value: FlowCanvasEdgeBusLaneSort;
  label: string;
  hint: string;
}[] = [
  {
    value: "vertical",
    label: "Vertical",
    hint: "Sort fan-out by target Y — best after left-to-right auto-layout.",
  },
  {
    value: "horizontal",
    label: "Horizontal",
    hint: "Sort fan-out by target X — best after top-to-bottom auto-layout.",
  },
];

export const CANVAS_EDGE_BUNDLE_MODE_OPTIONS: {
  value: FlowCanvasEdgeBundleMode;
  label: string;
  hint: string;
}[] = [
  { value: "off", label: "Off", hint: "No trunk fan — wires share the same path." },
  {
    value: "fanOut",
    label: "Fan out",
    hint: "Separate wires that leave the same output socket.",
  },
  {
    value: "fanIn",
    label: "Fan in",
    hint: "Separate wires that land on the same input socket.",
  },
  {
    value: "both",
    label: "Both",
    hint: "Fan out from shared outputs and fan in to shared inputs.",
  },
];

export type CanvasSensorHealthSummary = {
  live: number;
  stale: number;
  offline: number;
  sim: number;
  linked: number;
};

export function formatCanvasZoomPercent(zoom: number | undefined): string {
  if (zoom == null || !Number.isFinite(zoom)) {
    return "—";
  }
  return `${Math.round(zoom * 100)}%`;
}

export function summarizeCanvasSensorHealth(nodes: StudioNode[]): CanvasSensorHealthSummary {
  let live = 0;
  let stale = 0;
  let offline = 0;
  let sim = 0;
  let linked = 0;
  for (const node of nodes) {
    if (resolveStudioNodeSourceId(node) == null) {
      continue;
    }
    linked += 1;
    const health = node.data.sensorHealth;
    if (health === "live") {
      live += 1;
    } else if (health === "stale") {
      stale += 1;
    } else if (health === "offline") {
      offline += 1;
    } else if (health === "sim") {
      sim += 1;
    }
  }
  return { live, stale, offline, sim, linked };
}

export function listHardwareLinkedFlowNodes(nodes: StudioNode[]): StudioNode[] {
  return nodes.filter((node) => resolveStudioNodeSourceId(node) != null);
}

export function healthStatusLabel(health: SensorHealthStatus | undefined): string {
  if (health === "live") {
    return "Live";
  }
  if (health === "stale") {
    return "Stale";
  }
  if (health === "offline") {
    return "Offline";
  }
  if (health === "sim") {
    return "Sim";
  }
  return "Idle";
}

export const CANVAS_NODE_SELECTION_RING_WIDTH_OPTIONS: {
  value: FlowCanvasNodeSelectionRingWidthPx;
  label: string;
  hint: string;
}[] = [
  { value: 1, label: "1", hint: "Thin selection ring." },
  { value: 2, label: "2", hint: "Default selection ring width." },
  { value: 3, label: "3", hint: "Bold selection ring." },
];

export function healthStatusToneClass(health: SensorHealthStatus | undefined): string {
  if (health === "live") {
    return "border-emerald-500/35 bg-emerald-950/35 text-emerald-200/95";
  }
  if (health === "sim") {
    return "border-violet-500/35 bg-violet-950/30 text-violet-200/95";
  }
  if (health === "stale") {
    return "border-amber-500/35 bg-amber-950/30 text-amber-100/95";
  }
  if (health === "offline") {
    return "border-zinc-600/50 bg-zinc-900/60 text-zinc-400";
  }
  return "border-zinc-700/55 bg-zinc-900/45 text-zinc-500";
}
