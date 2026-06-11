import type { Viewport } from "@xyflow/react";
import { Activity, Cable, FileStack, LayoutGrid, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { TRNInspectorContextBar } from "../../../../../ui/TRN";
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
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] leading-none ${toneClass}`}
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
    CANVAS_DEMO_TEMPLATE_OPTIONS.find((o) => o.id === templateId)?.label ?? "Custom";
  const parts = [
    `${nodeCount} nodes · ${edgeCount} edges`,
    templateLabel,
    `${undoDepth} undo`,
  ];
  if (selectionCount > 0) {
    parts.push(`${selectionCount} selected`);
  }
  return {
    title: "Flow",
    subtitle: parts.join(" · "),
    Icon: FileStack,
    iconShellClass: "border-emerald-500/30 bg-emerald-950/25 text-emerald-300/95",
  };
}

function buildSensorsContext(health: CanvasSensorHealthSummary): TabContextModel {
  const { linked, live, stale, offline, sim } = health;
  const trailing =
    live > 0 || stale > 0 || offline > 0 ? (
      <span className="flex shrink-0 flex-wrap justify-end gap-1">
        <HealthPill label="live" count={live} toneClass="border-emerald-500/35 bg-emerald-950/30 text-emerald-200/90" />
        <HealthPill label="stale" count={stale} toneClass="border-amber-500/35 bg-amber-950/30 text-amber-200/90" />
        <HealthPill label="off" count={offline} toneClass="border-zinc-600/50 bg-zinc-900/50 text-zinc-300/90" />
      </span>
    ) : null;

  return {
    title: "Sensors",
    subtitle:
      linked === 0
        ? "No hardware-linked sensor nodes on canvas"
        : `${linked} hardware-linked · ${sim} sim`,
    Icon: Activity,
    iconShellClass: "border-cyan-500/30 bg-cyan-950/25 text-cyan-300/95",
    trailing,
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
    <TRNInspectorContextBar
      title={title}
      subtitle={subtitle}
      icon={Icon}
      iconShellClass={iconShellClass}
      trailing={trailing}
    />
  );
}
