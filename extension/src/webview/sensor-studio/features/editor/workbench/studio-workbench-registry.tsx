import { BookOpen, GitBranch, Layers, SlidersHorizontal } from "lucide-react";
import type { WorkbenchRegistry } from "../../../../ui/workbench";
import { AssetBrowsePanel } from "../../../../assets-manager/browse/AssetBrowsePanel.js";
import { FlowCanvas } from "../components/FlowCanvas";
import { NodeInspector } from "../components/NodeInspector";
import { NodePalette } from "../components/NodePalette";
import { useStudioWorkbenchShell } from "./studio-workbench-context";

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
      onSpawnGlbExtract={p.onSpawnGlbExtract}
      onSpawnGlbMaterialTextureExtract={p.onSpawnGlbMaterialTextureExtract}
      onSpawnGlbEventPartExtract={p.onSpawnGlbEventPartExtract}
      onSpawnGlbEventAnimExtract={p.onSpawnGlbEventAnimExtract}
    />
  );
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
      canvasBackgroundColor={p.canvasBackgroundColor}
      flowCanvasPreferences={p.flowCanvasPreferences}
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
      onUpdateNodeUiResizable={p.onUpdateNodeUiResizable}
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
  assets: {
    icon: <Layers className="size-3.5" aria-hidden />,
    label: "Assets",
    component: WorkbenchAssetsPanel,
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
