#!/usr/bin/env npx tsx
/**
 * Host-only smoke: mock firmware + BsSession (no serial hardware).
 * Run: npx tsx src/bitstream2/dev/run-mock-probe.ts
 */
import { BsMockFirmware } from "./mock-firmware";
import { BsSession } from "../runtime/session";
import { BsUartDecoder } from "../runtime/uart-decode";
import { BS2_CMD } from "../domains/config/commands";

async function main(): Promise<void> {
  const decoder = new BsUartDecoder();
  const rx: Uint8Array[] = [];
  const mock = new BsMockFirmware((b) => rx.push(b));

  const session = new BsSession({
    write: async (bytes) => {
      mock.rxFromHost(bytes);
      drain();
    },
  });

  const drain = () => {
    while (rx.length) {
      const chunk = rx.shift()!;
      for (const ev of decoder.feed(chunk)) {
        if (ev.type === "hello") console.log("HELLO", ev.payload);
        if (ev.type === "sensor") console.log("SENSOR", ev.payload);
        if (ev.type === "res_frame") session.handleFrame(ev.frame);
      }
    }
  };

  mock.emitHello();
  drain();

  const ping = await session.sendReq({ requestId: "probe", cmdId: BS2_CMD.PING, timeoutMs: 500 });
  console.log("PING status=", ping.status);

  mock.emitBmi270AccSample();
  drain();
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
