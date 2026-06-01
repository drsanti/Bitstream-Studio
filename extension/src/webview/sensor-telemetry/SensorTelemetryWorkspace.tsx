import { useCallback, useEffect, useRef, useState } from "react";
import {
  StandaloneWorkbench,
  WorkbenchLayoutMenu,
  type StandaloneWorkbenchHandle,
  type WorkbenchLayoutMenuProps,
} from "../ui/workbench";
import { DeviceSensorSettingsWindow } from "../sensor-studio/features/device-settings/DeviceSensorSettingsWindow";
import { SensorTelemetryChromeBar } from "./SensorTelemetryChromeBar";
import { DEFAULT_TELEMETRY_WORKBENCH_LAYOUT } from "./workbench/default-telemetry-workbench-layout";
import { TELEMETRY_WORKBENCH_REGISTRY } from "./workbench/telemetry-workbench-registry";
import { validateTelemetryWorkbenchLayout } from "./workbench/validate-telemetry-workbench-layout";
import { TELEMETRY_WORKBENCH_PRESETS } from "./workbench/telemetry-workbench-presets";
import { TELEMETRY_WORKBENCH_PANE_COMMANDS } from "./telemetry-workbench-pane-commands";
import { appendTelemetryActivity } from "./store/telemetryActivity.store.js";
import { useTelemetryWorkbenchUiStore } from "./store/telemetryWorkbenchUi.store.js";

const TELEMETRY_SIDE_PANELS = ["config", "telemetry", "activity"] as const;

/**
 * Bitstream sensor-telemetry body: merged chrome + resizable workbench (config · main · live · activity).
 */
export function SensorTelemetryWorkspace() {
  const workbenchRef = useRef<StandaloneWorkbenchHandle>(null);
  const [layoutMenuProps, setLayoutMenuProps] = useState<WorkbenchLayoutMenuProps | null>(null);
  const [deviceSensorSettingsOpen, setDeviceSensorSettingsOpen] = useState(false);
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

  const focusPane = useCallback((editorType: string) => {
    workbenchRef.current?.focusPane(editorType);
  }, []);

  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col"
      data-bitstream-sensor-workspace-root
    >
      <SensorTelemetryChromeBar
        onOpenDeviceSensorSettings={() => setDeviceSensorSettingsOpen(true)}
        onFocusPane={focusPane}
        paneCommands={TELEMETRY_WORKBENCH_PANE_COMMANDS}
        layoutMenu={layoutMenuProps ? <WorkbenchLayoutMenu {...layoutMenuProps} /> : null}
      />

      <main className="relative flex min-h-0 flex-1 flex-col px-2 pb-2 pt-0">
        <StandaloneWorkbench
          ref={workbenchRef}
          initialLayout={DEFAULT_TELEMETRY_WORKBENCH_LAYOUT}
          registry={TELEMETRY_WORKBENCH_REGISTRY}
          persistenceKey="sensor-telemetry-v2"
          validateLayout={validateTelemetryWorkbenchLayout}
          sidePanelEditorTypes={TELEMETRY_SIDE_PANELS}
          paneCommands={TELEMETRY_WORKBENCH_PANE_COMMANDS}
          layoutPresets={TELEMETRY_WORKBENCH_PRESETS}
          onLayoutMenuPropsChange={setLayoutMenuProps}
        />
      </main>

      <DeviceSensorSettingsWindow
        open={deviceSensorSettingsOpen}
        onClose={() => setDeviceSensorSettingsOpen(false)}
        initialSourceId={null}
      />
    </div>
  );
}
