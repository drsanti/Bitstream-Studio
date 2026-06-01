import { useEffect, useRef, useState } from "react";
import {
  StandaloneWorkbench,
  WorkbenchLayoutMenu,
  type StandaloneWorkbenchHandle,
  type WorkbenchLayoutMenuProps,
} from "../ui/workbench";
import { DEFAULT_TELEMETRY_WORKBENCH_LAYOUT } from "./workbench/default-telemetry-workbench-layout";
import { TELEMETRY_WORKBENCH_REGISTRY } from "./workbench/telemetry-workbench-registry";
import { validateTelemetryWorkbenchLayout } from "./workbench/validate-telemetry-workbench-layout";
import { TELEMETRY_WORKBENCH_PRESETS } from "./workbench/telemetry-workbench-presets";
import { appendTelemetryActivity } from "./store/telemetryActivity.store.js";
import { useTelemetryWorkbenchUiStore } from "./store/telemetryWorkbenchUi.store.js";

const TELEMETRY_PANE_COMMANDS = [
  { editorType: "config", label: "Open Sensor Config", keywords: "config sensor cfg" },
  { editorType: "main", label: "Open 3D Orientation", keywords: "main orientation 3d" },
  { editorType: "telemetry", label: "Open Telemetry Deck", keywords: "telemetry deck live" },
  { editorType: "activity", label: "Open Activity Log", keywords: "activity log" },
] as const;

const TELEMETRY_SIDE_PANELS = ["config", "telemetry", "activity"] as const;

/**
 * Bitstream sensor-telemetry body: resizable workbench (config · main · live · activity).
 */
export function SensorTelemetryWorkspace() {
  const workbenchRef = useRef<StandaloneWorkbenchHandle>(null);
  const [layoutMenuProps, setLayoutMenuProps] = useState<WorkbenchLayoutMenuProps | null>(null);
  const setResetLayoutHandler = useTelemetryWorkbenchUiStore((s) => s.setResetLayoutHandler);

  useEffect(() => {
    setResetLayoutHandler(() => {
      workbenchRef.current?.resetLayout();
      appendTelemetryActivity({ text: "Telemetry workbench layout reset to default", tone: "info" });
    });
    return () => {
      setResetLayoutHandler(null);
    };
  }, [setResetLayoutHandler]);

  return (
    <div
      className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col px-2 pb-2 pt-1"
      data-bitstream-sensor-workspace-root
    >
      <div className="mb-1 flex justify-end">
        {layoutMenuProps ? <WorkbenchLayoutMenu {...layoutMenuProps} /> : null}
      </div>
      <StandaloneWorkbench
        ref={workbenchRef}
        initialLayout={DEFAULT_TELEMETRY_WORKBENCH_LAYOUT}
        registry={TELEMETRY_WORKBENCH_REGISTRY}
        persistenceKey="sensor-telemetry-v2"
        validateLayout={validateTelemetryWorkbenchLayout}
        sidePanelEditorTypes={TELEMETRY_SIDE_PANELS}
        paneCommands={TELEMETRY_PANE_COMMANDS}
        layoutPresets={TELEMETRY_WORKBENCH_PRESETS}
        onLayoutMenuPropsChange={setLayoutMenuProps}
      />
    </div>
  );
}
