import { lazy, Suspense, type ReactNode } from "react";
import {
  BookOpen,
  GitBranch,
  Layers,
  LayoutGrid,
  ListTree,
  MonitorPlay,
  Pin,
  SlidersHorizontal,
  Boxes,
} from "lucide-react";
import type { WorkbenchRegistry } from "../../../../ui/workbench";
import { AssetBrowsePanel } from "../../../../assets-manager/browse/AssetBrowsePanel.js";
import { NodePalette } from "../components/NodePalette";
import { useStudioWorkbenchShell } from "./studio-workbench-context";
import { ModelOutlinerPanel } from "../model-outliner/ModelOutlinerPanel";

const LazyFlowCanvas = lazy(() =>
  import("../components/FlowCanvas").then((m) => ({ default: m.FlowCanvas })),
);
const LazyNodeInspector = lazy(() =>
  import("../components/NodeInspector").then((m) => ({ default: m.NodeInspector })),
);
const LazyDashboardViewport = lazy(() =>
  import("../../dashboard/DashboardViewport").then((m) => ({
    default: m.DashboardViewport,
  })),
);
const LazyStageSceneOutlinerPanel = lazy(() =>
  import("../../stage/StageSceneOutlinerPanel").then((m) => ({
    default: m.StageSceneOutlinerPanel,
  })),
);
const LazyStageViewport = lazy(() =>
  import("../../stage/StageViewport").then((m) => ({ default: m.StageViewport })),
);

function WorkbenchPaneSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

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

function WorkbenchFlowCanvasPane(props: { compactLensChrome?: boolean }) {
  const p = useStudioWorkbenchShell();
  const { compactLensChrome = false } = props;
  return (
    <WorkbenchPaneSuspense>
    <LazyFlowCanvas
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
      compactLensChrome={compactLensChrome}
    />
    </WorkbenchPaneSuspense>
  );
}

export function WorkbenchFlowPanel() {
  return <WorkbenchFlowCanvasPane />;
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

function WorkbenchInspectorPanelInner(props: { inspectorSlot: "active" | "pinned" }) {
  const { inspectorSlot } = props;
  const p = useStudioWorkbenchShell();
  return (
    <WorkbenchPaneSuspense>
    <LazyNodeInspector
      variant="workbench"
      inspectorSlot={inspectorSlot}
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
    </WorkbenchPaneSuspense>
  );
}

export function WorkbenchInspectorPanel() {
  return <WorkbenchInspectorPanelInner inspectorSlot="active" />;
}

export function WorkbenchInspectorPinnedPanel() {
  return <WorkbenchInspectorPanelInner inspectorSlot="pinned" />;
}

export function WorkbenchStagePanel() {
  return (
    <WorkbenchPaneSuspense>
      <LazyStageViewport />
    </WorkbenchPaneSuspense>
  );
}

export function WorkbenchStageOutlinerPanel() {
  return (
    <WorkbenchPaneSuspense>
      <LazyStageSceneOutlinerPanel />
    </WorkbenchPaneSuspense>
  );
}

export function WorkbenchDashboardPanel() {
  return (
    <WorkbenchPaneSuspense>
      <LazyDashboardViewport />
    </WorkbenchPaneSuspense>
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
    component: WorkbenchStagePanel,
  },
  "stage-outliner": {
    icon: <Boxes className="size-3.5" aria-hidden />,
    label: "Stage objects",
    component: WorkbenchStageOutlinerPanel,
  },
  dashboard: {
    icon: <LayoutGrid className="size-3.5" aria-hidden />,
    label: "Dashboard",
    component: WorkbenchDashboardPanel,
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
  "inspector-pinned": {
    icon: <Pin className="size-3.5 text-amber-400/90" aria-hidden />,
    label: "Pinned inspector",
    component: WorkbenchInspectorPinnedPanel,
  },
};
