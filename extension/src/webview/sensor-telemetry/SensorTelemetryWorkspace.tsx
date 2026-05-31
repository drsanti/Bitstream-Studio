/*******************************************************************************
 * File Name : SensorTelemetryWorkspace.tsx
 *
 * Description : Sensor Telemetry workspace — resizable workbench panes.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect, useRef } from "react";
import { StandaloneWorkbench, type StandaloneWorkbenchHandle } from "../ui/workbench";
import "../ui/workbench/workbench.css";
import { DEFAULT_TELEMETRY_WORKBENCH_LAYOUT } from "./workbench/default-telemetry-workbench-layout";
import { TELEMETRY_WORKBENCH_REGISTRY } from "./workbench/telemetry-workbench-registry";
import { appendTelemetryActivity } from "./store/telemetryActivity.store.js";
import { useTelemetryWorkbenchUiStore } from "./store/telemetryWorkbenchUi.store.js";

/**
 * Bitstream sensor-telemetry body: resizable workbench (config · main · live · activity).
 */
export function SensorTelemetryWorkspace()
{
  const workbenchRef = useRef<StandaloneWorkbenchHandle>(null);
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
      <StandaloneWorkbench
        ref={workbenchRef}
        initialLayout={DEFAULT_TELEMETRY_WORKBENCH_LAYOUT}
        registry={TELEMETRY_WORKBENCH_REGISTRY}
        persistenceKey="sensor-telemetry-v2"
      />
    </div>
  );
}
