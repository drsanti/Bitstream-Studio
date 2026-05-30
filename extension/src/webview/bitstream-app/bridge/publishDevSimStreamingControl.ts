import { BITSTREAM2_TOPICS } from "../../../bitstream2/bridge/protocol";
import { useBitstreamTelemetrySourceStore } from "../state/bitstreamTelemetrySource.store";
import { useWsClientStore } from "../../ws-client-store";

function publishDevSimStreamingControlOnce(): void {
  const store = useBitstreamTelemetrySourceStore.getState();
  if (store.backend !== "simulator") {
    return;
  }
  const client = useWsClientStore.getState();
  if (!client.isConnected) {
    return;
  }
  void client.publish(
    BITSTREAM2_TOPICS.DEV_SIM_CONTROL,
    { mode: "run", atMs: Date.now() },
    0,
  );
}

/**
 * Tell the external bitstream-simulator to run streams when Telemetry Source is Simulator,
 * or go idle when the user selects Bitstream (firmware).
 *
 * Re-publishes once after a short delay so the message is not lost if the simulator
 * subscribes to `DEV_SIM_CONTROL` slightly after the webview connects.
 */
export function publishDevSimStreamingControl(): void {
  publishDevSimStreamingControlOnce();
  if (typeof window === "undefined") {
    return;
  }
  window.setTimeout(() => publishDevSimStreamingControlOnce(), 450);
}

/** Publish idle when leaving Simulator source (Bitstream selected). */
export function publishDevSimStreamingIdle(): void {
  const store = useBitstreamTelemetrySourceStore.getState();
  if (store.backend !== "uart") {
    return;
  }
  const client = useWsClientStore.getState();
  if (!client.isConnected) {
    return;
  }
  void client.publish(
    BITSTREAM2_TOPICS.DEV_SIM_CONTROL,
    { mode: "idle", atMs: Date.now() },
    0,
  );
}
