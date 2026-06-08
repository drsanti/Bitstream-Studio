import { useCallback, useMemo, useRef, useState } from "react";
import {
  StandaloneWorkbench,
  type StandaloneWorkbenchHandle,
  type WorkbenchLayoutMenuProps,
} from "../../../../ui/workbench";
import { StudioFlowCanvasChromeProvider } from "../studio-flow-canvas-chrome.context";
import type { StudioOverflowMenuProps } from "./StudioOverflowMenu";
import { DeviceSensorSettingsWindow } from "../../device-settings/DeviceSensorSettingsWindow";
import type { StudioLayoutProps } from "../studio-layout.props";
import { DEFAULT_STUDIO_WORKBENCH_LAYOUT } from "../workbench/default-studio-workbench-layout";
import { StudioWorkbenchShellProvider } from "../workbench/studio-workbench-context";
import { useStudioWorkbenchFocusStore } from "../../../state/studio-workbench-focus.store";
import { useStudioRuntimeVisibilityStore } from "../../../state/studio-runtime-visibility.store";
import type { LayoutNode } from "../../../../ui/workbench/types";
import { SENSOR_STUDIO_WORKBENCH_REGISTRY } from "../workbench/studio-workbench-registry";
import {
  getStudioWorkbenchPreset,
  STUDIO_WORKBENCH_PRESETS,
} from "../workbench/studio-workbench-presets";
import {
  toggleStudioPaneCollapseByEditorType,
  validateStudioWorkbenchLayout,
  type StudioWorkbenchEditorType,
} from "../workbench/validate-studio-workbench-layout";

export type { StudioLayoutProps } from "../studio-layout.props";

const STUDIO_PANE_COMMANDS = [
  { editorType: "library", label: "Open Library", keywords: "library palette nodes" },
  {
    editorType: "model-outliner",
    label: "Open Model Outliner",
    keywords: "outliner glb model hierarchy scene",
  },
  { editorType: "assets", label: "Open Asset Browser", keywords: "assets models browser" },
  { editorType: "stage", label: "Open Stage", keywords: "stage 3d viewport scene output" },
  {
    editorType: "dashboard",
    label: "Open Dashboard",
    keywords: "dashboard hmi operator 2d grid",
  },
  { editorType: "flow", label: "Open Flow Canvas", keywords: "flow graph brain canvas" },
  { editorType: "inspector", label: "Open Inspector", keywords: "inspector properties" },
] as const;

const STUDIO_SIDE_PANELS = ["library", "model-outliner", "assets", "inspector"] as const;

export function StudioLayout(props: StudioLayoutProps) {
  const {
    canvasBackgroundColor,
    primaryTextColor,
    borderColor,
    entries,
    onAddNode,
    onDuplicateSelection,
    onDeleteSelection,
    onSelectAllNodes,
    onClearCanvasSelection,
    onExportFlow,
    onImportFlowPick,
    deviceSensorSettingsOpen = false,
    onDeviceSensorSettingsOpenChange,
    deviceSensorSettingsInitialSourceId = null,
    onOpenDeviceSensorSettings,
    workbenchRef: workbenchRefProp,
  } = props;

  const internalWorkbenchRef = useRef<StandaloneWorkbenchHandle>(null);
  const workbenchRef = workbenchRefProp ?? internalWorkbenchRef;
  const setActiveEditorType = useStudioWorkbenchFocusStore((s) => s.setActiveEditorType);
  const syncRuntimeVisibilityFromLayout = useStudioRuntimeVisibilityStore(
    (s) => s.syncFromWorkbenchLayout,
  );
  const [layoutMenuProps, setLayoutMenuProps] = useState<WorkbenchLayoutMenuProps | null>(null);

  const onWorkbenchLayoutChange = useCallback(
    (layout: LayoutNode) => {
      syncRuntimeVisibilityFromLayout(layout);
    },
    [syncRuntimeVisibilityFromLayout],
  );

  const flowCanvasChrome = useMemo((): StudioOverflowMenuProps => {
    return {
      onOpenDeviceSensorSettings: () => onOpenDeviceSensorSettings?.(null),
      onDuplicateSelection,
      onDeleteSelection,
      onSelectAllNodes,
      onClearCanvasSelection,
      onExportFlow,
      onImportFlowPick,
      layoutMenuProps,
    };
  }, [
    layoutMenuProps,
    onClearCanvasSelection,
    onDeleteSelection,
    onDuplicateSelection,
    onExportFlow,
    onImportFlowPick,
    onOpenDeviceSensorSettings,
    onSelectAllNodes,
  ]);

  const resetWorkspaceLayout = useCallback(() => {
    workbenchRef.current?.resetLayout();
  }, []);

  const focusWorkbenchPane = useCallback(
    (editorType: string) => {
      workbenchRef.current?.focusPane(editorType);
      setActiveEditorType(editorType as StudioWorkbenchEditorType);
    },
    [setActiveEditorType, workbenchRef],
  );

  const applyWorkbenchPreset = useCallback(
    (presetId: string) => {
      const preset = getStudioWorkbenchPreset(presetId);
      if (preset == null) {
        return false;
      }
      workbenchRef.current?.applyImportedLayoutSnapshot({
        layout: preset.layout,
        dockMemory: {},
      });
      return true;
    },
    [workbenchRef],
  );

  const toggleStudioPane = useCallback(
    (layout: Parameters<typeof toggleStudioPaneCollapseByEditorType>[0], editorType: string) => {
      if (editorType !== "library" && editorType !== "inspector") {
        return layout;
      }
      return toggleStudioPaneCollapseByEditorType(
        layout,
        editorType as StudioWorkbenchEditorType,
      );
    },
    [],
  );

  return (
    <div
      className="flex min-h-0 w-full flex-1 flex-col"
      style={{
        backgroundColor: canvasBackgroundColor,
        color: primaryTextColor,
      }}
    >
      <main className="relative flex min-h-0 flex-1 flex-col">
        <StudioWorkbenchShellProvider
          value={{
            ...props,
            onResetWorkspaceLayout: resetWorkspaceLayout,
            onFocusWorkbenchPane: focusWorkbenchPane,
            onApplyWorkbenchPreset: applyWorkbenchPreset,
          }}
        >
          <StudioFlowCanvasChromeProvider value={flowCanvasChrome}>
          <StandaloneWorkbench
            ref={workbenchRef}
            initialLayout={DEFAULT_STUDIO_WORKBENCH_LAYOUT}
            registry={SENSOR_STUDIO_WORKBENCH_REGISTRY}
            persistenceKey="sensor-studio"
            validateLayout={validateStudioWorkbenchLayout}
            sidePanelEditorTypes={STUDIO_SIDE_PANELS}
            paneCommands={STUDIO_PANE_COMMANDS}
            layoutPresets={STUDIO_WORKBENCH_PRESETS}
            togglePaneByEditorType={toggleStudioPane}
            onActiveEditorTypeChange={setActiveEditorType}
            onWorkbenchLayoutChange={onWorkbenchLayoutChange}
            onLayoutMenuPropsChange={setLayoutMenuProps}
            onDetachRejected={() => {
              // Last pane cannot float — ignore silently.
            }}
          />
          </StudioFlowCanvasChromeProvider>
        </StudioWorkbenchShellProvider>
      </main>

      <DeviceSensorSettingsWindow
        open={deviceSensorSettingsOpen}
        onClose={() => onDeviceSensorSettingsOpenChange?.(false)}
        initialSourceId={deviceSensorSettingsInitialSourceId}
      />
    </div>
  );
}
