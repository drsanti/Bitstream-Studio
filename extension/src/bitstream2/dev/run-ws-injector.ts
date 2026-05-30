#!/usr/bin/env npx tsx
/**
 * Dev tool: inject BS frames through the WS broker (no MCU).
 *
 * Requires bridge with BITSTREAM2_DEV_LOOPBACK=1:
 *   BITSTREAM2_DEV_LOOPBACK=1 npm run start:bridge
 *
 * Usage:
 *   npx tsx src/bitstream2/dev/run-ws-injector.ts --hello
 *   npx tsx src/bitstream2/dev/run-ws-injector.ts --sample
 *   npx tsx src/bitstream2/dev/run-ws-injector.ts --ping-req
 */
import { T3DWebSocketClient } from "../../websocket/T3DWebSocketClient";
import { T3D_DEFAULT_WS_CLIENT_URL } from "../../websocket/T3DWebSocketConfig";
import { SERIALPORT_TOPICS } from "../../serialport-bridge/protocol";
import { BS2_CMD } from "../domains/config/commands";
import {
  BITSTREAM2_TOPICS,
  type Bitstream2DevStatusPayload,
  type Bitstream2HelloPayload,
  type Bitstream2HostResPayload,
  type Bitstream2SensorSamplePayload,
} from "../bridge/protocol";
import {
  wireBytesBmi270AccSampleB64,
  wireBytesHelloB64,
  wireBytesPingReqB64,
} from "./wire-frames";

const wsUrl = process.env.T3D_WS_CLIENT_URL ?? T3D_DEFAULT_WS_CLIENT_URL;

function hasFlag(argv: string[], name: string): boolean {
  return argv.includes(name);
}

async function publishWrite(client: T3DWebSocketClient, dataB64: string): Promise<void> {
  await client.publish(
    SERIALPORT_TOPICS.WRITE,
    { requestId: `inject-${Date.now()}`, data: dataB64 },
    0,
  );
}

async function publishInjectRx(client: T3DWebSocketClient, dataB64: string): Promise<void> {
  await client.publish(
    BITSTREAM2_TOPICS.DEV_INJECT_RX,
    { requestId: `inject-rx-${Date.now()}`, dataB64 },
    0,
  );
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    console.log(`Usage: npx tsx src/bitstream2/dev/run-ws-injector.ts [--hello] [--sample] [--ping-req] [--ping-write]
Env: T3D_WS_CLIENT_URL (default ${T3D_DEFAULT_WS_CLIENT_URL})
Bridge must run with BITSTREAM2_DEV_LOOPBACK=1`);
    return;
  }

  let sawHello = false;
  let sawSample = false;
  let sawRes = false;

  const client = new T3DWebSocketClient(
    {
      url: wsUrl,
      autoConnect: true,
      clientIdentity: { role: "bitstream2-dev-injector", name: "run-ws-injector" },
    },
    {
      onMessage: (topic, payload) => {
        if (topic === BITSTREAM2_TOPICS.DEV_STATUS) {
          const p = payload as Bitstream2DevStatusPayload;
          console.log("DEV_STATUS", p);
        }
        if (topic === BITSTREAM2_TOPICS.HELLO) {
          sawHello = true;
          console.log("HELLO", payload as Bitstream2HelloPayload);
        }
        if (topic === BITSTREAM2_TOPICS.EVT_SENSOR) {
          sawSample = true;
          console.log("EVT_SENSOR", payload as Bitstream2SensorSamplePayload);
        }
        if (topic === BITSTREAM2_TOPICS.RES) {
          sawRes = true;
          console.log("RES", payload as Bitstream2HostResPayload);
        }
      },
    },
  );

  await client.connect();
  await client.subscribe(BITSTREAM2_TOPICS.DEV_STATUS, 0, "json");
  await client.subscribe(BITSTREAM2_TOPICS.HELLO, 0, "json");
  await client.subscribe(BITSTREAM2_TOPICS.EVT_SENSOR, 0, "json");
  await client.subscribe(BITSTREAM2_TOPICS.RES, 0, "json");

  if (hasFlag(argv, "--hello")) {
    await publishInjectRx(client, wireBytesHelloB64());
  }
  if (hasFlag(argv, "--sample")) {
    await publishInjectRx(client, wireBytesBmi270AccSampleB64());
  }
  if (hasFlag(argv, "--ping-req")) {
    // Same path as webview "Send PING" (bitstream2/req → bridge → mock → bitstream2/res).
    await client.publish(
      BITSTREAM2_TOPICS.REQ,
      {
        requestId: `inject-ping-${Date.now()}`,
        reqId: 0,
        cmdId: BS2_CMD.PING,
        timeoutMs: 2000,
      },
      0,
    );
  }
  if (hasFlag(argv, "--ping-write")) {
    // Raw UART TX only (mock RES is not published on bitstream2/res without a pending REQ).
    await publishWrite(client, wireBytesPingReqB64());
  }

  await new Promise((r) => setTimeout(r, 800));

  if (hasFlag(argv, "--hello") && !sawHello) {
    console.warn("No HELLO received (is BITSTREAM2_DEV_LOOPBACK=1 on the bridge?)");
  }
  if (hasFlag(argv, "--sample") && !sawSample) {
    console.warn("No EVT_SENSOR received");
  }
  if (hasFlag(argv, "--ping-req") && !sawRes) {
    console.warn("No RES received for PING (is loopback enabled on the bridge?)");
  }

  await client.disconnect();
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
