import type { Viewport } from "@xyflow/react";
import { Activity, Cable, FileStack, LayoutGrid, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import type { StudioDemoTemplateId } from "../../store/flow-editor.store";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import type { FlowCanvasPreferences } from "../flow-canvas-ui-persistence";
import { CANVAS_DEMO_TEMPLATE_OPTIONS } from "./canvas-inspector-demo-templates";
import {
  formatCanvasZoomPercent,
  type CanvasSensorHealthSummary,
} from "./canvas-inspector-helpers";
import type { CanvasInspectorTab } from "./canvas-inspector-ui-persistence";

export type CanvasInspectorContextBarProps = {
  activeTab: CanvasInspectorTab;
  nodeCount: number;
  edgeCount: number;
  selectionCount: number;
  health: CanvasSensorHealthSummary;
  flowViewport?: Viewport | null;
  flowCanvasPreferences?: FlowCanvasPreferences;
  templateId?: StudioDemoTemplateId;
};

function HealthPill(props: { label: string; count: number; toneClass: string }) {
  const { label, count, toneClass } = props;
  if (count <= 0) {
    return null;
  }
  return (
    <span
      className={twMerge(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] leading-none",
        toneClass,
      )}
    >
      <span className="opacity-80">{label}</span>
      <span>{count}</span>
    </span>
  );
}

type TabContextModel = {
  title: string;
  subtitle: string;
  Icon: LucideIcon;
  iconShellClass: string;
  trailing?: ReactNode;
};

function buildWiresContext(prefs: FlowCanvasPreferences | undefined): TabContextModel {
  const routing = prefs?.edgeRoutingStyle ?? "bezier";
  const motion = prefs?.edgeAnimated ? "flow on" : "flow off";
  const width = prefs?.edgeStrokeWidth ?? 2;
  return {
    title: "Wires",
    subtitle: `${routing} · ${width}px · ${motion}`,
    Icon: Cable,
    iconShellClass: "border-violet-500/30 bg-violet-950/25 text-violet-300/95",
  };
}

function buildViewContext(args: {
  selectionCount: number;
  flowViewport?: Viewport | null;
  flowCanvasPreferences?: FlowCanvasPreferences;
}): TabContextModel {
  const { selectionCount, flowViewport, flowCanvasPreferences } = args;
  const prefs = flowCanvasPreferences;
  const parts: string[] = [
    `${formatCanvasZoomPercent(flowViewport?.zoom)} zoom`,
    prefs?.snapToGrid ? "snap on" : "snap off",
  ];
  if (prefs?.showGrid) {
    parts.push(`${prefs.gridSize}px grid`);
  }
  if (selectionCount > 0) {
    parts.push(`${selectionCount} selected`);
  }

  return {
    title: "View",
    subtitle: parts.join(" · "),
    Icon: LayoutGrid,
    iconShellClass: "border-sky-500/25 bg-sky-950/25 text-sky-300/95",
    trailing:
      selectionCount > 0 ? (
        <span className="shrink-0 rounded-full border border-sky-500/30 bg-sky-950/30 px-1.5 py-0.5 text-[10px] text-sky-200/90">
          {selectionCount} sel
        </span>
      ) : null,
  };
}

function buildFlowContext(args: {
  nodeCount: number;
  edgeCount: number;
  selectionCount: number;
  undoDepth: number;
  templateId?: StudioDemoTemplateId;
}): TabContextModel {
  const { nodeCount, edgeCount, selectionCount, undoDepth, templateId } = args;
  const templateLabel =
    CANVAS_DEMO_TEMPLATE_OPTIONS.find((o) => o.value === templateId)?.label ??
    "Custom graph";

  const graphLine =
    selectionCount > 0
      ? `${nodeCount} nodes · ${edgeCount} edges · ${selectionCount} selected`
      : `${nodeCount} nodes · ${edgeCount} edges`;

  return {
    title: "Flow",
    subtitle: `${graphLine} · ${undoDepth} undo · ${templateLabel}`,
    Icon: FileStack,
    iconShellClass: "border-zinc-600/45 bg-zinc-900/55 text-zinc-300/95",
    trailing:
      selectionCount > 0 ? (
        <span className="shrink-0 rounded-full border border-zinc-600/45 bg-zinc-900/60 px-1.5 py-0.5 text-[10px] text-zinc-300/90">
          {selectionCount} sel
        </span>
      ) : null,
  };
}

function renderSensorHealthTrailing(health: CanvasSensorHealthSummary): ReactNode {
  if (health.linked <= 0) {
    return null;
  }

  const hasAnyHealth =
    health.live + health.stale + health.offline + health.sim > 0;

  if (!hasAnyHealth) {
    return (
      <span className="shrink-0 text-[10px] leading-none text-zinc-600">awaiting stream</span>
    );
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
      <HealthPill
        label="live"
        count={health.live}
        toneClass="border-emerald-500/35 bg-emerald-950/35 text-emerald-200/95"
      />
      <HealthPill
        label="sim"
        count={health.sim}
        toneClass="border-violet-500/35 bg-violet-950/30 text-violet-200/95"
      />
      <HealthPill
        label="stale"
        count={health.stale}
        toneClass="border-amber-500/35 bg-amber-950/30 text-amber-100/95"
      />
      <HealthPill
        label="offline"
        count={health.offline}
        toneClass="border-zinc-600/50 bg-zinc-900/60 text-zinc-400"
      />
    </div>
  );
}

function buildSensorsContext(health: CanvasSensorHealthSummary): TabContextModel {
  const subtitle =
    health.linked > 0
      ? `${health.linked} hardware-linked node${health.linked === 1 ? "" : "s"} on canvas`
      : "No hardware-linked sensor nodes on canvas";

  return {
    title: "Sensors",
    subtitle,
    Icon: Activity,
    iconShellClass: "border-emerald-500/30 bg-emerald-950/25 text-emerald-300/95",
    trailing: renderSensorHealthTrailing(health),
  };
}

function resolveTabContext(props: CanvasInspectorContextBarProps & { undoDepth: number }): TabContextModel {
  const {
    activeTab,
    nodeCount,
    edgeCount,
    selectionCount,
    health,
    flowViewport,
    flowCanvasPreferences,
    templateId,
    undoDepth,
  } = props;

  switch (activeTab) {
    case "document":
      return buildFlowContext({
        nodeCount,
        edgeCount,
        selectionCount,
        undoDepth,
        templateId,
      });
    case "telemetry":
      return buildSensorsContext(health);
    case "wires":
      return buildWiresContext(flowCanvasPreferences);
    case "canvas":
    default:
      return buildViewContext({
        selectionCount,
        flowViewport,
        flowCanvasPreferences,
      });
  }
}

export function CanvasInspectorContextBar(props: CanvasInspectorContextBarProps) {
  const undoDepth = useFlowEditorStore((s) => s.undoStack.length);
  const model = resolveTabContext({ ...props, undoDepth });
  const { title, subtitle, Icon, iconShellClass, trailing } = model;

  return (
    <div className="shrink-0 border-b border-zinc-800/70 px-2.5 py-2">
      <div className="flex min-w-0 items-start gap-2">
        <span
          className={twMerge(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
            iconShellClass,
          )}
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex min-w-0 items-baseline justify-between gap-2">
            <div className="truncate text-[11px] font-semibold tracking-wide text-zinc-100/95">
              {title}
            </div>
            {trailing}
          </div>
          <p className="truncate text-[10px] leading-snug text-zinc-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
