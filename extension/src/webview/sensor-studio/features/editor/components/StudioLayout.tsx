import { useCallback, useRef, useState } from "react";
import {
  StandaloneWorkbench,
  WorkbenchLayoutMenu,
  type StandaloneWorkbenchHandle,
  type WorkbenchLayoutMenuProps,
} from "../../../../ui/workbench";
import { StudioToolbar } from "./StudioToolbar";
import { DeviceSensorSettingsWindow } from "../../device-settings/DeviceSensorSettingsWindow";
import type { StudioLayoutProps } from "../studio-layout.props";
import { DEFAULT_STUDIO_WORKBENCH_LAYOUT } from "../workbench/default-studio-workbench-layout";
import { StudioWorkbenchShellProvider } from "../workbench/studio-workbench-context";
import { SENSOR_STUDIO_WORKBENCH_REGISTRY } from "../workbench/studio-workbench-registry";
import {
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
  { editorType: "assets", label: "Open Asset Browser", keywords: "assets models browser" },
  { editorType: "flow", label: "Open Flow Canvas", keywords: "flow graph brain canvas" },
  { editorType: "inspector", label: "Open Inspector", keywords: "inspector properties" },
] as const;

const STUDIO_SIDE_PANELS = ["library", "assets", "inspector"] as const;

export function StudioLayout(props: StudioLayoutProps) {
  const {
    canvasBackgroundColor,
    primaryTextColor,
    borderColor,
    entries,
    onAddNode,
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
    workbenchRef: workbenchRefProp,
  } = props;

  const internalWorkbenchRef = useRef<StandaloneWorkbenchHandle>(null);
  const workbenchRef = workbenchRefProp ?? internalWorkbenchRef;
  const [layoutMenuProps, setLayoutMenuProps] = useState<WorkbenchLayoutMenuProps | null>(null);

  const resetWorkspaceLayout = useCallback(() => {
    workbenchRef.current?.resetLayout();
  }, []);

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
        onResetWorkspaceLayout={resetWorkspaceLayout}
        layoutMenu={layoutMenuProps ? <WorkbenchLayoutMenu {...layoutMenuProps} /> : null}
      />

      <main className="relative flex min-h-0 flex-1 flex-col px-2 pb-2 pt-0">
        <StudioWorkbenchShellProvider
          value={{ ...props, onResetWorkspaceLayout: resetWorkspaceLayout }}
        >
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
            onLayoutMenuPropsChange={setLayoutMenuProps}
            onDetachRejected={() => {
              // Last pane cannot float — ignore silently.
            }}
          />
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
