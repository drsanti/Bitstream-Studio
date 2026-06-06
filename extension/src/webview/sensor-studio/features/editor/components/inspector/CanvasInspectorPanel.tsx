import type { Edge, Viewport } from "@xyflow/react";
import { Activity, Cable, FileStack, LayoutGrid, type LucideIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  TRNTabs,
  TRNTabsList,
  TRNTabsTrigger,
  TRN_INSPECTOR_TAB_BAR_WRAP_CLASS,
  TRN_INSPECTOR_TAB_LIST_CLASS,
  TRN_INSPECTOR_TAB_TRIGGER_CLASS,
  TRN_INSPECTOR_TAB_ACTIVE_CLASS,
} from "../../../../../ui/TRN";
import type {
  StudioDemoTemplateId,
  StudioNode,
} from "../../store/flow-editor.store";
import type { FlowCanvasPreferences } from "../flow-canvas-ui-persistence";
import type { StagePresentationPreferences } from "../../../stage/stage-presentation-preferences";
import { CanvasInspectorCanvasTab } from "./CanvasInspectorCanvasTab";
import { CanvasInspectorWiresTab } from "./CanvasInspectorWiresTab";
import { CanvasInspectorContextBar } from "./CanvasInspectorContextBar";
import { CanvasInspectorDocumentTab } from "./CanvasInspectorDocumentTab";
import { CanvasInspectorTelemetryTab } from "./CanvasInspectorTelemetryTab";
import { summarizeCanvasSensorHealth } from "./canvas-inspector-helpers";
import {
  readStoredCanvasInspectorTab,
  writeStoredCanvasInspectorTab,
  type CanvasInspectorTab,
} from "./canvas-inspector-ui-persistence";

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
  flowCanvasPreferences: FlowCanvasPreferences;
  themeCanvasBackgroundColor: string;
  onFlowCanvasPreferencesChange: (
    patch: Partial<FlowCanvasPreferences>,
  ) => void;
  stagePresentationPreferences: StagePresentationPreferences;
  onStagePresentationPreferencesChange: (
    patch: Partial<StagePresentationPreferences>,
  ) => void;
};

const CANVAS_INSPECTOR_TABS: readonly {
  id: CanvasInspectorTab;
  label: string;
  Icon: LucideIcon;
}[] = [
  { id: "canvas", label: "View", Icon: LayoutGrid },
  { id: "wires", label: "Wires", Icon: Cable },
  { id: "document", label: "Flow", Icon: FileStack },
  { id: "telemetry", label: "Sensors", Icon: Activity },
];

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
    flowCanvasPreferences,
    themeCanvasBackgroundColor,
    onFlowCanvasPreferencesChange,
    stagePresentationPreferences,
    onStagePresentationPreferencesChange,
  } = props;

  const [activeTab, setActiveTab] = useState<CanvasInspectorTab>(() =>
    readStoredCanvasInspectorTab(),
  );

  const setActiveTabPersisted = useCallback((next: CanvasInspectorTab) => {
    setActiveTab(next);
    writeStoredCanvasInspectorTab(next);
  }, []);

  const selectionCount = orderedSelectedNodes.length;
  const health = useMemo(() => summarizeCanvasSensorHealth(nodes), [nodes]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-zinc-700/55 bg-zinc-950/45">
      <div className="shrink-0 border-b border-zinc-800/70 px-2.5 py-2">
        <div className="text-[11px] font-semibold tracking-wide text-zinc-100/95">
          Flow canvas
        </div>
        <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">
          Whole-graph grid, wires, and flow document. Per-node card layout is under Node tab
          (Socket rows, Body panel, Card size).
        </p>
      </div>
      <TRNTabs
        value={activeTab}
        onValueChange={(next) =>
          setActiveTabPersisted(next as CanvasInspectorTab)
        }
        className="flex min-h-0 min-w-0 flex-1 flex-col"
        activeTriggerClassName={TRN_INSPECTOR_TAB_ACTIVE_CLASS}
      >
        <div className={TRN_INSPECTOR_TAB_BAR_WRAP_CLASS}>
          <TRNTabsList className={TRN_INSPECTOR_TAB_LIST_CLASS}>
            {CANVAS_INSPECTOR_TABS.map(({ id, label, Icon }) => (
              <TRNTabsTrigger
                key={id}
                value={id}
                className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />
                {label}
              </TRNTabsTrigger>
            ))}
          </TRNTabsList>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <CanvasInspectorContextBar
            activeTab={activeTab}
            nodeCount={nodes.length}
            edgeCount={edges.length}
            selectionCount={selectionCount}
            health={health}
            flowViewport={flowViewport}
            flowCanvasPreferences={flowCanvasPreferences}
            templateId={templateId}
          />

          <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-3 pt-2">
          {activeTab === "canvas" ? (
            <CanvasInspectorCanvasTab
              flowViewport={flowViewport}
              selectionCount={selectionCount}
              onFitView={onFitView}
              onRestoreFlowViewport={onRestoreFlowViewport}
              onSelectAllNodes={onSelectAllNodes}
              onClearCanvasSelection={onClearCanvasSelection}
              onResetWorkspaceLayout={onResetWorkspaceLayout}
              flowCanvasPreferences={flowCanvasPreferences}
              themeCanvasBackgroundColor={themeCanvasBackgroundColor}
              onFlowCanvasPreferencesChange={onFlowCanvasPreferencesChange}
            />
          ) : null}

          {activeTab === "wires" ? (
            <CanvasInspectorWiresTab
              flowCanvasPreferences={flowCanvasPreferences}
              onFlowCanvasPreferencesChange={onFlowCanvasPreferencesChange}
            />
          ) : null}

          {activeTab === "telemetry" ? (
            <CanvasInspectorTelemetryTab
              nodes={nodes}
              onOpenDeviceSensorSettings={onOpenDeviceSensorSettings}
            />
          ) : null}

          {activeTab === "document" ? (
            <CanvasInspectorDocumentTab
              nodes={nodes}
              edges={edges}
              selectionCount={selectionCount}
              templateId={templateId}
              onTemplateIdChange={onTemplateIdChange}
              onRunTemplate={onRunTemplate}
              onClearCanvas={onClearCanvas}
              onExportFlow={onExportFlow}
              onImportFlowPick={onImportFlowPick}
            />
          ) : null}
          </div>
        </div>
      </TRNTabs>
    </div>
  );
}
