import {
  BookOpen,
  GitBranch,
  Layers,
  LayoutGrid,
  ListTree,
  MonitorPlay,
  SlidersHorizontal,
} from "lucide-react";
import type { WorkbenchRegistry } from "../../../../ui/workbench";
import { AssetBrowsePanel } from "../../../../assets-manager/browse/AssetBrowsePanel.js";
import { FlowCanvas } from "../components/FlowCanvas";
import { NodeInspector } from "../components/NodeInspector";
import { NodePalette } from "../components/NodePalette";
import { useStudioWorkbenchShell } from "./studio-workbench-context";
import { DashboardViewport } from "../../dashboard/DashboardViewport";
import { StageViewport } from "../../stage/StageViewport";
import { ModelOutlinerPanel } from "../model-outliner/ModelOutlinerPanel";

export function WorkbenchLibraryPanel() {
  const p = useStudioWorkbenchShell();
  return (
    <NodePalette
      borderColor={p.borderColor}
      panelColor={p.panelBackgroundColor}
      mutedTextColor={p.secondaryTextColor}
      categoryColors={p.minimapCategoryColors}
      entries={p.entries}
      onAddNode={p.onAddNode}
      defaultPaletteLayout={p.defaultPaletteLayout}
    />
  );
}

export function WorkbenchModelOutlinerPanel() {
  return <ModelOutlinerPanel />;
}

export function WorkbenchFlowPanel() {
  const p = useStudioWorkbenchShell();
  return (
    <FlowCanvas
      ref={p.flowCanvasGraphRef ?? undefined}
      borderColor={p.borderColor}
      panelColor={p.panelBackgroundColor}
      primaryTextColor={p.primaryTextColor}
      secondaryTextColor={p.secondaryTextColor}
      numberColor={p.numberColor}
      booleanColor={p.booleanColor}
      stringColor={p.stringColor}
      eventColor={p.eventColor}
      vector3Color={p.vector3Color}
      quaternionColor={p.quaternionColor}
      environmentColor={p.environmentColor}
      cameraColor={p.cameraColor}
      glbAnimationColor={p.glbAnimationColor}
      transformColor={p.transformColor}
      minimapCategoryColors={p.minimapCategoryColors}
      catalogEntries={p.entries}
      onAddCatalogEntryAtFlowPosition={p.onAddCatalogEntryAtFlowPosition!}
      nodes={p.nodes}
      edges={p.edges}
      onNodesChange={p.onNodesChange}
      onEdgesChange={p.onEdgesChange}
      onConnect={p.onConnect}
      onSelectionChange={p.onSelectionChange}
      fitViewVersion={p.fitViewVersion}
      initialViewport={p.initialFlowViewport ?? null}
      onViewportMoveEnd={p.onFlowViewportMoveEnd}
      applyViewport={p.applyFlowViewport ?? null}
      applyViewportNonce={p.applyFlowViewportNonce ?? 0}
      onDropPaletteCatalogNode={p.onDropPaletteCatalogNode}
      onDropGlbExtract={p.onDropGlbExtract}
      onDropStudioAsset={p.onDropStudioAsset}
      onDropNodeGroupAsset={p.onDropNodeGroupAsset}
      canvasBackgroundColor={p.canvasBackgroundColor}
      flowCanvasPreferences={p.flowCanvasPreferences}
      onFlowCanvasPreferencesChange={p.onFlowCanvasPreferencesChange}
      onFlowPanePointerEvent={p.onFlowPanePointerEvent}
    />
  );
}

export function WorkbenchAssetsPanel() {
  const p = useStudioWorkbenchShell();
  return (
    <AssetBrowsePanel
      borderColor={p.borderColor}
      panelColor={p.panelBackgroundColor}
      variant="embedded"
      showOpenManagerLink
    />
  );
}

export function WorkbenchInspectorPanel() {
  const p = useStudioWorkbenchShell();
  return (
    <NodeInspector
      borderColor={p.borderColor}
      panelColor={p.panelBackgroundColor}
      selectedNode={p.selectedNode}
      orderedSelectedNodes={p.orderedSelectedNodes}
      catalogEntries={p.entries}
      categoryColors={p.minimapCategoryColors}
      onUpdateLabel={p.onUpdateLabel}
      onUpdateNodeUiAllowBodyCollapse={p.onUpdateNodeUiAllowBodyCollapse}
      onUpdateConfigField={p.onUpdateConfigField}
      onUpdateConfigJson={p.onUpdateConfigJson}
      nodes={p.nodes}
      edges={p.edges}
      orderedSelectedNodesForCanvas={p.orderedSelectedNodes}
      canvasInspector={{
        flowViewport: p.flowViewport,
        templateId: p.templateId,
        onTemplateIdChange: p.onTemplateIdChange,
        onRunTemplate: p.onRunTemplate,
        onFitView: p.onFitView,
        onRestoreFlowViewport: p.onRestoreFlowViewport,
        onSelectAllNodes: p.onSelectAllNodes,
        onClearCanvasSelection: p.onClearCanvasSelection,
        onClearCanvas: p.onClearCanvas,
        onExportFlow: p.onExportFlow,
        onImportFlowPick: p.onImportFlowPick,
        onOpenDeviceSensorSettings: p.onOpenDeviceSensorSettings,
        onResetWorkspaceLayout: p.onResetWorkspaceLayout,
        flowCanvasPreferences: p.flowCanvasPreferences,
        themeCanvasBackgroundColor: p.canvasBackgroundColor,
        onFlowCanvasPreferencesChange: p.onFlowCanvasPreferencesChange,
        stagePresentationPreferences: p.stagePresentationPreferences,
        onStagePresentationPreferencesChange: p.onStagePresentationPreferencesChange,
      }}
    />
  );
}

export const SENSOR_STUDIO_WORKBENCH_REGISTRY: WorkbenchRegistry = {
  library: {
    icon: <BookOpen className="size-3.5" aria-hidden />,
    label: "Library",
    component: WorkbenchLibraryPanel,
  },
  "model-outliner": {
    icon: <ListTree className="size-3.5" aria-hidden />,
    label: "Outliner",
    component: WorkbenchModelOutlinerPanel,
  },
  assets: {
    icon: <Layers className="size-3.5" aria-hidden />,
    label: "Assets",
    component: WorkbenchAssetsPanel,
  },
  stage: {
    icon: <MonitorPlay className="size-3.5" aria-hidden />,
    label: "Stage",
    component: StageViewport,
  },
  dashboard: {
    icon: <LayoutGrid className="size-3.5" aria-hidden />,
    label: "Dashboard",
    component: DashboardViewport,
  },
  flow: {
    icon: <GitBranch className="size-3.5" aria-hidden />,
    label: "Flow",
    component: WorkbenchFlowPanel,
  },
  inspector: {
    icon: <SlidersHorizontal className="size-3.5" aria-hidden />,
    label: "Inspector",
    component: WorkbenchInspectorPanel,
  },
};
