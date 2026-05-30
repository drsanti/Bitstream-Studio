import { T3DWebSocketClient } from "../../websocket/T3DWebSocketClient";
import { SERIALPORT_TOPICS, type ListResponse, type PortInfo } from "../../serialport-bridge/protocol";
import { T3D_DEFAULT_WS_CLIENT_URL } from "../../websocket/T3DWebSocketConfig";

export interface ListSerialPortDetailsOptions {
  wsUrl?: string;
  timeoutMs?: number;
}

function nextRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `serial-list-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function listSerialPortDetails(options: ListSerialPortDetailsOptions = {}): Promise<PortInfo[]> {
  const wsUrl = options.wsUrl ?? T3D_DEFAULT_WS_CLIENT_URL;
  const timeoutMs = Math.max(500, Math.floor(options.timeoutMs ?? 4000));
  const client = new T3DWebSocketClient({ url: wsUrl, autoConnect: false });
  const requestId = nextRequestId();

  try {
    await client.connect();
    await client.subscribe(SERIALPORT_TOPICS.LIST_RESPONSE, 0, "json");
    const ports = await new Promise<PortInfo[]>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timed out waiting for serial port list response")), timeoutMs);
      client.setCallbacks({
        onMessage: (topic, payload) => {
          if (topic !== SERIALPORT_TOPICS.LIST_RESPONSE) {
            return;
          }
          const list = payload as ListResponse;
          if (list.requestId !== requestId) {
            return;
          }
          clearTimeout(timer);
          if (list.error) {
            reject(new Error(list.error));
            return;
          }
          resolve(list.ports ?? []);
        },
      });
      void client.publish(SERIALPORT_TOPICS.LIST, { requestId }, 0);
    });
    return ports;
  } finally {
    try {
      await client.disconnect();
    } catch {
      // ignore disconnect cleanup errors
    }
  }
}
