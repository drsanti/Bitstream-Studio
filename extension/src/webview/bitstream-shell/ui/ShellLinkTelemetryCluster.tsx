import { useBitstreamTransportActions } from "../../bitstream-app/context/bitstreamTransportActions.context";
import { useLinkLifecycleBarInputs } from "../hooks/useLinkLifecycleBarInputs";
import { useLinkLifecycleHeaderStatus } from "./LinkLifecycleStrip";
import { isLinkLifecycleReady } from "./link-lifecycle-model";
import { BitstreamSensorSampleRxBadge } from "./BitstreamTelemetryRxBadges";
import { BitstreamWireRxThroughputChip } from "./BitstreamWireRxThroughputChip";

/** Wire B/s + decode FPS pills when link lifecycle is ready (toolbar, canvas, footer). */
export function ShellLinkTelemetryCluster() {
  const lifecycleInputs = useLinkLifecycleBarInputs();
  const headerStatus = useLinkLifecycleHeaderStatus(lifecycleInputs);
  const linkReady = isLinkLifecycleReady(headerStatus);
  const { reconnectTelemetry } = useBitstreamTransportActions();

  if (!linkReady) {
    return null;
  }

  return (
    <div
      className="mr-2.5 inline-flex shrink-0 items-center gap-1.5"
      role="group"
      aria-label="Telemetry stream rate"
    >
      <BitstreamWireRxThroughputChip toolbarSlot />
      <BitstreamSensorSampleRxBadge
        variant="chip"
        chipMetric="aggregateFps"
        toolbarSlot
        onReconnectTelemetry={reconnectTelemetry}
      />
    </div>
  );
}
