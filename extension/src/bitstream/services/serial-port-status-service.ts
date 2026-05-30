import { T3DWebSocketClient } from "../../websocket/T3DWebSocketClient";
import { SERIALPORT_TOPICS, type SerialPortStatusPayload } from "../../serialport-bridge/protocol";
import { T3D_DEFAULT_WS_CLIENT_URL } from "../../websocket/T3DWebSocketConfig";

export interface GetSerialPortStatusOptions {
  wsUrl?: string;
  timeoutMs?: number;
}

/**
 * Fetches the latest serial bridge status from the broker.
 * Useful for reusing the currently-open serial config (path/baud) without disrupting the UI.
 */
export async function getSerialPortStatus(
  options: GetSerialPortStatusOptions = {},
): Promise<SerialPortStatusPayload | null> {
  const wsUrl = options.wsUrl ?? T3D_DEFAULT_WS_CLIENT_URL;
  const timeoutMs = Math.max(200, Math.floor(options.timeoutMs ?? 1200));
  const client = new T3DWebSocketClient({ url: wsUrl, autoConnect: false });

  try {
    await client.connect();
    await client.subscribe(SERIALPORT_TOPICS.STATUS, 0, "json");

    const status = await new Promise<SerialPortStatusPayload | null>((resolve) => {
      const timer = setTimeout(() => resolve(null), timeoutMs);
      client.setCallbacks({
        onMessage: (topic, payload) => {
          if (topic !== SERIALPORT_TOPICS.STATUS) {
            return;
          }
          clearTimeout(timer);
          resolve(payload as SerialPortStatusPayload);
        },
      });
    });
    return status;
  } finally {
    try {
      await client.disconnect();
    } catch {
      // ignore disconnect cleanup errors
    }
  }
}

