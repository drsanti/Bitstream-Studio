import type { Edge, Viewport } from "@xyflow/react";
import { Activity, FileStack, LayoutGrid, type LucideIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  TRNTabs,
  TRNTabsList,
  TRNTabsTrigger,
  TRN_INSPECTOR_TAB_BAR_WRAP_CLASS,
  TRN_INSPECTOR_TAB_LIST_CLASS,
  TRN_INSPECTOR_TAB_TRIGGER_CLASS,
  trnInspectorTabActiveClassName,
} from "../../../../../ui/TRN";
import type { StudioDemoTemplateId, StudioNode } from "../../store/flow-editor.store";
import type { FlowCanvasPreferences } from "../flow-canvas-ui-persistence";
import { CanvasInspectorCanvasTab } from "./CanvasInspectorCanvasTab";
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
  onFlowCanvasPreferencesChange: (patch: Partial<FlowCanvasPreferences>) => void;
};

const CANVAS_INSPECTOR_TABS: readonly {
  id: CanvasInspectorTab;
  label: string;
  Icon: LucideIcon;
}[] = [
  { id: "canvas", label: "Canvas", Icon: LayoutGrid },
  { id: "telemetry", label: "Telemetry", Icon: Activity },
  { id: "document", label: "Document", Icon: FileStack },
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
      <CanvasInspectorContextBar
        nodeCount={nodes.length}
        edgeCount={edges.length}
        selectionCount={selectionCount}
        health={health}
      />

      <TRNTabs
        value={activeTab}
        onValueChange={(next) => setActiveTabPersisted(next as CanvasInspectorTab)}
        className="flex min-h-0 min-w-0 flex-1 flex-col"
        activeTriggerClassName={trnInspectorTabActiveClassName(activeTab, "telemetry")}
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
      </TRNTabs>
    </div>
  );
}
