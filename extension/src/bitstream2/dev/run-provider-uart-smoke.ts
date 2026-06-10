#!/usr/bin/env npx tsx
/**
 * Smoke test: open UART via broker, verify public provider on :9997 emits uart samples.
 *
 *   npx tsx src/bitstream2/dev/run-provider-uart-smoke.ts --path=/dev/cu.usbmodem1103
 */
import WebSocket from "ws";
import { T3DWebSocketClient } from "../../websocket/T3DWebSocketClient";
import { BITSTREAM2_TOPICS } from "../bridge/protocol";
import { SERIALPORT_TOPICS } from "../../serialport-bridge/protocol";

const PATH = process.argv.find((a) => a.startsWith("--path="))?.slice(7)
  ?? process.env.BITSTREAM_UART_PATH
  ?? "/dev/cu.usbmodem1103";
const BAUD = Number(process.argv.find((a) => a.startsWith("--baud="))?.slice(7) ?? "921600");
const SOAK_MS = Number(process.argv.find((a) => a.startsWith("--soak-ms="))?.split("=")[1] ?? "20000");

async function main(): Promise<void> {
  const samples = { uart: 0, bySensor: {} as Record<string, number> };
  let catalog = false;
  let config = false;
  let hello = false;
  let connection: unknown = null;

  const provider = new WebSocket("ws://127.0.0.1:9997");
  provider.on("message", (raw) => {
    const m = JSON.parse(String(raw)) as { type: string; payload: Record<string, unknown> };
    if (m.type === "bitstream:catalog") catalog = true;
    if (m.type === "bitstream:config") config = true;
    if (m.type === "bitstream:connection") connection = m.payload;
    if (m.type === "bitstream:hello") hello = true;
    if (m.type === "bitstream:sample") {
      const p = m.payload as { sensor: string; origin?: string; fields: Record<string, number> };
      const origin = p.origin ?? "unknown";
      if (origin === "uart" || origin === "unknown") {
        samples.uart++;
        samples.bySensor[p.sensor] = (samples.bySensor[p.sensor] ?? 0) + 1;
        if (samples.uart <= 4) {
          console.log("[provider]", p.sensor, origin, p.fields);
        }
      }
    }
  });

  await new Promise<void>((resolve, reject) => {
    provider.once("open", () => resolve());
    provider.once("error", reject);
  });

  const broker = new T3DWebSocketClient({ url: "ws://127.0.0.1:9998", autoConnect: false }, {});
  await broker.connect();
  await broker.publish(
    SERIALPORT_TOPICS.OPEN,
    {
      requestId: `provider-smoke-${Date.now()}`,
      path: PATH,
      baudRate: BAUD,
      leaseOwner: "provider-uart-smoke",
    },
    0,
  );

  console.log(`UART ${PATH} @ ${BAUD} — soaking provider ${SOAK_MS}ms`);
  await new Promise((r) => setTimeout(r, SOAK_MS));

  await broker.publish(SERIALPORT_TOPICS.CLOSE, { requestId: `close-${Date.now()}` }, 0);
  await broker.disconnect();
  provider.close();

  console.log("--- provider uart smoke ---");
  console.log("catalog:", catalog, "config:", config, "hello:", hello);
  console.log("connection:", connection);
  console.log("uart samples:", samples.uart, "bySensor:", samples.bySensor);

  if (samples.uart >= 5 && catalog && config) {
    console.log("PROVIDER UART SMOKE PASSED");
    return;
  }
  console.error("PROVIDER UART SMOKE FAILED");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
