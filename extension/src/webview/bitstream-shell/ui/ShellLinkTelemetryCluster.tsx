import { useBitstreamWorkspaceModeStore } from "../../bitstream-app/state/bitstreamWorkspaceMode.store";
import { useBitstreamTransportActions } from "../../bitstream-app/context/bitstreamTransportActions.context";
import { SensorStudioPerformanceShellChip } from "../../sensor-studio/features/shell/SensorStudioPerformanceShellChip";
import { useLinkLifecycleBarInputs } from "../hooks/useLinkLifecycleBarInputs";
import { useLinkLifecycleHeaderStatus } from "./LinkLifecycleStrip";
import { isLinkLifecycleReady } from "./link-lifecycle-model";
import { BitstreamSensorSampleRxBadge } from "./BitstreamTelemetryRxBadges";
import { BitstreamWireRxThroughputChip } from "./BitstreamWireRxThroughputChip";

/** Wire B/s + decode FPS pills when link lifecycle is ready (toolbar, canvas, footer). */
export function ShellLinkTelemetryCluster() {
  const workspace = useBitstreamWorkspaceModeStore((s) => s.workspace);
  const sensorStudioMode = workspace === "sensor-studio";
  const lifecycleInputs = useLinkLifecycleBarInputs();
  const headerStatus = useLinkLifecycleHeaderStatus(lifecycleInputs);
  const linkReady = isLinkLifecycleReady(headerStatus);
  const { reconnectTelemetry } = useBitstreamTransportActions();

  if (!linkReady && !sensorStudioMode) {
    return null;
  }

  return (
    <div
      className="mr-2.5 inline-flex shrink-0 items-center gap-1.5"
      role="group"
      aria-label={sensorStudioMode ? "Sensor Studio performance" : "Telemetry stream rate"}
    >
      {sensorStudioMode ? <SensorStudioPerformanceShellChip /> : null}
      {linkReady ? (
        <>
          <BitstreamWireRxThroughputChip toolbarSlot />
          <BitstreamSensorSampleRxBadge
            variant="chip"
            chipMetric="aggregateFps"
            toolbarSlot
            onReconnectTelemetry={reconnectTelemetry}
          />
        </>
      ) : null}
    </div>
  );
}
