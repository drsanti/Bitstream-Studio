import type { Edge, Viewport } from "@xyflow/react";
import {
  Expand,
  Focus,
  GitBranch,
  Import,
  LayoutGrid,
  MousePointerClick,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useMemo } from "react";
import { useBitstreamTransportActions } from "../../../../../bitstream-app/context/bitstreamTransportActions.context";
import { BitstreamSensorSampleRxBadge } from "../../../../../bitstream-shell/ui/BitstreamTelemetryRxBadges";
import { TRNButton, TRNSelect } from "../../../../../ui/TRN";
import { resolveStudioNodeSourceId } from "../../../../core/device/resolve-studio-node-source-id";
import type { StudioDemoTemplateId, StudioNode } from "../../store/flow-editor.store";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { CANVAS_DEMO_TEMPLATE_OPTIONS } from "./canvas-inspector-demo-templates";
import { InspectorPropertyRow } from "./InspectorPropertyRow";
import { InspectorSection } from "./InspectorSection";

export type CanvasInspectorPanelProps = {
  nodes: StudioNode[];
  edges: Edge[];
  orderedSelectedNodes: StudioNode[];
  flowViewport?: Viewport | null;
  templateId: StudioDemoTemplateId;
  onTemplateIdChange: (templateId: StudioDemoTemplateId) => void;
  onRunTemplate: () => void;
  onFitView?: () => void;
  onRestoreFlowViewport?: () => void;
  onSelectAllNodes?: () => void;
  onClearCanvasSelection?: () => void;
  onClearCanvas: () => void;
  onExportFlow: () => void;
  onImportFlowPick: () => void;
  onOpenDeviceSensorSettings?: (initialSourceId: number | null) => void;
  onResetWorkspaceLayout?: () => void;
};

function formatZoomPercent(zoom: number | undefined): string {
  if (zoom == null || !Number.isFinite(zoom)) {
    return "—";
  }
  return `${Math.round(zoom * 100)}%`;
}

function summarizeSensorHealth(nodes: StudioNode[]): {
  live: number;
  stale: number;
  offline: number;
  sim: number;
  linked: number;
} {
  let live = 0;
  let stale = 0;
  let offline = 0;
  let sim = 0;
  let linked = 0;
  for (const node of nodes) {
    if (resolveStudioNodeSourceId(node) != null) {
      linked += 1;
    }
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

function StatCell(props: { label: string; value: string | number }) {
  const { label, value } = props;
  return (
    <div className="min-w-0 rounded border border-zinc-800/70 bg-zinc-950/40 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="font-mono text-[12px] tabular-nums text-zinc-100/95">{value}</div>
    </div>
  );
}

export function CanvasInspectorPanel(props: CanvasInspectorPanelProps) {
  const {
    nodes,
    edges,
    orderedSelectedNodes,
    flowViewport,
    templateId,
    onTemplateIdChange,
    onRunTemplate,
    onFitView,
    onRestoreFlowViewport,
    onSelectAllNodes,
    onClearCanvasSelection,
    onClearCanvas,
    onExportFlow,
    onImportFlowPick,
    onOpenDeviceSensorSettings,
    onResetWorkspaceLayout,
  } = props;

  const undoDepth = useFlowEditorStore((s) => s.undoStack.length);
  const { reconnectTelemetry } = useBitstreamTransportActions();

  const selectionCount = orderedSelectedNodes.length;
  const health = useMemo(() => summarizeSensorHealth(nodes), [nodes]);

  const templateOptions = useMemo(
    () =>
      CANVAS_DEMO_TEMPLATE_OPTIONS.map((o) => ({
        value: o.value,
        label: o.label,
      })),
    [],
  );

  const activeTemplateHint =
    CANVAS_DEMO_TEMPLATE_OPTIONS.find((o) => o.value === templateId)?.hint ?? "";

  const onClearGraphConfirmed = () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Clear the entire flow graph? This cannot be undone from the canvas.")
    ) {
      return;
    }
    onClearCanvas();
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-zinc-700/55 bg-zinc-950/45">
      <div className="shrink-0 border-b border-zinc-800/70 px-2.5 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-700/60 bg-zinc-900/70 text-sky-300/90"
            aria-hidden
          >
            <GitBranch className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px] font-semibold tracking-wide text-zinc-100/95">
              Canvas
            </div>
            <div className="truncate text-[10px] text-zinc-500">
              Flow graph — no node selected
            </div>
          </div>
        </div>
      </div>

      <div className="scrollbar-hide min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden px-2.5 pb-3 pt-2">
        <InspectorSection title="Overview" hint="Document and selection summary.">
          <div className="grid grid-cols-2 gap-1.5">
            <StatCell label="Nodes" value={nodes.length} />
            <StatCell label="Edges" value={edges.length} />
            <StatCell label="Selected" value={selectionCount} />
            <StatCell label="Undo steps" value={undoDepth} />
          </div>
          {health.linked > 0 ? (
            <p className="mt-2 text-[10px] leading-snug text-zinc-500">
              Hardware-linked nodes:{" "}
              <span className="font-mono text-zinc-300/90">{health.linked}</span>
              {health.live + health.stale + health.offline + health.sim > 0 ? (
                <>
                  {" "}
                  — live {health.live}, stale {health.stale}, offline {health.offline}, sim{" "}
                  {health.sim}
                </>
              ) : null}
            </p>
          ) : null}
        </InspectorSection>

        <InspectorSection title="Telemetry" hint="Bitstream / Simulator link and decode rate.">
          <BitstreamSensorSampleRxBadge
            variant="cardRow"
            chipMetric="aggregateFps"
            onReconnectTelemetry={reconnectTelemetry}
          />
          {onOpenDeviceSensorSettings != null ? (
            <div className="mt-2">
              <TRNButton
                size="compact"
                className="w-full"
                hint="Open shared device sensor settings (firmware scope)."
                onClick={() => onOpenDeviceSensorSettings(null)}
              >
                Device sensors…
              </TRNButton>
            </div>
          ) : null}
        </InspectorSection>

        <InspectorSection title="View" hint="Pan and zoom for the flow canvas.">
          <InspectorPropertyRow label="Zoom">
            <span className="font-mono text-[12px] tabular-nums text-zinc-200/95">
              {formatZoomPercent(flowViewport?.zoom)}
            </span>
          </InspectorPropertyRow>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <TRNButton
              size="compact"
              className="min-w-0 flex-1"
              prefixIcon={<Expand className="h-3 w-3" aria-hidden />}
              hint="Fit all nodes in view (Ctrl+Shift+F)."
              onClick={() => onFitView?.()}
            >
              Fit view
            </TRNButton>
            {onRestoreFlowViewport != null ? (
              <TRNButton
                size="compact"
                className="min-w-0 flex-1"
                prefixIcon={<RotateCcw className="h-3 w-3" aria-hidden />}
                hint="Restore the last saved pan/zoom from this flow document."
                onClick={() => onRestoreFlowViewport()}
              >
                Restore view
              </TRNButton>
            ) : null}
          </div>
        </InspectorSection>

        <InspectorSection title="Selection" hint="Multi-select helpers.">
          <div className="flex flex-wrap gap-1.5">
            <TRNButton
              size="compact"
              className="min-w-0 flex-1"
              prefixIcon={<Focus className="h-3 w-3" aria-hidden />}
              hint="Select every node on the canvas."
              onClick={() => onSelectAllNodes?.()}
            >
              Select all
            </TRNButton>
            <TRNButton
              size="compact"
              className="min-w-0 flex-1"
              prefixIcon={<MousePointerClick className="h-3 w-3" aria-hidden />}
              hint="Clear the current selection (Esc)."
              disabled={selectionCount === 0}
              onClick={() => onClearCanvasSelection?.()}
            >
              Clear sel.
            </TRNButton>
          </div>
        </InspectorSection>

        <InspectorSection
          title="Starter graph"
          hint="Replace the canvas with a built-in demo template."
        >
          <InspectorPropertyRow
            label="Template"
            description={activeTemplateHint.length > 0 ? activeTemplateHint : undefined}
          >
            <TRNSelect
              value={templateId}
              options={templateOptions}
              ariaLabel="Demo flow template"
              size="sm"
              onValueChange={(next) => onTemplateIdChange(next as StudioDemoTemplateId)}
            />
          </InspectorPropertyRow>
          <div className="mt-2">
            <TRNButton
              size="compact"
              className="w-full"
              hint="Replace nodes and edges with the chosen template."
              onClick={() => onRunTemplate()}
            >
              Run template
            </TRNButton>
          </div>
        </InspectorSection>

        <InspectorSection title="Flow document" hint="Import, export, or reset the graph.">
          <div className="flex flex-wrap gap-1.5">
            <TRNButton
              size="compact"
              className="min-w-0 flex-1"
              prefixIcon={<Import className="h-3 w-3" aria-hidden />}
              hint="Load nodes, edges, and viewport from a JSON file."
              onClick={onImportFlowPick}
            >
              Import JSON
            </TRNButton>
            <TRNButton
              size="compact"
              className="min-w-0 flex-1"
              hint="Download the current flow graph as JSON."
              onClick={onExportFlow}
            >
              Export JSON
            </TRNButton>
          </div>
          <div className="mt-2">
            <TRNButton
              size="compact"
              className="w-full border-rose-900/40 text-rose-100/90"
              prefixIcon={<Trash2 className="h-3 w-3" aria-hidden />}
              hint="Remove all nodes and edges from the canvas."
              onClick={onClearGraphConfirmed}
            >
              Clear graph
            </TRNButton>
          </div>
        </InspectorSection>

        {onResetWorkspaceLayout != null ? (
          <InspectorSection
            title="Workbench"
            hint="Reset library / flow / inspector pane sizes."
            collapsible
            defaultExpanded={false}
          >
            <TRNButton
              size="compact"
              className="w-full"
              prefixIcon={<LayoutGrid className="h-3 w-3" aria-hidden />}
              hint="Restore default workbench split layout."
              onClick={() => onResetWorkspaceLayout()}
            >
              Reset workspace layout
            </TRNButton>
          </InspectorSection>
        ) : null}
      </div>
    </div>
  );
}
