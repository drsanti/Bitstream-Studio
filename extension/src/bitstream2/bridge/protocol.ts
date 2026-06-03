/**
 * Bitstream vNext (BS-framed) broker protocol.
 *
 * This file is intentionally platform-agnostic (no Node/browser deps) so both the backend bridge
 * and the webview can import the same topic names and payload shapes.
 */

export const BITSTREAM2_TOPICS = {
  /** Published by backend when it has (re)attached to UART and validated HELLO. */
  HELLO: "bitstream2/hello",
  /** Raw framing/CRC metrics for diagnostics dashboards. */
  METRICS: "bitstream2/metrics",
  /** High-rate decoded sensor samples (structured JSON). */
  EVT_SENSOR: "bitstream2/evt/sensor",
  /** Async status events (Wi‑Fi, warnings, etc). */
  EVT_STATUS: "bitstream2/evt/status",
  /** Diagnostics events (task tables, snapshots). */
  EVT_DIAG: "bitstream2/evt/diag",

  /**
   * Host request/response over broker (optional in v1; UART REQ/RES is still primary).
   * These allow a webview to ask the backend to send REQ to firmware and await RES.
   */
  REQ: "bitstream2/req",
  RES: "bitstream2/res",

  /**
   * Dev/lab: inject device→host UART bytes without MCU (external sim or ws injector).
   * Same decode path as real RX (`BsUartDecoder`).
   */
  DEV_INJECT_RX: "bitstream2/dev/inject-rx",
  /** Dev: bridge publishes external simulator availability after connect. */
  DEV_STATUS: "bitstream2/dev/status",
  /**
   * Simulator firmware snapshot (configs, streams, counters).
   * Published by bitstream-simulator when available.
   */
  DEV_SIM_STATE: "bitstream2/dev/sim/state",
  /**
   * Webview → bitstream-simulator — pause or resume sensor stream timers.
   * Use **idle** when telemetry source is UART (no COM / real firmware).
   */
  DEV_SIM_CONTROL: "bitstream2/dev/sim/control",
  /**
   * Webview → bridge — authoritative telemetry mode (Bitstream UART vs external Simulator).
   * Last writer wins; bridge gates inject-rx vs real COM decode accordingly.
   */
  TELEMETRY_ROUTE: "bitstream2/telemetry/route",
  /** Webview → bitstream-simulator — set waveform (3-sine) config for one channel. */
  DEV_SIM_WAVE_SET: "bitstream2/dev/sim/wave/set",

  /**
   * External simulator (bitstream-simulator process): host UART TX bytes.
   * Bridge publishes; standalone sim subscribes and feeds `rxFromHost`.
   */
  SIM_HOST_TX: "bitstream2/sim/host-tx",
  /** External simulator process heartbeat / capability advertisement. */
  SIM_STATUS: "bitstream2/sim/status",
} as const;

export type Bitstream2Topic = (typeof BITSTREAM2_TOPICS)[keyof typeof BITSTREAM2_TOPICS];

export type Bitstream2HelloPayload = {
  version: number;
  caps: number;
  mtuSensor: number;
  mtuCtrl: number;
  fwTag?: string;
  atMs: number;
};

export type Bitstream2MetricsPayload = {
  /** Total bytes seen from UART since open. */
  uartBytesIn: number;
  /** Total frames accepted (CRC ok). */
  framesOk: number;
  /** Frames rejected by CRC. */
  framesCrcFail: number;
  /** Prefix resync skips (bytes dropped while searching for 'BS '). */
  resyncByteSkips: number;
  /** Frames rejected by invalid LEN cap. */
  framesLenReject: number;
  /** Last accepted frame timestamp. */
  lastFrameAtMs: number | null;
  /** Last accepted sensor counter per sensorId (if available). */
  lastCounterBySensorId?: Record<number, number>;
  atMs: number;
};

export type Bitstream2SensorId = number;

export type Bitstream2SensorSamplePayload = {
  sensorId: Bitstream2SensorId;
  mask: number;
  counter: number;
  tMs: number;
  /**
   * Decoded values in canonical order per sensor+mask.
   * For BMI270 this is ACC->GYR->TMP->EULER->QUAT (see spec).
   */
  values: number[];
  atMs: number;
  /** Set by bridge when publishing — `uart` (real COM) or `sim` (inject-rx). */
  origin?: Bitstream2TelemetrySampleOrigin;
};

export type Bitstream2TelemetrySampleOrigin = "uart" | "sim";

export type Bitstream2TelemetryRouteMode = "uart" | "simulator";

export type Bitstream2TelemetryRoutePayload = {
  mode: Bitstream2TelemetryRouteMode;
  atMs: number;
};

export type Bitstream2StatusEventPayload = {
  kind: number;
  code: number;
  dataB64?: string;
  atMs: number;
};

/** Inner EVT_STATUS payload (Wi‑Fi link/scan/policy) as raw bytes. */
export type Bitstream2WifiEvtPayload = {
  innerB64: string;
  atMs: number;
};

export type Bitstream2DiagEventPayload = {
  diagType: number;
  chunkSeq: number;
  chunkB64: string;
  atMs: number;
};

export type Bitstream2HostReqPayload = {
  requestId: string;
  reqId: number;
  cmdId: number;
  flags?: number;
  bodyB64?: string;
  timeoutMs?: number;
  retryCount?: number;
};

export type Bitstream2HostResPayload = {
  requestId: string;
  ok: boolean;
  reqId?: number;
  cmdId?: number;
  status?: number;
  bodyB64?: string;
  error?: string;
  atMs: number;
};

/** Inject raw BS wire bytes as if received on UART (dev loopback). */
export type Bitstream2DevInjectRxPayload = {
  requestId?: string;
  dataB64: string;
};

export type Bitstream2DevStatusPayload = {
  loopbackEnabled: boolean;
  /** True when bridge routes host UART to `bitstream2/sim/host-tx` (not in-process mock). */
  externalSim?: boolean;
  /** Last observed external sim heartbeat (when `externalSim` is true). */
  externalSimOnline?: boolean;
  atMs: number;
};

/** Host → external simulator UART TX (mirrors serialport/write bytes). */
export type Bitstream2SimHostTxPayload = {
  dataB64: string;
  requestId?: string;
  atMs?: number;
};

/** External simulator process status (`bitstream-simulator` app). */
export type Bitstream2SimStatusPayload = {
  role: string;
  connected: boolean;
  streamingPaused: boolean;
  wsUrl: string;
  atMs: number;
};

/** Mirrors `BsFirmwareSimStatePayload` on the device simulator. */
export type Bitstream2DevSimStatePayload = {
  fwTag: string;
  version: number;
  caps: number;
  mtuSensor: number;
  mtuCtrl: number;
  configs: Array<{
    sensorId: number;
    enabled: boolean;
    publishMode: number;
    mask: number;
    samplingIntervalMs: number;
    publishIntervalMs: number;
    deltaX100: number;
    minPublishIntervalMs: number;
  }>;
  streamActiveSensorIds: number[];
  sampleCountBySensorId: Record<number, number>;
  atMs: number;
};

export type Bitstream2DevSimControlPayload = {
  mode: "idle" | "run";
  atMs: number;
};

export type Bitstream2DevSimWave = {
  freqHz: number;
  amp: number; // 0..1
};

export type Bitstream2DevSimWaveSetPayload = {
  sensorId: number;
  /** Stable channel key (e.g. "bmi270.acc.x"). */
  channelKey: string;
  waves: [Bitstream2DevSimWave, Bitstream2DevSimWave, Bitstream2DevSimWave];
  atMs: number;
};

