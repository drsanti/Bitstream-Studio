import type { T3DWsQos } from "../websocket/T3DWebSocketServer";

/**
 * WebSocket QoS for **`serialport/data`** binary publishes (MCU bulk RX fan-out).
 * Default **1** so the broker tracks delivery until the subscriber **puback**s (see `T3DWebSocketServer.sendWithQos`).
 * Set **`T3D_SERIAL_DATA_BINARY_QOS=0`** to restore legacy fire-and-forget if broker CPU or pending maps become a bottleneck.
 */
export function getSerialportDataBinaryPublishQos(): T3DWsQos {
  let raw = "";
  try {
    const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
      ?.T3D_SERIAL_DATA_BINARY_QOS;
    raw = typeof env === "string" ? env.trim().toLowerCase() : "";
  } catch {
    raw = "";
  }
  if (raw === "0" || raw === "false" || raw === "off") {
    return 0;
  }
  return 1;
}
