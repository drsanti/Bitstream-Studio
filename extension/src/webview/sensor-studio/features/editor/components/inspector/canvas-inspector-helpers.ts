import { resolveStudioNodeSourceId } from "../../../../core/device/resolve-studio-node-source-id";
import type { SensorHealthStatus, StudioNode } from "../../store/flow-editor.store";
import type { FlowCanvasEdgeRoutingStyle } from "../flow-canvas-ui-persistence";

export const CANVAS_GRID_SIZE_OPTIONS: { value: string; label: string }[] = [
  { value: "12", label: "12 px" },
  { value: "16", label: "16 px" },
  { value: "20", label: "20 px" },
  { value: "24", label: "24 px" },
  { value: "32", label: "32 px" },
];

export const CANVAS_EDGE_ROUTING_OPTIONS: {
  value: FlowCanvasEdgeRoutingStyle;
  label: string;
}[] = [
  { value: "bezier", label: "Bezier (curved)" },
  { value: "smoothstep", label: "Smooth step" },
  { value: "step", label: "Step" },
  { value: "straight", label: "Straight" },
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
