/**
 * Snapshot of StudioLayout before the smart workbench refactor (TRNSidePanel overlays).
 * Not imported — kept for reference and rollback. See StudioLayout.tsx.
 */
import type { Edge, Viewport } from "@xyflow/react";
import { useEffect, useState } from "react";
import type { NodeCatalogEntry } from "../../../core/config/config-types";
import type { StudioDemoTemplateId, StudioNode } from "../store/flow-editor.store";
import { TRNSidePanel } from "../../../../ui/TRN";
import { FlowCanvas } from "./FlowCanvas";
import { NodeInspector } from "./NodeInspector";
import { NodePalette } from "./NodePalette";
import { StudioToolbar } from "./StudioToolbar";
import { DeviceSensorSettingsWindow } from "../../device-settings/DeviceSensorSettingsWindow";

type StudioLayoutProps = {
  canvasBackgroundColor: string;
  panelBackgroundColor: string;
  borderColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  numberColor: string;
  booleanColor: string;
  stringColor: string;
  eventColor: string;
  vector3Color: string;
  quaternionColor: string;
  minimapCategoryColors: Record<NodeCatalogEntry["category"], string>;
  entries: NodeCatalogEntry[];
  nodes: StudioNode[];
  edges: Edge[];
  selectedNode: StudioNode | null;
  onAddNode: (entry: NodeCatalogEntry) => void;
  onNodesChange: Parameters<typeof FlowCanvas>[0]["onNodesChange"];
  onEdgesChange: Parameters<typeof FlowCanvas>[0]["onEdgesChange"];
  onConnect: Parameters<typeof FlowCanvas>[0]["onConnect"];
  onSelectionChange: (selectedNodeId: string | null) => void;
  onUpdateLabel: (nextLabel: string) => void;
  onUpdateConfigField: (key: string, value: unknown) => boolean;
  onUpdateConfigJson: (nextJson: string) => { ok: true } | { ok: false; message: string };
  templateId: StudioDemoTemplateId;
  onTemplateIdChange: (templateId: StudioDemoTemplateId) => void;
  onRunTemplate: () => void;
  onClearCanvas: () => void;
  onDuplicateSelection?: () => void;
  onDeleteSelection?: () => void;
  onFitView?: () => void;
  onSelectAllNodes?: () => void;
  onClearCanvasSelection?: () => void;
  onExportFlow: () => void;
  onImportFlowPick: () => void;
  deviceSensorSettingsOpen?: boolean;
  onDeviceSensorSettingsOpenChange?: (open: boolean) => void;
  deviceSensorSettingsInitialSourceId?: number | null;
  onOpenDeviceSensorSettings?: (initialSourceId: number | null) => void;
  fitViewVersion: number;
  initialFlowViewport?: Viewport | null;
  onFlowViewportMoveEnd?: (viewport: Viewport) => void;
  applyFlowViewport?: Viewport | null;
  applyFlowViewportNonce?: number;
  onDropPaletteCatalogNode?: (
    catalogNodeId: string,
    flowPosition: { x: number; y: number },
  ) => void;
};

function readPersistedPanelCollapsed(persistKey: string, fallback: boolean): boolean {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(persistKey);
    if (raw == null) {
      return fallback;
    }
    const parsed = JSON.parse(raw) as { collapsed?: boolean };
    if (typeof parsed.collapsed === "boolean") {
      return parsed.collapsed;
    }
  } catch {
    return fallback;
  }
  return fallback;
}

export function StudioLayout(props: StudioLayoutProps) {
  const {
    canvasBackgroundColor,
    panelBackgroundColor,
    borderColor,
    primaryTextColor,
    secondaryTextColor,
    numberColor,
    booleanColor,
    stringColor,
    eventColor,
    vector3Color,
    quaternionColor,
    minimapCategoryColors,
    entries,
    nodes,
    edges,
    selectedNode,
    onAddNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onSelectionChange,
    onUpdateLabel,
    onUpdateConfigField,
    onUpdateConfigJson,
    templateId,
    onTemplateIdChange,
    onRunTemplate,
    onClearCanvas,
    onDuplicateSelection,
    onDeleteSelection,
    onFitView,
    onSelectAllNodes,
    onClearCanvasSelection,
    onExportFlow,
    onImportFlowPick,
    deviceSensorSettingsOpen = false,
    onDeviceSensorSettingsOpenChange,
    deviceSensorSettingsInitialSourceId = null,
    onOpenDeviceSensorSettings,
    fitViewVersion,
    initialFlowViewport,
    onFlowViewportMoveEnd,
    applyFlowViewport,
    applyFlowViewportNonce,
    onDropPaletteCatalogNode,
  } = props;
  const [leftCollapsed, setLeftCollapsed] = useState(() =>
    readPersistedPanelCollapsed("sensor-studio:overlay:left", false),
  );
  const [rightCollapsed, setRightCollapsed] = useState(() =>
    readPersistedPanelCollapsed("sensor-studio:overlay:right", selectedNode == null),
  );
  const [inspectorManuallyClosedNodeId, setInspectorManuallyClosedNodeId] = useState<string | null>(
    null,
  );
  const selectedNodeId = selectedNode?.id ?? null;

  useEffect(() => {
    if (selectedNodeId == null) {
      setRightCollapsed(true);
      setInspectorManuallyClosedNodeId(null);
      return;
    }
    if (inspectorManuallyClosedNodeId === selectedNodeId) {
      setRightCollapsed(true);
      return;
    }
    if (selectedNode != null) {
      setRightCollapsed(false);
      return;
    }
    setRightCollapsed(true);
  }, [inspectorManuallyClosedNodeId, selectedNode, selectedNodeId]);

  return (
    <div
      className="flex min-h-0 w-full flex-1 flex-col"
      style={{
        backgroundColor: canvasBackgroundColor,
        color: primaryTextColor,
      }}
    >
      <StudioToolbar
        borderColor={borderColor}
        entries={entries}
        onAddNode={onAddNode}
        onOpenDeviceSensorSettings={() => onOpenDeviceSensorSettings?.(null)}
        templateId={templateId}
        onTemplateIdChange={onTemplateIdChange}
        onRunTemplate={onRunTemplate}
        onClearCanvas={onClearCanvas}
        onDuplicateSelection={onDuplicateSelection}
        onDeleteSelection={onDeleteSelection}
        onFitView={onFitView}
        onSelectAllNodes={onSelectAllNodes}
        onClearCanvasSelection={onClearCanvasSelection}
        onExportFlow={onExportFlow}
        onImportFlowPick={onImportFlowPick}
      />

      <main className="relative flex min-h-0 flex-1 flex-col p-2">
        <div className="relative min-h-0 flex-1">
          <FlowCanvas
            borderColor={borderColor}
            panelColor={panelBackgroundColor}
            primaryTextColor={primaryTextColor}
            secondaryTextColor={secondaryTextColor}
            numberColor={numberColor}
            booleanColor={booleanColor}
            stringColor={stringColor}
            eventColor={eventColor}
            vector3Color={vector3Color}
            quaternionColor={quaternionColor}
            minimapCategoryColors={minimapCategoryColors}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            fitViewVersion={fitViewVersion}
            initialViewport={initialFlowViewport ?? null}
            onViewportMoveEnd={onFlowViewportMoveEnd}
            applyViewport={applyFlowViewport ?? null}
            applyViewportNonce={applyFlowViewportNonce ?? 0}
            onDropPaletteCatalogNode={onDropPaletteCatalogNode}
          />
        </div>

        <div className="pointer-events-none absolute inset-2 z-20">
          <TRNSidePanel
            side="left"
            mode="overlay"
            variant="settings"
            title="Library"
            backdrop="none"
            glass={false}
            footer={<span className="text-[10px] text-zinc-500">Toggle: Alt+P</span>}
            persistKey="sensor-studio:overlay:left"
            defaultWidth={280}
            minWidth={220}
            maxWidth={420}
            collapsible
            resizable
            collapsedPresentation="floating-only"
            collapsed={leftCollapsed}
            onCollapsedChange={setLeftCollapsed}
            contentClassName="p-0"
            className="pointer-events-auto"
            overlayOffset={{ top: 0, bottom: 0, left: 0 }}
            toggleHotkeys={["alt+p"]}
          >
            <NodePalette
              borderColor={borderColor}
              panelColor={panelBackgroundColor}
              entries={entries}
              onAddNode={onAddNode}
            />
          </TRNSidePanel>

          <TRNSidePanel
            side="right"
            mode="overlay"
            variant="inspector"
            title="Inspector"
            backdrop="none"
            glass={false}
            footer={<span className="text-[10px] text-zinc-500">Toggle: Alt+I</span>}
            persistKey="sensor-studio:overlay:right"
            defaultWidth={360}
            minWidth={280}
            maxWidth={560}
            collapsible
            resizable
            collapsedPresentation="floating-only"
            collapsed={rightCollapsed}
            onCollapsedChange={setRightCollapsed}
            onToggle={(nextCollapsed, reason) => {
              if (!nextCollapsed) {
                setInspectorManuallyClosedNodeId(null);
                return;
              }
              if (
                (reason === "button" ||
                  reason === "inner-edge" ||
                  reason === "hotkey" ||
                  reason === "outside-click" ||
                  reason === "esc") &&
                selectedNodeId != null
              ) {
                setInspectorManuallyClosedNodeId(selectedNodeId);
              }
            }}
            contentClassName="p-0"
            className="pointer-events-auto"
            overlayOffset={{ top: 0, bottom: 0, right: 0 }}
            toggleHotkeys={["alt+i"]}
          >
            <NodeInspector
              borderColor={borderColor}
              panelColor={panelBackgroundColor}
              selectedNode={selectedNode}
              onOpenDeviceSensorSettings={onOpenDeviceSensorSettings}
              catalogEntries={entries}
              categoryColors={minimapCategoryColors}
              onUpdateLabel={onUpdateLabel}
              onUpdateConfigField={onUpdateConfigField}
              onUpdateConfigJson={onUpdateConfigJson}
            />
          </TRNSidePanel>
        </div>
      </main>

      <DeviceSensorSettingsWindow
        open={deviceSensorSettingsOpen}
        onClose={() => onDeviceSensorSettingsOpenChange?.(false)}
        initialSourceId={deviceSensorSettingsInitialSourceId}
      />
    </div>
  );
}
