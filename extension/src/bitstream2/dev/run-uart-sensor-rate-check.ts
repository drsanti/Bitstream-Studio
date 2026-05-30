#!/usr/bin/env npx tsx
/**
 * Open COM, SET BS2 sensors, measure EVT_SENSOR (UART telemetry) rate.
 *
 * npm run bitstream2:uart-sensor-rate-check -- [options]
 * npm run bitstream2:uart-sensor-rate-check -- --help
 *
 * Full flag tables, examples, and pass criteria:
 *   src/bitstream2/dev/UART_TEST_COMMANDS.md
 */
import { intervalMsFromHz } from "../domains/config/sensor-rate-presets";
import { T3DWebSocketClient } from "../../websocket/T3DWebSocketClient";
import { T3D_DEFAULT_WS_CLIENT_URL } from "../../websocket/T3DWebSocketConfig";
import {
  BITSTREAM2_TOPICS,
  type Bitstream2HelloPayload,
  type Bitstream2HostResPayload,
  type Bitstream2SensorSamplePayload,
} from "../bridge/protocol";
import { BS2_CMD } from "../domains/config/commands";
import {
  decodeBmi270FusionFeedResBody,
  decodeBmi270ModeResBody,
  encodeBmi270FusionFeedSetBody,
  encodeBmi270ModeSetBody,
  type Bs2Bmi270StreamMode,
  bmi270StreamModeCodeToUi,
  bmi270StreamModeUiToCode,
} from "../domains/bmi270/bmi270-control";
import {
  decodeSensorCfgBody,
  encodeSensorCfgBody,
  encodeSensorCfgGetBody,
  type Bs2SensorConfig,
} from "../domains/config/sensor-config";
import { base64ToBytes, bytesToBase64 } from "../util/base64";
import {
  SERIALPORT_TOPICS,
  type CloseRequest,
  type OpenRequest,
  type OpenResult,
} from "../../serialport-bridge/protocol";
import { BS2_SENSOR_ID } from "../domains/sensors/sensor-ids";
import { BMI270_MASK, decodeBmi270Values } from "../domains/sensors/bmi270";
import { BMM350_MASK, decodeBmm350Values } from "../domains/sensors/bmm350";
import { SHT40_MASK, decodeSht40Values } from "../domains/sensors/sht40";
import { DPS368_MASK, decodeDps368Values } from "../domains/sensors/dps368";
import { verifySensorPayloadFields } from "./uart-sensor-assert";

const wsUrl = process.env.T3D_WS_CLIENT_URL ?? T3D_DEFAULT_WS_CLIENT_URL;
const SENSOR_NAMES: Record<number, string> = {
  0: "BMI270",
  1: "BMM350",
  2: "SHT40",
  3: "DPS368",
};
const ALL_IDS = [0, 1, 2, 3] as const;
const BMI270_SENSOR_ID = 0;
/** Firmware clamps BMI270_FUSION_FEED interval to 10–100 ms (~10–100 Hz). */
const FUSION_FEED_MIN_MS = 10;
const FUSION_FEED_MAX_MS = 100;

function parseBmi270Mode(): Bs2Bmi270StreamMode {
  const raw = process.argv
    .find((a) => a.startsWith("--bmi270-mode="))
    ?.slice("--bmi270-mode=".length)
    .trim()
    .toLowerCase();
  if (raw == null || raw === "" || raw === "raw") {
    return 0;
  }
  if (raw === "fusion") {
    return 1;
  }
  if (raw === "hybrid") {
    return 2;
  }
  console.error(`Unknown --bmi270-mode: ${raw} (expected raw|fusion|hybrid)`);
  process.exit(1);
}

function parseOptionalHzFlag(primaryFlag: string, altFlag?: string): number | undefined {
  const raw =
    process.argv.find((a) => a.startsWith(primaryFlag))?.slice(primaryFlag.length) ??
    (altFlag != null
      ? process.argv.find((a) => a.startsWith(altFlag))?.slice(altFlag.length)
      : undefined);
  if (raw == null || raw === "") {
    return undefined;
  }
  const hz = Number(raw);
  if (!Number.isFinite(hz) || hz <= 0) {
    console.error(`Invalid ${primaryFlag}${raw} (expected positive number)`);
    process.exit(1);
  }
  return hz;
}

function clampFusionFeedIntervalMs(requestedMs: number): number {
  if (requestedMs < FUSION_FEED_MIN_MS) {
    return FUSION_FEED_MIN_MS;
  }
  if (requestedMs > FUSION_FEED_MAX_MS) {
    return FUSION_FEED_MAX_MS;
  }
  return requestedMs;
}

function parseFlagValue(flag: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(flag));
  if (arg == null) {
    return undefined;
  }
  return arg.slice(flag.length);
}

function parseSensorIdTokens(raw: string, flagName: string): number[] {
  const tokens = raw.split(",").map((t) => t.trim().toLowerCase());
  const ids: number[] = [];
  for (const token of tokens) {
    if (token === "bmi270" || token === "0") ids.push(0);
    else if (token === "bmm350" || token === "1") ids.push(1);
    else if (token === "sht40" || token === "2") ids.push(2);
    else if (token === "dps368" || token === "3") ids.push(3);
    else {
      console.error(`Unknown ${flagName} sensor: ${token}`);
      process.exit(1);
    }
  }
  return [...new Set(ids)];
}

function parseOnlySensorIds(): number[] {
  const raw =
    process.argv.find((a) => a.startsWith("--only="))?.slice(7) ??
    (process.argv.includes("--only-bmi270") ? "bmi270" : undefined);
  if (raw == null || raw === "" || raw === "all") {
    return [...ALL_IDS];
  }
  return parseSensorIdTokens(raw, "--only");
}

function parsePrintOptions(activeIds: number[]): {
  printLive: boolean;
  printSummary: boolean;
  printMaxPerSensor: number;
  printSensorIds: number[];
} {
  const printSummary =
    process.argv.includes("--print-summary") ||
    process.argv.includes("--print-samples") ||
    process.argv.includes("--print");
  const printLive = process.argv.includes("--print-live");
  const rawMax = parseFlagValue("--print-max=");
  const printMaxPerSensor =
    rawMax != null ? Number(rawMax) : printLive ? 10 : 3;
  if (!Number.isFinite(printMaxPerSensor) || printMaxPerSensor < 1) {
    console.error(`Invalid --print-max=${rawMax ?? ""} (expected positive integer)`);
    process.exit(1);
  }
  const printOnlyRaw = parseFlagValue("--print-only=");
  const printSensorIds =
    printOnlyRaw != null && printOnlyRaw !== ""
      ? parseSensorIdTokens(printOnlyRaw, "--print-only")
      : activeIds;
  return {
    printLive,
    printSummary,
    printMaxPerSensor,
    printSensorIds,
  };
}

function valuesToBytes(values: number[]): Uint8Array {
  const out = new Uint8Array(values.length * 2);
  const view = new DataView(out.buffer);
  for (let i = 0; i < values.length; i++) {
    view.setInt16(i * 2, values[i]!, true);
  }
  return out;
}

function formatCx100(v: number | undefined): string {
  return v == null ? "?" : `${(v / 100).toFixed(2)}C`;
}

function formatDecodedFields(sensorId: number, mask: number, values: number[]): string {
  const bytes = valuesToBytes(values);
  if (sensorId === BS2_SENSOR_ID.BMI270) {
    const r = decodeBmi270Values(mask, bytes);
    if (!r.ok) return "decode=FAIL";
    const d = r.decoded;
    const parts: string[] = [];
    if (d.ax_ms2_x100 != null) {
      parts.push(
        `acc=(${(d.ax_ms2_x100 / 100).toFixed(2)},${(d.ay_ms2_x100! / 100).toFixed(2)},${(d.az_ms2_x100! / 100).toFixed(2)})m/s²`,
      );
    }
    if (d.gx_rads_x100 != null) {
      parts.push(
        `gyr=(${(d.gx_rads_x100 / 100).toFixed(3)},${(d.gy_rads_x100! / 100).toFixed(3)},${(d.gz_rads_x100! / 100).toFixed(3)})rad/s`,
      );
    }
    if (d.temp_cx100 != null) parts.push(`temp=${formatCx100(d.temp_cx100)}`);
    if (d.heading_radx100 != null) {
      parts.push(
        `euler=(${d.heading_radx100 / 100},${d.pitch_radx100! / 100},${d.roll_radx100! / 100})rad`,
      );
    }
    if (d.qw_x10000 != null) {
      parts.push(
        `quat=(${d.qw_x10000 / 10000},${d.qx_x10000! / 10000},${d.qy_x10000! / 10000},${d.qz_x10000! / 10000})`,
      );
    }
    return parts.join(" ");
  }
  if (sensorId === BS2_SENSOR_ID.BMM350) {
    const r = decodeBmm350Values(mask, bytes);
    if (!r.ok) return "decode=FAIL";
    const d = r.decoded;
    const parts: string[] = [];
    if (d.mx_ut_x100 != null) parts.push(`mag=(${d.mx_ut_x100},${d.my_ut_x100},${d.mz_ut_x100}) uT×100`);
    if (d.temp_cx100 != null) parts.push(`temp=${formatCx100(d.temp_cx100)}`);
    return parts.join(" ");
  }
  if (sensorId === BS2_SENSOR_ID.SHT40) {
    const r = decodeSht40Values(mask, bytes);
    if (!r.ok) return "decode=FAIL";
    const d = r.decoded;
    const parts: string[] = [];
    if (d.temp_cx100 != null) parts.push(`temp=${formatCx100(d.temp_cx100)}`);
    if (d.rh_x100 != null) parts.push(`rh=${(d.rh_x100 / 100).toFixed(2)}%`);
    return parts.join(" ");
  }
  if (sensorId === BS2_SENSOR_ID.DPS368) {
    const r = decodeDps368Values(mask, bytes);
    if (!r.ok) return "decode=FAIL";
    const d = r.decoded;
    const parts: string[] = [];
    if (d.pressure_hpa_x10 != null) parts.push(`press=${(d.pressure_hpa_x10 / 10).toFixed(1)} hPa`);
    if (d.temp_cx100 != null) parts.push(`temp=${formatCx100(d.temp_cx100)}`);
    return parts.join(" ");
  }
  return "";
}

function formatSensorSampleLine(
  sample: Bitstream2SensorSamplePayload,
  tag: "live" | "summary",
): string {
  const name = SENSOR_NAMES[sample.sensorId] ?? `id${sample.sensorId}`;
  const decoded = formatDecodedFields(sample.sensorId, sample.mask, sample.values);
  const raw = `[${sample.values.join(", ")}]`;
  return (
    `  [${tag}] ${name} counter=${sample.counter} tMs=${sample.tMs} mask=0x${sample.mask.toString(16)} ` +
    `values=${raw} ${decoded}`
  );
}

function pickSummarySamples(
  sensorSamples: Bitstream2SensorSamplePayload[],
  maxPerSensor: number,
): Bitstream2SensorSamplePayload[] {
  if (sensorSamples.length === 0) {
    return [];
  }
  const picked: Bitstream2SensorSamplePayload[] = [];
  const first = sensorSamples[0]!;
  picked.push(first);
  const seenMasks = new Set<number>([first.mask]);
  for (const s of sensorSamples) {
    if (picked.length >= maxPerSensor) {
      break;
    }
    if (!seenMasks.has(s.mask)) {
      picked.push(s);
      seenMasks.add(s.mask);
    }
  }
  const last = sensorSamples[sensorSamples.length - 1]!;
  if (picked[picked.length - 1] !== last && picked.length < maxPerSensor) {
    picked.push(last);
  }
  return picked;
}

function printSummarySection(
  samples: Bitstream2SensorSamplePayload[],
  sensorIds: number[],
  maxPerSensor: number,
): void {
  console.log("\n=== EVT sample dump (decoded) ===");
  for (const sensorId of sensorIds) {
    const list = samples.filter((s) => s.sensorId === sensorId);
    const picked = pickSummarySamples(list, maxPerSensor);
    console.log(
      `--- ${SENSOR_NAMES[sensorId]} (${list.length} evt total, showing ${picked.length}) ---`,
    );
    if (picked.length === 0) {
      console.log("  (no samples)");
      continue;
    }
    for (const s of picked) {
      console.log(formatSensorSampleLine(s, "summary"));
    }
  }
}

function printUsage(): void {
  console.log(`BS2 UART sensor rate + EVT payload check (real MCU, bridge required)

  npm run bitstream2:uart-sensor-rate-check -- [options]

Full documentation: src/bitstream2/dev/UART_TEST_COMMANDS.md

Connection:
  --path=COM3           Serial port (default COM3)
  --baud=921600         Baud rate (default 921600)
  --soak-ms=15000       Soak duration after config (default 15000 ms)
  --settle-ms=600       Post-config settle before clearing EVT buffer (default 600 ms)

Rates (independent):
  --hz=20               Sampling interval via SENSOR_CFG (default 20 Hz)
  --publish-hz=N        UART publish interval (omit → same as --hz)
  --fusion-feed-hz=N    BMI270 BSX feed (default 2× --hz; alt --bsx-feed-hz=)
  --min-pass-ratio=0.6  Pass if evt Hz >= ratio × telemetry Hz (default 0.6)

Sensors:
  --only=bmi270,dps368  Enable subset (names or 0–3; default all)
  --only-bmi270         Shorthand for --only=bmi270
  --bmi270-mode=raw|fusion|hybrid

Print decoded EVT (optional):
  --print-samples       Summary dump after soak (alias --print-summary, --print)
  --print-live          Stream during soak
  --print-max=N         Max lines per sensor (default 3 summary, 10 live)
  --print-only=         Limit print to sensors (same tokens as --only)

  --help, -h            Show this help
`);
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printUsage();
  process.exit(0);
}

const activeSensorIds = parseOnlySensorIds();
const printOpts = parsePrintOptions(activeSensorIds);
const path = parseFlagValue("--path=") ?? "COM3";
const baud = Number(parseFlagValue("--baud=") ?? "921600");
const soakMs = Number(parseFlagValue("--soak-ms=") ?? "15000");
const targetHz = Number(parseFlagValue("--hz=") ?? "20");
const minPassRatio = Number(parseFlagValue("--min-pass-ratio=") ?? "0.6");
const samplingIntervalMs = intervalMsFromHz(targetHz);
const publishHzArg = parseOptionalHzFlag("--publish-hz=");
const publishIntervalMs = publishHzArg != null ? intervalMsFromHz(publishHzArg) : 0;
const telemetryHz = publishHzArg ?? targetHz;
const minPassHz = telemetryHz * minPassRatio;
const fusionFeedHzArg = parseOptionalHzFlag("--fusion-feed-hz=", "--bsx-feed-hz=");
const fusionFeedHz = fusionFeedHzArg ?? targetHz * 2;
const fusionFeedRequestedMs = intervalMsFromHz(fusionFeedHz);
const fusionFeedIntervalMs = clampFusionFeedIntervalMs(fusionFeedRequestedMs);
/** DPS368 pressure ODR is much slower; do not fail the run on its wire rate alone. */
const DPS368_SENSOR_ID = 3;
const bmi270Mode = parseBmi270Mode();

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitUntil(maxMs: number, pred: () => boolean): Promise<boolean> {
  const end = Date.now() + maxMs;
  while (Date.now() < end) {
    if (pred()) return true;
    await sleep(25);
  }
  return pred();
}

async function main(): Promise<void> {
  const helloBox: { payload: Bitstream2HelloPayload | null } = { payload: null };
  const samples: Bitstream2SensorSamplePayload[] = [];
  const resByRequestId = new Map<string, Bitstream2HostResPayload>();
  const livePrintCounts = new Map<number, number>();
  let openOk = false;

  const client = new T3DWebSocketClient(
    { url: wsUrl, autoConnect: true, connectTimeout: 60_000, clientIdentity: { role: "uart-sensor-rate-check" } },
    {
      onMessage: (topic, payload) => {
        if (topic === BITSTREAM2_TOPICS.HELLO) helloBox.payload = payload as Bitstream2HelloPayload;
        if (topic === BITSTREAM2_TOPICS.EVT_SENSOR) {
          const sample = payload as Bitstream2SensorSamplePayload;
          samples.push(sample);
          if (
            printOpts.printLive &&
            printOpts.printSensorIds.includes(sample.sensorId)
          ) {
            const n = livePrintCounts.get(sample.sensorId) ?? 0;
            if (n < printOpts.printMaxPerSensor) {
              livePrintCounts.set(sample.sensorId, n + 1);
              console.log(formatSensorSampleLine(sample, "live"));
            }
          }
        }
        if (topic === BITSTREAM2_TOPICS.RES) {
          const res = payload as Bitstream2HostResPayload;
          if (res.requestId) resByRequestId.set(res.requestId, res);
        }
        if (topic === SERIALPORT_TOPICS.OPEN_RESULT) {
          const r = payload as OpenResult;
          if (r.success) openOk = true;
        }
      },
    },
  );

  await client.connect();
  for (const t of [BITSTREAM2_TOPICS.HELLO, BITSTREAM2_TOPICS.EVT_SENSOR, BITSTREAM2_TOPICS.RES, SERIALPORT_TOPICS.OPEN_RESULT]) {
    await client.subscribe(t, 0, "json");
  }

  const closeReq: CloseRequest = { requestId: `uart-rate-close-${Date.now()}` };
  await client.publish(SERIALPORT_TOPICS.CLOSE, closeReq, 0);
  await sleep(400);
  const openReq: OpenRequest = {
    requestId: `uart-rate-open-${Date.now()}`,
    path,
    baudRate: baud,
    leaseOwner: "run-uart-sensor-rate-check",
  };
  await client.publish(SERIALPORT_TOPICS.OPEN, openReq, 0);
  if (!(await waitUntil(8000, () => openOk))) {
    console.error(`FAIL: could not open ${path}`);
    process.exit(1);
  }
  console.log(`OK  COM ${path} @ ${baud}`);

  if (!(await waitUntil(25_000, () => helloBox.payload != null)) || helloBox.payload == null) {
    console.error("FAIL: no HELLO");
    process.exit(1);
  }
  console.log(`OK  HELLO ${helloBox.payload.fwTag ?? "?"}`);
  const onlyLabel = activeSensorIds.map((id) => SENSOR_NAMES[id]).join(", ");
  console.log(
    `Sampling ${targetHz} Hz (samplingIntervalMs=${samplingIntervalMs}, only: ${onlyLabel})`,
  );
  console.log(
    `Telemetry ${telemetryHz} Hz (publishIntervalMs=${publishIntervalMs || samplingIntervalMs}${publishIntervalMs === 0 ? " [same as sampling]" : ""}, pass >= ${minPassHz.toFixed(1)} Hz)`,
  );
  if (activeSensorIds.includes(BMI270_SENSOR_ID)) {
    console.log(`BMI270 stream mode: ${bmi270StreamModeCodeToUi(bmi270Mode)}`);
    if (bmi270Mode !== bmi270StreamModeUiToCode("raw")) {
      const feedClamped = fusionFeedIntervalMs !== fusionFeedRequestedMs;
      console.log(
        `BMI270 BSX feed ${fusionFeedHz} Hz (fusionFeedIntervalMs=${fusionFeedIntervalMs}${fusionFeedHzArg == null ? ", default 2× --hz" : ""}${feedClamped ? `, clamped from ${fusionFeedRequestedMs} ms` : ""})`,
      );
    }
  }

  const reqTimeoutMs = 4000;
  for (const sensorId of ALL_IDS) {
    const enabled = activeSensorIds.includes(sensorId);
    const cfg: Bs2SensorConfig = {
      sensorId,
      enabled,
      publishMode: 0,
      mask: sensorId === BMI270_SENSOR_ID ? 0x1f : 0x03,
      samplingIntervalMs: enabled ? samplingIntervalMs : 1000,
      deltaX100: 0,
      minPublishIntervalMs: 0,
      publishIntervalMs: enabled ? publishIntervalMs : 0,
    };
    const reqId = `uart-rate-set-${sensorId}-${Date.now()}`;
    await client.publish(
      BITSTREAM2_TOPICS.REQ,
      {
        requestId: reqId,
        reqId: 20 + sensorId,
        cmdId: BS2_CMD.SENSOR_CFG_SET,
        bodyB64: bytesToBase64(encodeSensorCfgBody(cfg)),
        timeoutMs: reqTimeoutMs,
      },
      0,
    );
    const got = await waitUntil(reqTimeoutMs + 500, () => resByRequestId.has(reqId));
    const res = resByRequestId.get(reqId);
    if (!got || !res?.ok) {
      console.error(`FAIL SET ${SENSOR_NAMES[sensorId]}: ${res?.error ?? "no RES"}`);
      process.exit(1);
    }
    const ack = res.bodyB64 != null ? decodeSensorCfgBody(base64ToBytes(res.bodyB64)) : null;
    if (ack == null) {
      console.error(`FAIL SET ${SENSOR_NAMES[sensorId]}: bad ack body`);
      process.exit(1);
    }
    console.log(
      `OK  SET ${SENSOR_NAMES[sensorId]} enabled=${ack.enabled} mode=${ack.publishMode} mask=0x${ack.mask.toString(16)} samp=${ack.samplingIntervalMs}ms pub=${ack.publishIntervalMs || ack.samplingIntervalMs}ms`,
    );
  }

  if (activeSensorIds.includes(BMI270_SENSOR_ID)) {
    const modeTimeoutMs = bmi270Mode === bmi270StreamModeUiToCode("raw") ? reqTimeoutMs : 15000;
    const modeReqId = `uart-rate-bmi270-mode-${Date.now()}`;
    await client.publish(
      BITSTREAM2_TOPICS.REQ,
      {
        requestId: modeReqId,
        reqId: 90,
        cmdId: BS2_CMD.BMI270_MODE_SET,
        bodyB64: bytesToBase64(encodeBmi270ModeSetBody(bmi270Mode)),
        timeoutMs: modeTimeoutMs,
      },
      0,
    );
    const modeGot = await waitUntil(modeTimeoutMs + 500, () => resByRequestId.has(modeReqId));
    const modeRes = resByRequestId.get(modeReqId);
    if (!modeGot || !modeRes?.ok) {
      console.error(`FAIL BMI270_MODE_SET ${bmi270StreamModeCodeToUi(bmi270Mode)}: ${modeRes?.error ?? "no RES"}`);
      process.exit(1);
    }
    const modeAck =
      modeRes.bodyB64 != null ? decodeBmi270ModeResBody(base64ToBytes(modeRes.bodyB64)) : null;
    console.log(
      `OK  BMI270 stream mode ${bmi270StreamModeCodeToUi(bmi270Mode)} (applied=${modeAck != null ? bmi270StreamModeCodeToUi(modeAck) : "?"})`,
    );

    if (bmi270Mode !== bmi270StreamModeUiToCode("raw")) {
      const feedReqId = `uart-rate-bmi270-fusion-feed-${Date.now()}`;
      await client.publish(
        BITSTREAM2_TOPICS.REQ,
        {
          requestId: feedReqId,
          reqId: 91,
          cmdId: BS2_CMD.BMI270_FUSION_FEED_SET,
          bodyB64: bytesToBase64(encodeBmi270FusionFeedSetBody(fusionFeedIntervalMs)),
          timeoutMs: modeTimeoutMs,
        },
        0,
      );
      const feedGot = await waitUntil(modeTimeoutMs + 500, () => resByRequestId.has(feedReqId));
      const feedRes = resByRequestId.get(feedReqId);
      if (!feedGot || !feedRes?.ok) {
        console.error(`FAIL BMI270_FUSION_FEED_SET: ${feedRes?.error ?? "no RES"}`);
        process.exit(1);
      }
      const feedAck =
        feedRes.bodyB64 != null ? decodeBmi270FusionFeedResBody(base64ToBytes(feedRes.bodyB64)) : null;
      const appliedMs = feedAck ?? fusionFeedIntervalMs;
      const appliedHz = (1000 / appliedMs).toFixed(1);
      console.log(`OK  BMI270 BSX feed interval (applied=${appliedMs} ms, ~${appliedHz} Hz)`);
    }
  }

  const settleMs = Number(parseFlagValue("--settle-ms=") ?? "600");
  if (settleMs > 0)
  {
    await sleep(settleMs);
  }
  samples.length = 0;

  const t0 = Date.now();
  if (printOpts.printLive) {
    console.log(
      `\nSoak ${soakMs} ms (measuring EVT_SENSOR, --print-live up to ${printOpts.printMaxPerSensor}/sensor)...`,
    );
  } else {
    console.log(`\nSoak ${soakMs} ms (measuring EVT_SENSOR)...`);
  }
  if (printOpts.printSummary && !printOpts.printLive) {
    console.log(`  (--print-summary: up to ${printOpts.printMaxPerSensor} samples/sensor after soak)`);
  }
  await sleep(soakMs);
  const elapsed = Date.now() - t0;
  let failed = false;
  for (const sensorId of activeSensorIds) {
    const n = samples.filter((s) => s.sensorId === sensorId).length;
    const hz = (n * 1000) / elapsed;
    const name = SENSOR_NAMES[sensorId] ?? `id${sensorId}`;
    const thresholdHz = sensorId === DPS368_SENSOR_ID ? 0.8 : minPassHz;
    const ok = n >= 1 && hz >= thresholdHz;
    const tag = sensorId === DPS368_SENSOR_ID && !ok ? "WARN" : ok ? "OK" : "FAIL";
    console.log(`  ${tag}  ${name}: ${n} evt (${hz.toFixed(1)} Hz)`);
    if (!ok && sensorId !== DPS368_SENSOR_ID)
    {
      failed = true;
    }
  }

  if (activeSensorIds.includes(BMI270_SENSOR_ID) && bmi270Mode !== bmi270StreamModeUiToCode("raw")) {
    const bmiSamples = samples.filter((s) => s.sensorId === BMI270_SENSOR_ID);
    const hasEuler = bmiSamples.some((s) => (s.mask & 0x08) !== 0);
    const hasQuat = bmiSamples.some((s) => (s.mask & 0x10) !== 0);
    const okFusion = hasEuler && hasQuat;
    console.log(`\n=== BMI270 fusion payload (Euler + Quaternion) ===`);
    console.log(`  ${okFusion ? "OK" : "FAIL"}  Euler present=${hasEuler}  Quaternion present=${hasQuat}`);
    const maskCounts = new Map<number, number>();
    for (const s of bmiSamples) {
      maskCounts.set(s.mask, (maskCounts.get(s.mask) ?? 0) + 1);
    }
    const topMasks = [...maskCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    console.log(
      `  masks: ${topMasks.map(([m, c]) => `0x${m.toString(16).padStart(2, "0")}=${c}`).join("  ") || "(none)"}`,
    );
    const anyEulerSample = bmiSamples.find((s) => (s.mask & 0x08) !== 0);
    const anyQuatSample = bmiSamples.find((s) => (s.mask & 0x10) !== 0);
    if (anyEulerSample) {
      console.log(`  first Euler sample valuesLen=${anyEulerSample.values.length}`);
    }
    if (anyQuatSample) {
      console.log(`  first Quaternion sample valuesLen=${anyQuatSample.values.length}`);
    }
    if (!okFusion) {
      failed = true;
    }
  }

  if (printOpts.printSummary) {
    printSummarySection(samples, printOpts.printSensorIds, printOpts.printMaxPerSensor);
  }

  const bmi270CfgMask = 0x1f;
  const cfgMaskBySensor: Record<number, number> = {
    [BMI270_SENSOR_ID]: bmi270CfgMask,
    [BS2_SENSOR_ID.BMM350]: 0x03,
    [BS2_SENSOR_ID.SHT40]: 0x03,
    [BS2_SENSOR_ID.DPS368]: 0x03,
  };
  const payloadErrors = verifySensorPayloadFields(
    activeSensorIds,
    samples,
    cfgMaskBySensor,
    bmi270Mode,
  );
  console.log("\n=== EVT payload fields (mask + scalar count) ===");
  if (payloadErrors.length === 0) {
    console.log("  OK  all enabled sensors include configured mask bits with matching valuesLen");
  } else {
    for (const err of payloadErrors) {
      console.log(`  FAIL  ${err}`);
    }
    failed = true;
  }

  for (const sensorId of ALL_IDS) {
    if (activeSensorIds.includes(sensorId)) {
      continue;
    }
    const n = samples.filter((s) => s.sensorId === sensorId).length;
    if (n > 0) {
      const hz = (n * 1000) / elapsed;
      console.log(`  WARN  ${SENSOR_NAMES[sensorId]}: ${n} evt (${hz.toFixed(1)} Hz) while disabled`);
    }
  }

  console.log("\n=== SENSOR_CFG GET (verify) ===");
  for (const sensorId of ALL_IDS) {
    const reqId = `uart-rate-get-${sensorId}-${Date.now()}`;
    await client.publish(
      BITSTREAM2_TOPICS.REQ,
      {
        requestId: reqId,
        reqId: 40 + sensorId,
        cmdId: BS2_CMD.SENSOR_CFG_GET,
        bodyB64: bytesToBase64(encodeSensorCfgGetBody(sensorId)),
        timeoutMs: reqTimeoutMs,
      },
      0,
    );
    await waitUntil(reqTimeoutMs + 500, () => resByRequestId.has(reqId));
    const res = resByRequestId.get(reqId);
    const ack =
      res?.bodyB64 != null ? decodeSensorCfgBody(base64ToBytes(res.bodyB64)) : null;
    if (ack == null) {
      console.log(`  FAIL GET ${SENSOR_NAMES[sensorId]}`);
      failed = true;
      continue;
    }
    console.log(
      `  ${SENSOR_NAMES[sensorId]} enabled=${ack.enabled} mask=0x${ack.mask.toString(16)} samp=${ack.samplingIntervalMs}ms pub=${ack.publishIntervalMs || ack.samplingIntervalMs}ms mode=${ack.publishMode}`,
    );
  }

  await client.disconnect();
  if (failed) {
    console.error(`\nTelemetry check FAILED (${onlyLabel} below ${minPassHz.toFixed(1)} Hz)`);
    process.exit(1);
  }
  console.log(`\nTelemetry check PASSED (${onlyLabel} >= ${minPassHz.toFixed(1)} Hz)`);
  process.exit(0);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
