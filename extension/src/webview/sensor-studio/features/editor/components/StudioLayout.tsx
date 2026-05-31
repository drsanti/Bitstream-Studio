import { useCallback, useEffect, useRef } from "react";
import { StandaloneWorkbench, type StandaloneWorkbenchHandle } from "../../../../ui/workbench";
import { StudioToolbar } from "./StudioToolbar";
import { DeviceSensorSettingsWindow } from "../../device-settings/DeviceSensorSettingsWindow";
import type { StudioLayoutProps } from "../studio-layout.props";
import { DEFAULT_STUDIO_WORKBENCH_LAYOUT } from "../workbench/default-studio-workbench-layout";
import { StudioWorkbenchShellProvider } from "../workbench/studio-workbench-context";
import { SENSOR_STUDIO_WORKBENCH_REGISTRY } from "../workbench/studio-workbench-registry";
import { toggleEditorTypePaneCollapse } from "../workbench/studio-workbench-layout-helpers";

export type { StudioLayoutProps } from "../studio-layout.props";

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
  } = props;

  const workbenchRef = useRef<StandaloneWorkbenchHandle>(null);
  const libraryCollapsedRef = useRef(false);
  const inspectorCollapsedRef = useRef(false);
  const ratioStashRef = useRef<Partial<Record<"library" | "inspector", number>>>({});

  const resetWorkspaceLayout = useCallback(() => {
    libraryCollapsedRef.current = false;
    inspectorCollapsedRef.current = false;
    ratioStashRef.current = {};
    workbenchRef.current?.resetLayout();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
        return;
      }
      if (e.repeat) {
        return;
      }
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) {
        return;
      }

      if (e.code === "KeyP") {
        e.preventDefault();
        workbenchRef.current?.setLayout((prev) => {
          const nextCollapsed = !libraryCollapsedRef.current;
          const after = toggleEditorTypePaneCollapse(prev, "library", nextCollapsed, ratioStashRef);
          if (after === prev) {
            return prev;
          }
          libraryCollapsedRef.current = nextCollapsed;
          return after;
        });
        return;
      }
      if (e.code === "KeyI") {
        e.preventDefault();
        workbenchRef.current?.setLayout((prev) => {
          const nextCollapsed = !inspectorCollapsedRef.current;
          const after = toggleEditorTypePaneCollapse(prev, "inspector", nextCollapsed, ratioStashRef);
          if (after === prev) {
            return prev;
          }
          inspectorCollapsedRef.current = nextCollapsed;
          return after;
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
