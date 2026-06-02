import { resolveStudioNodeSourceId } from "../../../../core/device/resolve-studio-node-source-id";
import type { LucideIcon } from "lucide-react";
import { ChartSpline, CornerDownRight, Minus, Route } from "lucide-react";
import type { SensorHealthStatus, StudioNode } from "../../store/flow-editor.store";
import type { FlowCanvasEdgeRoutingStyle, FlowCanvasGridSize } from "../flow-canvas-ui-persistence";

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
