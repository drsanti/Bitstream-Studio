import { T3DWebSocketClient } from "../websocket/T3DWebSocketClient";
import { SERIALPORT_TOPICS } from "../serialport-bridge/protocol";

async function requestResult<T extends { requestId: string }>(
  client: T3DWebSocketClient,
  requestTopic: string,
  responseTopic: string,
  payload: Record<string, unknown>,
  timeoutMs = 6000,
): Promise<T> {
  const requestId = `probe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await client.subscribe(responseTopic, 0, "json");

  return await new Promise<T>(async (resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${responseTopic}`));
    }, timeoutMs);

    client.setCallbacks({
      onMessage: (topic, data) => {
        if (topic !== responseTopic) {
          return;
        }
        const parsed = data as T;
        if (parsed.requestId !== requestId) {
          return;
        }
        clearTimeout(timer);
        resolve(parsed);
      },
    });

    try {
      await client.publish(requestTopic, { requestId, ...payload }, 0);
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
}

async function main(): Promise<void> {
  const client = new T3DWebSocketClient({ url: "ws://127.0.0.1:9998", autoConnect: false });
  await client.connect();

  const open = await requestResult<{ requestId: string; success: boolean; error?: string }>(
    client,
    SERIALPORT_TOPICS.OPEN,
    SERIALPORT_TOPICS.OPEN_RESULT,
    { path: "COM3", baudRate: 921600, mode: "data" },
  );
  console.log("OPEN_RESULT", JSON.stringify(open));

  const close = await requestResult<{ requestId: string; success: boolean; error?: string }>(
    client,
    SERIALPORT_TOPICS.CLOSE,
    SERIALPORT_TOPICS.CLOSE_RESULT,
    {},
  );
  console.log("CLOSE_RESULT", JSON.stringify(close));

  await client.disconnect();
}

void main().catch((error) => {
  console.error("PROBE_ERR", error);
  process.exit(1);
});
