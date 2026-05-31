import { ensureBitstreamSimulatorReady } from "../bridge/requestBitstreamSimulatorHost.js";
import { useBitstreamLiveStore } from "../state/bitstreamLive.store.js";
import { useBitstreamTelemetrySourceStore } from "../state/bitstreamTelemetrySource.store.js";
import { useSerialPortStore } from "../../serialport/serial-port-store.js";

export type ConnectSessionFn = (
  serialPathOverride?: string,
  options?: {
    userInitiated?: boolean;
    preserveLiveTelemetry?: boolean;
    forceUartFullBringUp?: boolean;
  },
) => Promise<void>;

/** Same orchestration as toolbar Link / Connect. */
export async function runConnectAllSession(connectSession: ConnectSessionFn): Promise<void> {
  const ready = await ensureBitstreamSimulatorReady();
  if (!ready) {
    return;
  }
  const tel = useBitstreamTelemetrySourceStore.getState();
  const serial = useSerialPortStore.getState();
  const live = useBitstreamLiveStore.getState();
  await connectSession(undefined, {
    userInitiated: true,
    forceUartFullBringUp:
      tel.backend === "uart" &&
      (tel.uartBringUpPending ||
        live.handshakeState !== "passed" ||
        serial.status?.isOpen !== true),
  });
}
