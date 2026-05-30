/**
 * SerialPort–WebSocket bridge protocol.
 * Types and topic constants for UI ↔ Bridge communication over the T3D WebSocket broker.
 * Platform-agnostic (no Node/serialport deps) so the hook can import from webview.
 */

/** Serializable port info (from SerialPort.list()). */
export interface PortInfo {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  pnpId?: string;
  locationId?: string;
  productId?: string;
  vendorId?: string;
}

/** Status published by bridge on open/close/error. */
export interface SerialPortStatusPayload {
  isOpen: boolean;
  path: string | null;
  baudRate: number | null;
  bytesRead: number;
  bytesWritten: number;
  error?: string;
  leaseId?: string | null;
  leaseOwner?: string | null;
  updatedAt?: number;
}

/**
 * One-second window of **`serialport/data`** (and **`serialport/data-priority`**) chunks observed
 * inside the webview {@link SerialBridgeTransportAdapter} — counts broker→client deliveries, not UART reads.
 */
export interface SerialRxWireWindowStats {
  chunksMainPerSec: number;
  bytesMainPerSec: number;
  chunksPriorityPerSec: number;
  bytesPriorityPerSec: number;
  /** Same as {@link SerialRxWireWindowStats} aggregation window (ms). */
  windowMs: number;
  /** Wall clock when this window was closed (ms since epoch). */
  updatedAtMs: number;
  /** QoS negotiated for the bulk binary `serialport/data` subscription on this transport. */
  bulkDataBinaryQos: 0 | 1;
}

/** Request: list ports. */
export interface ListRequest {
  requestId: string;
}

/** Response: list ports. */
export interface ListResponse {
  requestId: string;
  ports: PortInfo[];
  error?: string;
}

/** Request: open port. */
export interface OpenRequest {
  requestId: string;
  path: string;
  baudRate: number;
  leaseId?: string;
  leaseOwner?: string;
  dataBits?: 5 | 6 | 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd' | 'mark' | 'space';
  /** Data reception mode: 'data' (raw bytes only), 'line' (parsed lines only), or 'both' (both simultaneously). Default: 'data' */
  mode?: 'data' | 'line' | 'both';
  /** Enable readline parsing. Default: false. @deprecated Use mode instead */
  readline?: boolean;
  readlineDelimiter?: string;
  readlineIncludeDelimiter?: boolean;
  readlineEncoding?: string;
}

/** Response: open result. */
export interface OpenResult {
  requestId: string;
  success: boolean;
  error?: string;
  reused?: boolean;
  leaseId?: string | null;
}

/** Request: close port. */
export interface CloseRequest {
  requestId: string;
  leaseId?: string;
}

/** Response: close result. */
export interface CloseResult {
  requestId: string;
  success: boolean;
  error?: string;
  leaseId?: string | null;
}

/** Request: write data. data is string or base64-encoded bytes. */
export interface WriteRequest {
  /** When set, the bridge publishes {@link WriteResult} with the same id (UI can await the result). */
  requestId?: string;
  /** Optional lease guard. When bridge has an active lease, writes must match it. */
  leaseId?: string | null;
  /** Optional per-client identity token (webview instance id). Used for access control policy. */
  actorToken?: string;
  data: string;
}

/** Ack for a write request (published to `WRITE_RESULT`). */
export interface WriteResult {
  requestId: string;
  success: boolean;
  error?: string;
  /** Total bytes written on the session after this write (when success). */
  bytesWritten?: number;
  leaseId?: string | null;
}

/**
 * New baseline command RPC (breaking rewrite): identical conceptually to WriteAwaitAck, but used by
 * the rewritten host/bridge pipeline.
 */
export interface BridgeCommandRequest {
  requestId: string;
  leaseId?: string | null;
  actorToken?: string;
  /** Base64-encoded Bitstream frame bytes (full frame header + payload). */
  frameB64: string;
  /** When true, bridge must await ACK and return `ackFrameB64` on success. */
  awaitAck?: boolean;
  /** Timeout budget per attempt (ms). */
  timeoutMs?: number;
  /** Retry count after first attempt. */
  retryCount?: number;
}

export interface BridgeCommandResult {
  requestId: string;
  success: boolean;
  error?: string;
  ackFrameB64?: string;
  attempts?: number;
  leaseId?: string | null;
  channel?: number;
  sequence?: number;
  corrId?: number;
  ackId?: number;
  queuedMs?: number;
  totalMs?: number;
}

/**
 * JSON fallback for serial chunks from the bridge (base64 `data`).
 * High-volume RX uses WebSocket **binary** on topic {@link SERIALPORT_TOPICS.DATA} instead (no base64).
 * Use this shape when `encoding` is set (e.g. readline UART lines as UTF-8 text).
 */
export interface SerialDataPayload {
  data: string;
  encoding?: string;
  leaseId?: string | null;
}

/**
 * Legacy JSON wrapper for promoted frames (historical). Current bridge publishes **binary**
 * on {@link SERIALPORT_TOPICS.DATA_PRIORITY} (QoS1): full reconstructed Bitstream frame bytes.
 * Optional `reason` existed only when payloads went through JSON+base64.
 */
export interface SerialPriorityDataPayload extends SerialDataPayload {
  /** Why this packet was promoted (debug/telemetry only). */
  reason?: string;
}

export type FirmwareLivenessState = "unknown" | "alive" | "stale" | "dead";

/**
 * Bridge-derived firmware liveness signal based on RX inactivity while the serial port is open.
 * Used to detect "firmware reset / hung" cases where the port stays open but bytes stop flowing.
 */
export interface FirmwareLivenessPayload {
  state: FirmwareLivenessState;
  /** Last time any serial bytes were received (ms since epoch). */
  lastRxAtMs: number | null;
  /** Timestamp of this liveness update (ms since epoch). */
  updatedAtMs: number;
  /** Optional short reason string (e.g. "rx-inactive"). */
  reason?: string;
  leaseId?: string | null;
}

export type BridgeRuntimeConnectionState = "disconnected" | "connecting" | "connected" | "error";
export type BridgeRuntimeHandshakeState = "unknown" | "running" | "passed" | "failed";

export type BridgeAccessControlMode = "lease_only" | "everyone" | "custom";

export interface BridgeRuntimeAccessControl {
  mode: BridgeAccessControlMode;
  /** `actorToken` strings allowed to write when mode === 'custom'. Lease holder is always allowed. */
  writers: string[];
  updatedAtMs: number;
}

export interface BridgeRuntimeClientPresence {
  actorToken: string;
  label?: string;
  lastSeenAtMs: number;
}

export interface BridgeRuntimeOperation {
  type:
    | "bridge-connected"
    | "bridge-disconnected"
    | "ports-detected"
    | "serial-opened"
    | "serial-closed"
    | "serial-error"
    | "serial-write"
    | "serial-write-result"
    | "handshake-state"
    | "host-uart-rx-on"
    | "host-uart-rx-off";
  message: string;
  timestamp: number;
}

/**
 * Optional last-known `sensor.cfg` rows embedded in a runtime snapshot.
 * Keys are firmware `sourceId` values; JSON may stringify numeric keys as strings — clients should coerce.
 * The serial bridge merges inbound snapshots into a short-lived cache and re-attaches it on bridge-published
 * snapshots so late webviews see verified rows without racing the first tab (see `SerialPortWebSocketBridge`).
 */
export type BridgeRuntimeSnapshotSensorConfigs = Record<
  number,
  {
    enabled: boolean;
    publishMode: number;
    samplingIntervalMs: number;
    deltaX100: number;
    minPublishIntervalMs: number;
    publishIntervalMs?: number;
    updatedAtMs?: number;
  }
>;

export interface BridgeRuntimeSnapshotPayload {
  timestamp: number;
  leaseId: string | null;
  leaseOwner: string | null;
  connectionState: BridgeRuntimeConnectionState;
  /**
   * When true, the bridge is the authoritative handshake orchestrator for this serial session.
   * Webview clients must treat {@link handshakeState}/{@link handshakeLastError} as backend truth
   * and avoid running `handshake.run` locally (prevents duplicate handshakes across refresh/multi-client).
   */
  handshakeManagedByBridge?: boolean;
  handshakeState: BridgeRuntimeHandshakeState;
  handshakeLastError: string | null;
  /**
   * Increments each time the bridge completes a **physical** serial OPEN (new UART session).
   * Webviews use this to drop stale `passed` handshake UI after reconnect without guessing.
   */
  serialGeneration?: number;
  serialStatus: SerialPortStatusPayload;
  ports: PortInfo[];
  recentOperations: BridgeRuntimeOperation[];
  /** When set, webview clients merge into the device sensor config store (broker-only cold sync path). */
  sensorConfigs?: BridgeRuntimeSnapshotSensorConfigs;
  /** Multi-client write permission policy (bridge-authoritative). */
  accessControl?: BridgeRuntimeAccessControl;
  /** Recently seen clients (presence pings). */
  clients?: BridgeRuntimeClientPresence[];
}

/** Published by dashboards after `handshake.run`; bridge mirrors into {@link BridgeRuntimeSnapshotPayload}. */
export interface RuntimeHandshakeReportPayload {
  handshakeState: BridgeRuntimeHandshakeState;
  handshakeLastError: string | null;
  atMs: number;
}

/** Request bridge to run the firmware handshake sequence (backend-owned, multi-client safe). */
export interface RuntimeHandshakeRunRequest {
  requestId: string;
  leaseId?: string | null;
  actorToken?: string;
  /** Optional hint for diagnostics/logging only (e.g. "ui-button"). */
  reason?: string;
}

export interface RuntimeHandshakeRunResult {
  requestId: string;
  success: boolean;
  error?: string;
  handshakeState?: BridgeRuntimeHandshakeState;
  handshakeLastError?: string | null;
  /** Total duration when success. */
  totalMs?: number;
  leaseId?: string | null;
}

/** Webview presence ping so the lease holder can grant roles (writer/viewer). */
export interface BridgeClientPresencePayload {
  actorToken: string;
  label?: string;
  atMs: number;
}

/** Lease-holder command to update access control policy. */
export interface BridgeAccessControlSetPayload {
  leaseId: string;
  mode: BridgeAccessControlMode;
  writers?: string[];
}

/**
 * Fan-out payload after a successful `sensor.cfg.set` + verify read on any client.
 * Published on the WebSocket broker so all dashboard instances update control panels.
 */
export interface SensorCfgUpdatedPayload {
  sourceId: number;
  enabled: boolean;
  publishMode: number;
  samplingIntervalMs: number;
  deltaX100: number;
  minPublishIntervalMs: number;
  /** v2.1 telemetry UART rate; `0` = same as `samplingIntervalMs`. */
  publishIntervalMs?: number;
  timestampMs: number;
  requestId?: string;
  /** Stable id per browser/webview instance; used to suppress self-echo toasts. */
  instanceToken?: string;
}

/**
 * Fan-out after a successful `sensor.bmi270.mode.set` on any client so every dashboard instance
 * merges the same Raw / Fusion / Hybrid preference (mirrors {@link SensorCfgUpdatedPayload} pattern).
 */
export interface Bmi270StreamModeUpdatedPayload {
  bmi270StreamMode: "raw" | "fusion" | "hybrid";
  /** When true, publisher committed mode to firmware — peers should update baseline. */
  firmwareApplied?: boolean;
  timestampMs: number;
  instanceToken?: string;
}

/** Fan-out after successful `sensor.bmi270.fusion.feed.set/get` so all clients keep BSX interval in sync. */
export interface Bmi270FusionFeedUpdatedPayload {
  appliedIntervalMs: number;
  timestampMs: number;
  instanceToken?: string;
}

export type DiagTaskStateLabel = "run" | "rdy" | "blk" | "sus" | "del" | "unknown";

export interface DiagTaskRowPayload {
  taskId: number;
  name: string;
  priority: number;
  state: number;
  stackAllocWords: number;
  stackFreeNowWords: number;
  stackMinEverWords: number;
  runTicks: number;
  runCount: number;
  waitTicks: number;
  flags: number;
  cpuPctX100: number;
  healthFlags: number;
}

export interface DiagTaskTableSnapshotPayload {
  /** Firmware timestamp (ms) from task list header. */
  timestampMs: number;
  expectedTaskCount: number;
  rows: DiagTaskRowPayload[];
  /** Host timestamp when this snapshot was published (ms since epoch). */
  publishedAtMs: number;
  /** Task-set epoch from v2 snapshot header `0x91` (when present). */
  epoch?: number;
  /** Delta batch sequence from v2 snapshot header `0x91` (when present). */
  deltaSeq?: number;
  /** Optional decode warning; UI may surface as a banner. */
  warning?: string;
}

export const SERIALPORT_TOPICS = {
  LIST: 'serialport/list',
  LIST_RESPONSE: 'serialport/list-response',
  OPEN: 'serialport/open',
  OPEN_RESULT: 'serialport/open-result',
  CLOSE: 'serialport/close',
  CLOSE_RESULT: 'serialport/close-result',
  WRITE: 'serialport/write',
  WRITE_RESULT: 'serialport/write-result',
  /** New baseline command RPC (breaking rewrite): write frame + await ACK. */
  CMD: 'serialport/cmd',
  CMD_RESULT: 'serialport/cmd-result',
  DATA: 'serialport/data',
  STATUS: 'serialport/status',
  RUNTIME_SNAPSHOT: 'serialport/runtime-snapshot',
  RUNTIME_OPERATION: 'serialport/runtime-operation',
  /** Host/UI reports firmware handshake outcome; bridge fans out via {@link SERIALPORT_TOPICS.RUNTIME_SNAPSHOT}. */
  RUNTIME_HANDSHAKE_REPORT: 'serialport/runtime-handshake-report',
  /** UI requests backend to run handshake (bridge holds lock + updates snapshot). */
  RUNTIME_HANDSHAKE_RUN: 'serialport/runtime-handshake-run',
  RUNTIME_HANDSHAKE_RUN_RESULT: 'serialport/runtime-handshake-run-result',
  /** Webview announces itself for access-control allowlisting. */
  CLIENT_PRESENCE: 'serialport/client-presence',
  /** Lease-holder updates who may write (RBAC-lite). */
  ACCESS_CONTROL_SET: 'serialport/access-control-set',
  /** Verified sensor.cfg snapshot (one sourceId per message). */
  SENSOR_CFG_UPDATED: 'serialport/sensor-cfg-updated',
  /** After verified `sensor.bmi270.mode.set` — UI stream mode (raw / fusion / hybrid). */
  BMI270_STREAM_MODE_UPDATED: 'serialport/bmi270-stream-mode-updated',
  /** After verified `sensor.bmi270.fusion.feed.*` — BSX feed interval in ms. */
  BMI270_FUSION_FEED_UPDATED: 'serialport/bmi270-fusion-feed-updated',
  /** Bridge-derived firmware liveness based on RX inactivity (detect reset/hang). */
  FIRMWARE_LIVENESS: 'serialport/firmware-liveness',
  /** Parsed diagnostics task table snapshot (structured JSON; backend-decoded). */
  DIAG_TASK_TABLE_SNAPSHOT: 'serialport/diag-task-table-snapshot',
  /** QoS1 serial lane for critical frames (ACKs, etc). */
  DATA_PRIORITY: 'serialport/data-priority',
} as const;

export type SerialPortTopic = (typeof SERIALPORT_TOPICS)[keyof typeof SERIALPORT_TOPICS];
