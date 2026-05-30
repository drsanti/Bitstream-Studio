import { T3DWebSocketClient } from "../websocket/T3DWebSocketClient";
import { SerialBridgeTransportAdapter } from "./transport/serial-bridge-transport";
import { HostSession } from "./session/host-session";
import { SERIALPORT_TOPICS, type DiagTaskTableSnapshotPayload } from "../serialport-bridge/protocol";
import { BitstreamFrameDecoder } from "./frame/frame-decoder";
import { BITSTREAM_CHANNEL_DIAGNOSTICS } from "./frame/frame-types";

function env(name: string, fallback: string): string {
  const v = process.env[name];
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : fallback;
}

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw != null ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(n) ? n : fallback;
}

function clampMs(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

async function main(): Promise<void> {
  console.error("DEPRECATED: v1 diag probe. BS2 MCP diag tools return unsupported until EVT_DIAG parity.");
  process.exit(2);
  const wsUrl = env("T3D_WS_CLIENT_URL", "ws://127.0.0.1:9998");
  const path = env("BITSTREAM_SERIAL_PATH", "COM3");
  const baudRate = parseIntEnv("BITSTREAM_BAUD_RATE", 921600);
  const taskPeriodMs = clampMs(parseIntEnv("DIAG_TASK_PERIOD_MS", 20), 0, 60000);
  const maxRowsPerBatch = clampMs(parseIntEnv("DIAG_TASK_MAX_ROWS", 6), 1, 24);
  const resyncPeriodMs = clampMs(parseIntEnv("DIAG_TASK_RESYNC_MS", 2000), 250, 60000);
  const waitMs = clampMs(parseIntEnv("WAIT_SNAPSHOT_MS", 10000), 500, 60000);

  console.log("[task-e2e] wsUrl =", wsUrl);
  console.log("[task-e2e] serial =", path, "baudRate =", baudRate);
  console.log(
    "[task-e2e] cfg taskPeriodMs =",
    taskPeriodMs,
    "maxRowsPerBatch =",
    maxRowsPerBatch,
    "resyncPeriodMs =",
    resyncPeriodMs,
  );
  console.log("[task-e2e] waiting for snapshot ms =", waitMs);

  let snapshot: DiagTaskTableSnapshotPayload | null = null;
  const frameDecoder = new BitstreamFrameDecoder();
  const diagEvtCounter = new Map<number, number>();
  const rawDiagTrace = (String(process.env.DIAG_RAW_TRACE ?? "1").trim() !== "0");

  const sub = new T3DWebSocketClient(
    {
      url: wsUrl,
      autoConnect: false,
      clientIdentity: { role: "diag-task-e2e", name: "probe-diag-task-table-e2e-cli" },
    },
    {
      onConnect: () => console.log("[task-e2e] broker connected"),
      onMessage: (topic, payload) => {
        if (topic !== SERIALPORT_TOPICS.DIAG_TASK_TABLE_SNAPSHOT) return;
        snapshot = payload as DiagTaskTableSnapshotPayload;
        console.log("[task-e2e] SNAPSHOT", {
          expectedTaskCount: snapshot.expectedTaskCount,
          rows: snapshot.rows?.length ?? 0,
          warning: snapshot.warning ?? null,
        });
      },
      onBinary: rawDiagTrace
        ? (topic, data) => {
            if (topic !== SERIALPORT_TOPICS.DATA) return;
            const out = frameDecoder.feed(data);
            for (const fr of out.frames) {
              if (fr.channel !== BITSTREAM_CHANNEL_DIAGNOSTICS || fr.payload.length === 0) continue;
              const evt = fr.payload[0] ?? 0;
              diagEvtCounter.set(evt, (diagEvtCounter.get(evt) ?? 0) + 1);
              if (evt === 0x91 || evt === 0x92 || evt === 0x83 || evt === 0x93) {
                console.log(
                  `[task-e2e] diag evt=0x${evt.toString(16).padStart(2, "0")} len=${fr.payload.length}`,
                );
              }
            }
          }
        : undefined,
      onError: (e) => console.error("[task-e2e] broker error:", e.message),
    },
  );

  await sub.connect();
  await sub.subscribe(SERIALPORT_TOPICS.DIAG_TASK_TABLE_SNAPSHOT, 1, "json");
  if (rawDiagTrace) {
    await sub.subscribe(SERIALPORT_TOPICS.DATA, 0, "binary");
  }

  const transport = new SerialBridgeTransportAdapter({
    wsUrl,
    path,
    baudRate,
    mode: "both",
    readline: true,
    readlineDelimiter: "\n",
    requestTimeoutMs: 7000,
    awaitWriteResult: true,
  });

  const session = new HostSession({
    transport,
    timeoutPolicy: { timeoutMs: 4000, retryCount: 1 },
  });

  try {
    await session.open();

    const ackCfg = await session.sendDiagTaskStreamConfigSet(`cli-task-cfg-${Date.now()}`, {
      diagMajor: 2,
      diagMinor: 0,
      taskPeriodMs,
      maxRowsPerBatch,
      priorityMode: "sensor",
      resyncPeriodMs,
    });
    console.log("[task-e2e] cfg ack =", ackCfg);

    const ackResync = await session.sendDiagTaskStreamResyncNow(
      `cli-task-resync-${Date.now()}`,
      2,
      0,
    );
    console.log("[task-e2e] resync ack =", ackResync);

    const start = Date.now();
    while (Date.now() - start < waitMs) {
      if (snapshot) break;
      await new Promise((r) => setTimeout(r, 100));
    }

    if (!snapshot) {
      console.error("[task-e2e] ERROR: no task table snapshot received");
      process.exitCode = 2;
    } else {
      if (rawDiagTrace) {
        console.log(
          "[task-e2e] diag counters =",
          Array.from(diagEvtCounter.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([evt, n]) => `0x${evt.toString(16).padStart(2, "0")}:${n}`)
            .join(", "),
        );
      }
      console.log("[task-e2e] OK");
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[task-e2e] ERROR:", msg);
    process.exitCode = 1;
  } finally {
    try {
      await session.close();
    } catch {
      // ignore
    }
    try {
      await sub.unsubscribe(SERIALPORT_TOPICS.DIAG_TASK_TABLE_SNAPSHOT, "json");
      await sub.disconnect();
    } catch {
      // ignore
    }
  }
}

void main();

