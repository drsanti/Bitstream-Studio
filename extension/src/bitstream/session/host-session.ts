import {
  ensureBmi270FusionFeedAckOk,
  ensureBmi270ModeSetAckOk,
  ensureCapsAckOk,
  ensureDiagAckOk,
  ensureHelloAckOk,
  ensureLogLevelAckOk,
  ensurePingAckOk,
  ensureStreamPauseAckOk,
  ensureStreamResumeAckOk,
  ensureSensorCfgGetAckOk,
  ensureSensorCfgSetAckOk,
  ensureSensorReinitAckOk,
  ensureStatusAckOk,
} from "../commands/ack-status";
import {
  decodeBmi270FusionFeedAck,
  decodeBmi270ModeSetAck,
  decodeCapsAck,
  decodeDiagAck,
  decodeHelloAck,
  decodeLogLevelAck,
  decodePingAck,
  decodeSensorCfgGetAck,
  decodeSensorCfgSetAck,
  decodeSensorReinitAck,
  decodeStreamPauseAck,
  decodeStreamResumeAck,
  decodeStatusAck,
  type Bmi270FusionFeedAck,
  type Bmi270ModeSetAck,
  type CapsAck,
  type DiagAck,
  type HelloAck,
  type LogLevelAck,
  type PingAck,
  type SensorCfgGetAck,
  type SensorCfgSetAck,
  type SensorReinitAck,
  type StreamPauseAck,
  type StreamResumeAck,
  type StatusAck,
} from "../commands/ack-decoders";
import {
  DIAG_GET_SNAPSHOT_REQ,
  DIAG_GET_TASK_TABLE_REQ,
  DIAG_SET_TASK_PRIORITY_REQ,
  DIAG_STREAM_START_REQ,
  DIAG_STREAM_STOP_REQ,
  DIAG_TASK_STREAM_CONFIG_SET_REQ,
  DIAG_TASK_STREAM_FILTER_BEGIN_REQ,
  DIAG_TASK_STREAM_FILTER_CHUNK_REQ,
  DIAG_TASK_STREAM_FILTER_COMMIT_REQ,
  DIAG_TASK_STREAM_RESYNC_NOW_REQ,
} from "../commands/diagnostics-commands";
import {
  CAPS_REQ,
  HELLO_REQ,
  LOG_LEVEL_GET_REQ,
  LOG_LEVEL_SET_REQ,
  PING_REQ,
  STREAM_PAUSE_REQ,
  STREAM_RESUME_REQ,
  STATUS_REQ,
} from "../commands/handshake-commands";
import {
  BMI270_FUSION_FEED_GET_REQ,
  BMI270_FUSION_FEED_SET_REQ,
  BMI270_MODE_GET_REQ,
  BMI270_MODE_SET_REQ,
  SENSOR_CFG_GET_REQ,
  SENSOR_CFG_SET_REQ,
  SENSOR_REINIT_REQ,
} from "../commands/sensor-commands";
import type { BitstreamCommandDefinition } from "../commands/command-types";
import {
  decodeWifiConnectAck,
  decodeWifiDisconnectAck,
  decodeWifiPolicyAck,
  decodeWifiScanAck,
  decodeWifiStatusPollAckFrame,
  type WifiConnectAck,
  type WifiPolicyAck,
  type WifiSimpleAck,
} from "../wifi/wifi-ack-decoders";
import {
  decodeWifiScanCompletePayload,
  decodeWifiStatusLikePayload,
  encodeWifiConnectBody,
  encodeWifiCorrBody,
  encodeWifiPolicySetBody,
  encodeWifiScanSsidBody,
  type BitstreamWifiStatusPayload,
} from "../wifi/bitstream-wifi-payload";
import {
  WIFI_CONNECT_REQ,
  WIFI_DISCONNECT_REQ,
  WIFI_POLICY_GET_REQ,
  WIFI_POLICY_SET_REQ,
  WIFI_SCAN_ALL_REQ,
  WIFI_SCAN_SSID_REQ,
  WIFI_STATUS_POLL_REQ,
} from "../wifi/wifi-commands";
import {
  ProtocolEngine,
  type ProtocolEngineOptions,
  type ProtocolRequest,
} from "../engine/protocol-engine";
import type { BitstreamFrame } from "../frame/frame-types";
import {
  BITSTREAM_CHANNEL_DIAGNOSTICS,
  BITSTREAM_CHANNEL_WIFI,
} from "../frame/frame-types";
import { BitstreamFrameDecoder } from "../frame/frame-decoder";
import { decodeBitstreamEvent } from "../events/event-decoder";
import type { BitstreamEvent } from "../events/event-types";
import type { BitstreamSensorSampleV2 } from "../events/sensor-decoder";
import type {
  TransportAdapter,
  TransportState,
} from "../transport/transport-adapter";

export interface HostSessionOptions extends ProtocolEngineOptions {
  transport: TransportAdapter;
  /**
   * When true, the session will never use the backend `writeAwaitAck` path.
   * This is used by the webview "zero-ACK UI" mode.
   */
  disableWriteAwaitAck?: boolean;
}

export type SessionFrameHandler = (frame: BitstreamFrame) => void;
export type SessionEventHandler = (event: BitstreamEvent) => void;
export type SessionSensorSampleHandler = (
  sample: BitstreamSensorSampleV2,
  event: BitstreamEvent,
) => void;
export type AckDecoder<T> = (frame: BitstreamFrame) => T;

export interface SensorCfgSetCommandOptions {
  sourceId: number;
  enabled: boolean;
  publishMode: number;
  samplingIntervalMs: number;
  deltaX100: number;
  minPublishIntervalMs: number;
}

export interface DiagStreamStartCommandOptions {
  diagMajor: number;
  diagMinor: number;
  globalPeriodMs: number;
  taskPeriodMs: number;
}

export interface DiagSetTaskPriorityCommandOptions {
  diagMajor: number;
  diagMinor: number;
  taskId: number;
  newPriority: number;
  requestId: number;
}

export type DiagTaskStreamPriorityMode = "sensor" | "diagnostics";

export interface DiagTaskStreamConfigSetCommandOptions {
  diagMajor: number;
  diagMinor: number;
  taskPeriodMs: number;
  maxRowsPerBatch: number;
  priorityMode: DiagTaskStreamPriorityMode;
  resyncPeriodMs: number;
}

export interface DiagTaskStreamFilterBeginCommandOptions {
  diagMajor: number;
  diagMinor: number;
  txn: number;
  expectedCount: number;
  clearExisting: boolean;
}

export interface DiagTaskStreamFilterChunkCommandOptions {
  diagMajor: number;
  diagMinor: number;
  txn: number;
  chunkIndex: number;
  names: Uint8Array; // Packed fixed 24-byte names, count = names.length / 24.
}

export interface DiagTaskStreamFilterCommitCommandOptions {
  diagMajor: number;
  diagMinor: number;
  txn: number;
}

interface PendingSessionRequest {
  requestId: string;
  resolve: (frame: BitstreamFrame) => void;
  reject: (error: Error) => void;
}

export class HostSession {
  readonly transport: TransportAdapter;
  readonly engine: ProtocolEngine;
  readonly disableWriteAwaitAck: boolean;

  /**
   * Process at most this many inbound frames synchronously per `transport.onData` turn.
   * Larger bursts are continued on macrotasks (`setTimeout`) so the webview can paint and
   * keep `bitstreamLive` timestamps fresh under high sensor rates.
   */
  private static readonly INBOUND_FRAME_DISPATCH_CHUNK = 32;

  private unbindData: (() => void) | null = null;
  private unbindState: (() => void) | null = null;
  private timeoutTimer: ReturnType<typeof setInterval> | null = null;
  private corrId: number = 1;

  private nextCorrId(): number {
    // Reserve 0 for "unset"/debug.
    this.corrId = (this.corrId + 1) & 0xffff;
    if (this.corrId === 0) {
      this.corrId = 1;
    }
    return this.corrId;
  }

  private withCorrId(payload: Uint8Array): { corrId: number; payload: Uint8Array } {
    const corrId = this.nextCorrId();
    const out = new Uint8Array(payload.length + 2);
    out[0] = corrId & 0xff;
    out[1] = (corrId >> 8) & 0xff;
    out.set(payload, 2);
    return { corrId, payload: out };
  }
  private frameHandlers = new Set<SessionFrameHandler>();
  private eventHandlers = new Set<SessionEventHandler>();
  private pendingByRequestId = new Map<string, PendingSessionRequest>();

  /** UI/debug observers must never abort inbound CONTROL ACK decoding or {@link send}. */
  private emitFrameToObservers(frame: BitstreamFrame): void {
    for (const handler of this.frameHandlers) {
      try {
        handler(frame);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[HostSession] frame observer error: ${msg}`, error);
      }
    }
  }

  private emitEventToObservers(event: BitstreamEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[HostSession] event observer error: ${msg}`, error);
      }
    }
  }

  private processInboundFrame(frame: BitstreamFrame): void {
    const completed = this.engine.handleIncomingFrame(frame);
    if (completed) {
      const pending = this.pendingByRequestId.get(completed.requestId);
      if (pending) {
        pending.resolve(frame);
        this.pendingByRequestId.delete(completed.requestId);
      }
    }

    this.emitFrameToObservers(frame);

    const event = decodeBitstreamEvent(frame);
    this.emitEventToObservers(event);
  }

  private dispatchInboundFrames(frames: BitstreamFrame[]): void {
    const chunk = HostSession.INBOUND_FRAME_DISPATCH_CHUNK;
    if (frames.length <= chunk) {
      for (const frame of frames) {
        this.processInboundFrame(frame);
      }
      return;
    }

    let index = 0;
    const pump = (): void => {
      const end = Math.min(index + chunk, frames.length);
      while (index < end) {
        this.processInboundFrame(frames[index]!);
        index += 1;
      }
      if (index < frames.length) {
        setTimeout(pump, 0);
      }
    };
    pump();
  }

  constructor(options: HostSessionOptions) {
    this.transport = options.transport;
    this.engine = new ProtocolEngine(options);
    this.disableWriteAwaitAck = options.disableWriteAwaitAck === true;
  }

  async open(): Promise<void> {
    if (!this.unbindData) {
      this.unbindData = this.transport.onData((bytes) => {
        const frames = this.engine.feed(bytes);
        this.dispatchInboundFrames(frames);
      });
    }

    if (!this.unbindState) {
      this.unbindState = this.transport.onState((state: TransportState) => {
        if (state === "disconnected") {
          this.rejectAllPending(new Error("Transport disconnected"));
          this.engine.reset();
        }
      });
    }

    if (!this.timeoutTimer) {
      this.timeoutTimer = setInterval(() => {
        void this.processTimeouts();
      }, 100);
    }

    await this.transport.open();
  }

  async close(): Promise<void> {
    await this.transport.close();
    if (this.timeoutTimer) {
      clearInterval(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    this.unbindData?.();
    this.unbindState?.();
    this.unbindData = null;
    this.unbindState = null;
    this.rejectAllPending(new Error("Session closed"));
    this.engine.reset();
  }

  /**
   * Reset inbound deframer/decoders without closing the transport (telemetry reconnect).
   * Use when UART is still open but sensor decode timestamps stop advancing.
   */
  resetInboundPipeline(): void {
    this.engine.reset();
  }

  /**
   * After {@link ProtocolEngine.createRequest}, inbound ACK may arrive either on the live MQTT data
   * tap or bundled with {@link writeAwaitAck}. Always completing the tracker avoids orphaned pending
   * rows that trigger spurious timeout retries and duplicate CONTROL writes.
   *
   * When multiple frames decode from one chunk (sensor bursts co-resident with ACK), the CONTROL ACK
   * matching our outbound sequence must be selected — not `frames[0]`.
   */
  private pickWriteAwaitAckReply(
    frames: BitstreamFrame[],
    expectedChannel: number,
    expectedSequence: number,
  ): BitstreamFrame | null {
    const isRequestAckEventId = (eventId: number) => eventId >= 0x80 && eventId <= 0x9f;
    const seqMasked = (seq: number) => seq & 0xffff;
    const want = seqMasked(expectedSequence);
    const strict = frames.find(
      (f) =>
        f.channel === expectedChannel &&
        seqMasked(f.sequence) === want &&
        isRequestAckEventId(f.payload[0] ?? 0),
    );
    if (strict) {
      return strict;
    }
    return (
      frames.find(
        (f) =>
          f.channel === expectedChannel && isRequestAckEventId(f.payload[0] ?? 0),
      ) ?? null
    );
  }

  async send(request: ProtocolRequest): Promise<BitstreamFrame> {
    if (this.pendingByRequestId.has(request.requestId)) {
      throw new Error(`Duplicate requestId: ${request.requestId}`);
    }

    const encoded = this.engine.createRequest(request);

    // If the transport supports backend ACK correlation, use it to make control commands robust
    // (frontend does not rely on QoS0 raw stream delivery to receive ACK frames).
    const transportWithAck = this.transport as unknown as {
      writeAwaitAck?: (
        frame: Uint8Array,
        options?: { timeoutMs?: number; retryCount?: number },
      ) => Promise<Uint8Array>;
    };
    if (!this.disableWriteAwaitAck && typeof transportWithAck.writeAwaitAck === "function") {
      try {
        // IMPORTANT: call as a method to preserve `this` binding for transports that use class fields.
        const ackBytes = await transportWithAck.writeAwaitAck(encoded.frame, {
          timeoutMs: request.timeoutMs,
          retryCount: request.retryCount,
        });
        // Decode the returned ACK bytes using a fresh decoder (do not mix into the streaming decoder
        // which may currently hold partial bytes from the high-volume DATA lane).
        const frames = new BitstreamFrameDecoder().feed(ackBytes).frames;
        const ackFrame =
          this.pickWriteAwaitAckReply(frames, request.channel, encoded.sequence) ??
          frames[0] ??
          null;
        if (!ackFrame) {
          throw new Error(
            "WriteAwaitAck returned bytes that did not decode to any frame (check baud/framing)",
          );
        }
        for (const frame of frames) {
          this.emitFrameToObservers(frame);
          this.emitEventToObservers(decodeBitstreamEvent(frame));
        }
        return ackFrame;
      } finally {
        void this.engine.complete(encoded.sequence);
      }
    }

    return await new Promise<BitstreamFrame>((resolve, reject) => {
      const pending: PendingSessionRequest = {
        requestId: request.requestId,
        resolve,
        reject,
      };
      this.pendingByRequestId.set(request.requestId, pending);

      this.transport.write(encoded.frame).catch((error: unknown) => {
        this.pendingByRequestId.delete(request.requestId);
        this.engine.tracker.complete(encoded.sequence);
        reject(error instanceof Error ? error : new Error(String(error)));
      });
    });
  }

  async sendCommand(options: {
    requestId: string;
    command: BitstreamCommandDefinition;
    payload?: Uint8Array;
    timeoutMs?: number;
    retryCount?: number;
  }): Promise<BitstreamFrame> {
    return await this.send({
      requestId: options.requestId,
      channel: options.command.channel,
      commandId: options.command.commandId,
      payload: options.payload ?? new Uint8Array(),
      timeoutMs: options.timeoutMs,
      retryCount: options.retryCount,
    });
  }

  async sendCommandAndDecode<T>(options: {
    requestId: string;
    command: BitstreamCommandDefinition;
    payload?: Uint8Array;
    decode: AckDecoder<T>;
    timeoutMs?: number;
    retryCount?: number;
  }): Promise<T> {
    const ackFrame = await this.sendCommand({
      requestId: options.requestId,
      command: options.command,
      payload: options.payload,
      timeoutMs: options.timeoutMs,
      retryCount: options.retryCount,
    });
    return options.decode(ackFrame);
  }

  async sendHello(requestId: string, protocolVersion = 2): Promise<HelloAck> {
    const { payload } = this.withCorrId(Uint8Array.of(protocolVersion & 0xff));
    const ack = await this.sendCommandAndDecode({
      requestId,
      command: HELLO_REQ,
      payload,
      decode: decodeHelloAck,
    });
    return ensureHelloAckOk(ack);
  }

  async sendPing(requestId: string, nonce: number): Promise<PingAck> {
    const { payload } = this.withCorrId(Uint8Array.of(nonce & 0xff));
    const ack = await this.sendCommandAndDecode({
      requestId,
      command: PING_REQ,
      payload,
      decode: decodePingAck,
    });
    return ensurePingAckOk(ack);
  }

  async sendCaps(requestId: string): Promise<CapsAck> {
    const { payload } = this.withCorrId(new Uint8Array(0));
    const ack = await this.sendCommandAndDecode({
      requestId,
      command: CAPS_REQ,
      payload,
      decode: decodeCapsAck,
    });
    return ensureCapsAckOk(ack);
  }

  async sendStatus(requestId: string): Promise<StatusAck> {
    const { payload } = this.withCorrId(new Uint8Array(0));
    const ack = await this.sendCommandAndDecode({
      requestId,
      command: STATUS_REQ,
      payload,
      decode: decodeStatusAck,
    });
    return ensureStatusAckOk(ack);
  }

  async sendSensorCfgGet(
    requestId: string,
    sourceId: number,
  ): Promise<SensorCfgGetAck> {
    const { payload } = this.withCorrId(Uint8Array.of(sourceId & 0xff));
    const ack = await this.sendCommandAndDecode({
      requestId,
      command: SENSOR_CFG_GET_REQ,
      payload,
      decode: decodeSensorCfgGetAck,
      // Bandwidth guard: under heavy sensor streaming, CONTROL ACKs can be delayed (not dropped).
      // Give firmware more time and allow a few retries so UI config applies are reliable.
      timeoutMs: 8_000,
      retryCount: 3,
    });
    return ensureSensorCfgGetAckOk(ack);
  }

  async sendSensorCfgSet(
    requestId: string,
    options: SensorCfgSetCommandOptions,
  ): Promise<SensorCfgSetAck> {
    const body = new Uint8Array(9);
    const view = new DataView(body.buffer);
    body[0] = options.sourceId & 0xff;
    body[1] = options.enabled ? 1 : 0;
    body[2] = options.publishMode & 0xff;
    view.setUint16(3, options.samplingIntervalMs & 0xffff, true);
    view.setUint16(5, options.deltaX100 & 0xffff, true);
    view.setUint16(7, options.minPublishIntervalMs & 0xffff, true);
    const { payload } = this.withCorrId(body);

    const ack = await this.sendCommandAndDecode({
      requestId,
      command: SENSOR_CFG_SET_REQ,
      payload,
      decode: decodeSensorCfgSetAck,
      // Bandwidth guard: this command competes with 10–20ms sensor publish frames.
      // CONTROL ACKs may arrive late; extend timeout/retries to avoid spurious failures.
      timeoutMs: 8_000,
      retryCount: 3,
    });
    return ensureSensorCfgSetAckOk(ack);
  }

  async sendSensorCfgSetNoAck(requestId: string, options: SensorCfgSetCommandOptions): Promise<void> {
    if (this.pendingByRequestId.has(requestId)) {
      throw new Error(`Duplicate requestId: ${requestId}`);
    }
    const body = new Uint8Array(9);
    const view = new DataView(body.buffer);
    body[0] = options.sourceId & 0xff;
    body[1] = options.enabled ? 1 : 0;
    body[2] = options.publishMode & 0xff;
    view.setUint16(3, options.samplingIntervalMs & 0xffff, true);
    view.setUint16(5, options.deltaX100 & 0xffff, true);
    view.setUint16(7, options.minPublishIntervalMs & 0xffff, true);
    const { payload } = this.withCorrId(body);
    const encoded = this.engine.createRequest({
      requestId,
      channel: SENSOR_CFG_SET_REQ.channel,
      commandId: SENSOR_CFG_SET_REQ.commandId,
      payload,
    });
    const transportNoAck = this.transport as unknown as {
      writeCmd?: (frame: Uint8Array, options?: { timeoutMs?: number; retryCount?: number }) => Promise<void>;
    };
    try {
      if (typeof transportNoAck.writeCmd === "function") {
        await transportNoAck.writeCmd(encoded.frame);
      } else {
        await this.transport.write(encoded.frame);
      }
    } finally {
      void this.engine.complete(encoded.sequence);
    }
  }

  async sendSensorReinit(requestId: string): Promise<SensorReinitAck> {
    const { payload } = this.withCorrId(new Uint8Array(0));
    const ack = await this.sendCommandAndDecode({
      requestId,
      command: SENSOR_REINIT_REQ,
      payload,
      decode: decodeSensorReinitAck,
    });
    return ensureSensorReinitAckOk(ack);
  }

  async sendBmi270ModeSet(
    requestId: string,
    mode: number,
  ): Promise<Bmi270ModeSetAck> {
    const { payload } = this.withCorrId(Uint8Array.of(mode & 0xff));
    const ack = await this.sendCommandAndDecode({
      requestId,
      command: BMI270_MODE_SET_REQ,
      payload,
      decode: decodeBmi270ModeSetAck,
    });
    return ensureBmi270ModeSetAckOk(ack);
  }

  async sendBmi270ModeSetNoAck(requestId: string, mode: number): Promise<void> {
    if (this.pendingByRequestId.has(requestId)) {
      throw new Error(`Duplicate requestId: ${requestId}`);
    }
    const { payload } = this.withCorrId(Uint8Array.of(mode & 0xff));
    const encoded = this.engine.createRequest({
      requestId,
      channel: BMI270_MODE_SET_REQ.channel,
      commandId: BMI270_MODE_SET_REQ.commandId,
      payload,
    });
    const transportNoAck = this.transport as unknown as {
      writeCmd?: (frame: Uint8Array, options?: { timeoutMs?: number; retryCount?: number }) => Promise<void>;
    };
    try {
      if (typeof transportNoAck.writeCmd === "function") {
        await transportNoAck.writeCmd(encoded.frame);
      } else {
        await this.transport.write(encoded.frame);
      }
    } finally {
      void this.engine.complete(encoded.sequence);
    }
  }

  /** Read current BMI270 stream mode from firmware (does not change device state). */
  async sendBmi270ModeGet(requestId: string): Promise<Bmi270ModeSetAck> {
    const { payload } = this.withCorrId(new Uint8Array(0));
    const ack = await this.sendCommandAndDecode({
      requestId,
      command: BMI270_MODE_GET_REQ,
      payload,
      decode: decodeBmi270ModeSetAck,
    });
    return ensureBmi270ModeSetAckOk(ack);
  }

  async sendBmi270FusionFeedSet(
    requestId: string,
    intervalMs: number,
  ): Promise<Bmi270FusionFeedAck> {
    const body = new Uint8Array(2);
    const view = new DataView(body.buffer);
    view.setUint16(0, intervalMs & 0xffff, true);
    const { payload } = this.withCorrId(body);
    const ack = await this.sendCommandAndDecode({
      requestId,
      command: BMI270_FUSION_FEED_SET_REQ,
      payload,
      decode: decodeBmi270FusionFeedAck,
    });
    return ensureBmi270FusionFeedAckOk(ack);
  }

  async sendBmi270FusionFeedSetNoAck(requestId: string, intervalMs: number): Promise<void> {
    if (this.pendingByRequestId.has(requestId)) {
      throw new Error(`Duplicate requestId: ${requestId}`);
    }
    const body = new Uint8Array(2);
    const view = new DataView(body.buffer);
    view.setUint16(0, intervalMs & 0xffff, true);
    const { payload } = this.withCorrId(body);
    const encoded = this.engine.createRequest({
      requestId,
      channel: BMI270_FUSION_FEED_SET_REQ.channel,
      commandId: BMI270_FUSION_FEED_SET_REQ.commandId,
      payload,
    });
    const transportNoAck = this.transport as unknown as {
      writeCmd?: (frame: Uint8Array, options?: { timeoutMs?: number; retryCount?: number }) => Promise<void>;
    };
    try {
      if (typeof transportNoAck.writeCmd === "function") {
        await transportNoAck.writeCmd(encoded.frame);
      } else {
        await this.transport.write(encoded.frame);
      }
    } finally {
      void this.engine.complete(encoded.sequence);
    }
  }

  async sendBmi270FusionFeedGet(
    requestId: string,
  ): Promise<Bmi270FusionFeedAck> {
    const { payload } = this.withCorrId(new Uint8Array(0));
    const ack = await this.sendCommandAndDecode({
      requestId,
      command: BMI270_FUSION_FEED_GET_REQ,
      payload,
      decode: decodeBmi270FusionFeedAck,
    });
    return ensureBmi270FusionFeedAckOk(ack);
  }

  async sendLogLevelGet(requestId: string): Promise<LogLevelAck> {
    const { payload } = this.withCorrId(new Uint8Array(0));
    const ack = await this.sendCommandAndDecode({
      requestId,
      command: LOG_LEVEL_GET_REQ,
      payload,
      decode: decodeLogLevelAck,
      retryCount: 0,
      timeoutMs: 8_000,
    });
    return ensureLogLevelAckOk(ack);
  }

  async sendLogLevelSet(requestId: string, level: number): Promise<LogLevelAck> {
    const { payload } = this.withCorrId(Uint8Array.of(level & 0xff));
    const ack = await this.sendCommandAndDecode({
      requestId,
      command: LOG_LEVEL_SET_REQ,
      payload,
      decode: decodeLogLevelAck,
      retryCount: 0,
      timeoutMs: 8_000,
    });
    return ensureLogLevelAckOk(ack);
  }

  async sendLogLevelSetNoAck(requestId: string, level: number): Promise<void> {
    if (this.pendingByRequestId.has(requestId)) {
      throw new Error(`Duplicate requestId: ${requestId}`);
    }
    const { payload } = this.withCorrId(Uint8Array.of(level & 0xff));
    const encoded = this.engine.createRequest({
      requestId,
      channel: LOG_LEVEL_SET_REQ.channel,
      commandId: LOG_LEVEL_SET_REQ.commandId,
      payload,
    });
    const transportNoAck = this.transport as unknown as {
      writeCmd?: (frame: Uint8Array, options?: { timeoutMs?: number; retryCount?: number }) => Promise<void>;
    };
    try {
      if (typeof transportNoAck.writeCmd === "function") {
        await transportNoAck.writeCmd(encoded.frame);
      } else {
        await this.transport.write(encoded.frame);
      }
    } finally {
      void this.engine.complete(encoded.sequence);
    }
  }

  async sendStreamPause(
    requestId: string,
    options: { scopeMask: number; durationMs: number },
  ): Promise<StreamPauseAck> {
    const body = new Uint8Array(3);
    const view = new DataView(body.buffer);
    body[0] = options.scopeMask & 0xff;
    view.setUint16(1, options.durationMs & 0xffff, true);
    const { payload } = this.withCorrId(body);
    const ack = await this.sendCommandAndDecode({
      requestId,
      command: STREAM_PAUSE_REQ,
      payload,
      decode: decodeStreamPauseAck,
      retryCount: 0,
      timeoutMs: 8_000,
    });
    return ensureStreamPauseAckOk(ack);
  }

  async sendStreamResume(
    requestId: string,
    options: { scopeMask: number },
  ): Promise<StreamResumeAck> {
    const { payload } = this.withCorrId(Uint8Array.of(options.scopeMask & 0xff));
    const ack = await this.sendCommandAndDecode({
      requestId,
      command: STREAM_RESUME_REQ,
      payload,
      decode: decodeStreamResumeAck,
      retryCount: 0,
      timeoutMs: 8_000,
    });
    return ensureStreamResumeAckOk(ack);
  }

  async sendDiagGetSnapshot(
    requestId: string,
    diagMajor: number,
    diagMinor: number,
  ): Promise<DiagAck> {
    // Diagnostics module reads cmdId from the protocol header (it is prepended to payload in firmware),
    // so the host payload starts at diagMajor/diagMinor.
    const frame = await this.sendCommand({
      requestId,
      command: DIAG_GET_SNAPSHOT_REQ,
      payload: Uint8Array.of(diagMajor & 0xff, diagMinor & 0xff),
    });
    const eventId = frame.payload[0] ?? 0;
    if (eventId === 0x81) {
      return {
        ackId: 0x80,
        ackCommandId: DIAG_GET_SNAPSHOT_REQ.commandId,
        resultCode: 0,
        requestId: 0,
        detail: 0,
      };
    }
    const ack = decodeDiagAck(frame);
    return ensureDiagAckOk(ack, "DIAG_GET_SNAPSHOT_ACK");
  }

  async sendDiagStreamStart(
    requestId: string,
    options: DiagStreamStartCommandOptions,
  ): Promise<DiagAck> {
    const payload = new Uint8Array(6);
    const view = new DataView(payload.buffer);
    payload[0] = options.diagMajor & 0xff;
    payload[1] = options.diagMinor & 0xff;
    view.setUint16(2, options.globalPeriodMs & 0xffff, true);
    view.setUint16(4, options.taskPeriodMs & 0xffff, true);

    const ack = await this.sendCommandAndDecode({
      requestId,
      command: DIAG_STREAM_START_REQ,
      payload,
      decode: decodeDiagAck,
    });
    return ensureDiagAckOk(ack, "DIAG_STREAM_START_ACK");
  }

  async sendDiagStreamStop(
    requestId: string,
    diagMajor: number,
    diagMinor: number,
  ): Promise<DiagAck> {
    const ack = await this.sendCommandAndDecode({
      requestId,
      command: DIAG_STREAM_STOP_REQ,
      payload: Uint8Array.of(diagMajor & 0xff, diagMinor & 0xff),
      decode: decodeDiagAck,
    });
    return ensureDiagAckOk(ack, "DIAG_STREAM_STOP_ACK");
  }

  async sendDiagGetTaskTable(
    requestId: string,
    diagMajor: number,
    diagMinor: number,
  ): Promise<DiagAck> {
    const encoded = this.engine.createRequest({
      requestId,
      channel: DIAG_GET_TASK_TABLE_REQ.channel,
      commandId: DIAG_GET_TASK_TABLE_REQ.commandId,
      payload: Uint8Array.of(diagMajor & 0xff, diagMinor & 0xff),
      timeoutMs: 8000,
      retryCount: 0,
    });

    return await new Promise<DiagAck>((resolve, reject) => {
      const timeoutMs = 8000;
      const timer = setTimeout(() => {
        unsubscribe();
        reject(
          new Error(
            `Request timed out after 1 attempts (requestId=${requestId})`,
          ),
        );
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timer);
        unsubscribe();
      };

      let sawV2Header = false;
      let sawAnyRow = false;
      const unsubscribe = this.onFrame((frame) => {
        if (
          frame.channel !== BITSTREAM_CHANNEL_DIAGNOSTICS ||
          frame.payload.length === 0
        ) {
          return;
        }
        const eventId = frame.payload[0] ?? 0;
        if (eventId === 0x91) {
          // v2 snapshot batch start: wait for explicit end marker 0x93.
          sawV2Header = true;
          return;
        }
        if (eventId === 0x83) {
          sawAnyRow = true;
          // Legacy fallback: if we did not enter v2 mode, row arrival is enough to confirm table path.
          if (!sawV2Header) {
            cleanup();
            resolve({
              ackId: 0x80,
              ackCommandId: DIAG_GET_TASK_TABLE_REQ.commandId,
              resultCode: 0,
              requestId: 0,
              detail: 0,
            });
          }
          return;
        }
        if (eventId === 0x82) {
          // Legacy header observed; keep waiting for at least one row.
          return;
        }
        if (eventId === 0x93) {
          // v2 explicit batch end.
          if (!sawV2Header && !sawAnyRow) {
            return;
          }
          cleanup();
          resolve({
            ackId: 0x80,
            ackCommandId: DIAG_GET_TASK_TABLE_REQ.commandId,
            resultCode: 0,
            requestId: 0,
            detail: 0,
          });
          return;
        }
        if (eventId === 0x80) {
          try {
            const ack = decodeDiagAck(frame);
            if (ack.ackCommandId !== DIAG_GET_TASK_TABLE_REQ.commandId) {
              return;
            }
            cleanup();
            resolve(ensureDiagAckOk(ack, "DIAG_GET_TASK_TABLE_ACK"));
          } catch (error) {
            cleanup();
            reject(error instanceof Error ? error : new Error(String(error)));
          }
        }
      });

      this.transport.write(encoded.frame).catch((error: unknown) => {
        cleanup();
        reject(error instanceof Error ? error : new Error(String(error)));
      });
    });
  }

  async sendDiagSetTaskPriority(
    requestId: string,
    options: DiagSetTaskPriorityCommandOptions,
  ): Promise<DiagAck> {
    const payload = new Uint8Array(7);
    const view = new DataView(payload.buffer);
    payload[0] = options.diagMajor & 0xff;
    payload[1] = options.diagMinor & 0xff;
    view.setUint16(2, options.taskId & 0xffff, true);
    payload[4] = options.newPriority & 0xff;
    view.setUint16(5, options.requestId & 0xffff, true);

    const ack = await this.sendCommandAndDecode({
      requestId,
      command: DIAG_SET_TASK_PRIORITY_REQ,
      payload,
      decode: decodeDiagAck,
    });
    return ensureDiagAckOk(ack, "DIAG_SET_TASK_PRIORITY_ACK");
  }

  async sendDiagTaskStreamConfigSet(
    requestId: string,
    options: DiagTaskStreamConfigSetCommandOptions,
  ): Promise<DiagAck> {
    const payload = new Uint8Array(8);
    const view = new DataView(payload.buffer);
    payload[0] = options.diagMajor & 0xff;
    payload[1] = options.diagMinor & 0xff;
    view.setUint16(2, options.taskPeriodMs & 0xffff, true);
    payload[4] = options.maxRowsPerBatch & 0xff;
    payload[5] = options.priorityMode === "diagnostics" ? 1 : 0;
    view.setUint16(6, options.resyncPeriodMs & 0xffff, true);

    const ack = await this.sendCommandAndDecode({
      requestId,
      command: DIAG_TASK_STREAM_CONFIG_SET_REQ,
      payload,
      decode: decodeDiagAck,
    });
    return ensureDiagAckOk(ack, "DIAG_TASK_STREAM_CONFIG_SET_ACK");
  }

  async sendDiagTaskStreamFilterBegin(
    requestId: string,
    options: DiagTaskStreamFilterBeginCommandOptions,
  ): Promise<DiagAck> {
    const payload = new Uint8Array(5);
    payload[0] = options.diagMajor & 0xff;
    payload[1] = options.diagMinor & 0xff;
    payload[2] = options.txn & 0xff;
    payload[3] = options.expectedCount & 0xff;
    payload[4] = options.clearExisting ? 1 : 0;

    const ack = await this.sendCommandAndDecode({
      requestId,
      command: DIAG_TASK_STREAM_FILTER_BEGIN_REQ,
      payload,
      decode: decodeDiagAck,
    });
    return ensureDiagAckOk(ack, "DIAG_TASK_STREAM_FILTER_BEGIN_ACK");
  }

  async sendDiagTaskStreamFilterChunk(
    requestId: string,
    options: DiagTaskStreamFilterChunkCommandOptions,
  ): Promise<DiagAck> {
    const nameLen = 24;
    if (options.names.length === 0 || options.names.length % nameLen !== 0) {
      throw new Error(
        `DIAG_TASK_STREAM_FILTER_CHUNK: names must be packed fixed ${nameLen}-byte entries`,
      );
    }
    const count = options.names.length / nameLen;
    const payload = new Uint8Array(5 + options.names.length);
    payload[0] = options.diagMajor & 0xff;
    payload[1] = options.diagMinor & 0xff;
    payload[2] = options.txn & 0xff;
    payload[3] = options.chunkIndex & 0xff;
    payload[4] = count & 0xff;
    payload.set(options.names, 5);

    const ack = await this.sendCommandAndDecode({
      requestId,
      command: DIAG_TASK_STREAM_FILTER_CHUNK_REQ,
      payload,
      decode: decodeDiagAck,
    });
    return ensureDiagAckOk(ack, "DIAG_TASK_STREAM_FILTER_CHUNK_ACK");
  }

  async sendDiagTaskStreamFilterCommit(
    requestId: string,
    options: DiagTaskStreamFilterCommitCommandOptions,
  ): Promise<DiagAck> {
    const payload = new Uint8Array(3);
    payload[0] = options.diagMajor & 0xff;
    payload[1] = options.diagMinor & 0xff;
    payload[2] = options.txn & 0xff;

    const ack = await this.sendCommandAndDecode({
      requestId,
      command: DIAG_TASK_STREAM_FILTER_COMMIT_REQ,
      payload,
      decode: decodeDiagAck,
    });
    return ensureDiagAckOk(ack, "DIAG_TASK_STREAM_FILTER_COMMIT_ACK");
  }

  async sendDiagTaskStreamResyncNow(
    requestId: string,
    diagMajor: number,
    diagMinor: number,
  ): Promise<DiagAck> {
    const ack = await this.sendCommandAndDecode({
      requestId,
      command: DIAG_TASK_STREAM_RESYNC_NOW_REQ,
      payload: Uint8Array.of(diagMajor & 0xff, diagMinor & 0xff),
      decode: decodeDiagAck,
    });
    return ensureDiagAckOk(ack, "DIAG_TASK_STREAM_RESYNC_NOW_ACK");
  }

  async sendWifiConnect(
    requestId: string,
    corrId: number,
    security: number,
    ssid: string,
    password: string,
  ): Promise<WifiConnectAck> {
    const payload = encodeWifiConnectBody(corrId, security, ssid, password);
    return await this.sendCommandAndDecode({
      requestId,
      command: WIFI_CONNECT_REQ,
      payload,
      decode: decodeWifiConnectAck,
    });
  }

  async sendWifiConnectNoAck(
    requestId: string,
    corrId: number,
    security: number,
    ssid: string,
    password: string,
  ): Promise<void> {
    if (this.pendingByRequestId.has(requestId)) {
      throw new Error(`Duplicate requestId: ${requestId}`);
    }
    const payload = encodeWifiConnectBody(corrId, security, ssid, password);
    const encoded = this.engine.createRequest({
      requestId,
      channel: WIFI_CONNECT_REQ.channel,
      commandId: WIFI_CONNECT_REQ.commandId,
      payload,
    });
    const transportNoAck = this.transport as unknown as {
      writeCmd?: (frame: Uint8Array, options?: { timeoutMs?: number; retryCount?: number }) => Promise<void>;
    };
    try {
      if (typeof transportNoAck.writeCmd === "function") {
        await transportNoAck.writeCmd(encoded.frame);
      } else {
        await this.transport.write(encoded.frame);
      }
    } finally {
      void this.engine.complete(encoded.sequence);
    }
  }

  async sendWifiDisconnect(
    requestId: string,
    corrId: number,
  ): Promise<WifiSimpleAck> {
    return await this.sendCommandAndDecode({
      requestId,
      command: WIFI_DISCONNECT_REQ,
      payload: encodeWifiCorrBody(corrId),
      decode: decodeWifiDisconnectAck,
    });
  }

  async sendWifiDisconnectNoAck(requestId: string, corrId: number): Promise<void> {
    if (this.pendingByRequestId.has(requestId)) {
      throw new Error(`Duplicate requestId: ${requestId}`);
    }
    const payload = encodeWifiCorrBody(corrId);
    const encoded = this.engine.createRequest({
      requestId,
      channel: WIFI_DISCONNECT_REQ.channel,
      commandId: WIFI_DISCONNECT_REQ.commandId,
      payload,
    });
    const transportNoAck = this.transport as unknown as {
      writeCmd?: (frame: Uint8Array, options?: { timeoutMs?: number; retryCount?: number }) => Promise<void>;
    };
    try {
      if (typeof transportNoAck.writeCmd === "function") {
        await transportNoAck.writeCmd(encoded.frame);
      } else {
        await this.transport.write(encoded.frame);
      }
    } finally {
      void this.engine.complete(encoded.sequence);
    }
  }

  async sendWifiStatusPoll(
    requestId: string,
    corrId: number,
  ): Promise<BitstreamWifiStatusPayload> {
    const frame = await this.sendCommand({
      requestId,
      command: WIFI_STATUS_POLL_REQ,
      payload: encodeWifiCorrBody(corrId),
    });
    if (frame.channel !== BITSTREAM_CHANNEL_WIFI) {
      throw new Error(`WIFI_STATUS_POLL: unexpected channel ${frame.channel}`);
    }
    decodeWifiStatusPollAckFrame(frame);
    const decoded = decodeWifiStatusLikePayload(frame.payload);
    if (decoded == null) {
      throw new Error("WIFI_STATUS_POLL: decode failed");
    }
    return decoded;
  }

  async sendWifiStatusPollNoAck(requestId: string, corrId: number): Promise<void> {
    if (this.pendingByRequestId.has(requestId)) {
      throw new Error(`Duplicate requestId: ${requestId}`);
    }
    const payload = encodeWifiCorrBody(corrId);
    const encoded = this.engine.createRequest({
      requestId,
      channel: WIFI_STATUS_POLL_REQ.channel,
      commandId: WIFI_STATUS_POLL_REQ.commandId,
      payload,
    });
    const transportNoAck = this.transport as unknown as {
      writeCmd?: (frame: Uint8Array, options?: { timeoutMs?: number; retryCount?: number }) => Promise<void>;
    };
    try {
      if (typeof transportNoAck.writeCmd === "function") {
        await transportNoAck.writeCmd(encoded.frame);
      } else {
        await this.transport.write(encoded.frame);
      }
    } finally {
      void this.engine.complete(encoded.sequence);
    }
  }

  async sendWifiScanAll(
    requestId: string,
    corrId: number,
  ): Promise<WifiSimpleAck> {
    return await this.sendCommandAndDecode({
      requestId,
      command: WIFI_SCAN_ALL_REQ,
      payload: encodeWifiCorrBody(corrId),
      decode: decodeWifiScanAck,
    });
  }

  async sendWifiScanAllNoAck(requestId: string, corrId: number): Promise<void> {
    if (this.pendingByRequestId.has(requestId)) {
      throw new Error(`Duplicate requestId: ${requestId}`);
    }
    const payload = encodeWifiCorrBody(corrId);
    const encoded = this.engine.createRequest({
      requestId,
      channel: WIFI_SCAN_ALL_REQ.channel,
      commandId: WIFI_SCAN_ALL_REQ.commandId,
      payload,
    });
    const transportNoAck = this.transport as unknown as {
      writeCmd?: (frame: Uint8Array, options?: { timeoutMs?: number; retryCount?: number }) => Promise<void>;
    };
    try {
      if (typeof transportNoAck.writeCmd === "function") {
        await transportNoAck.writeCmd(encoded.frame);
      } else {
        await this.transport.write(encoded.frame);
      }
    } finally {
      void this.engine.complete(encoded.sequence);
    }
  }

  async sendWifiScanSsid(
    requestId: string,
    corrId: number,
    ssidFilter: string,
  ): Promise<WifiSimpleAck> {
    return await this.sendCommandAndDecode({
      requestId,
      command: WIFI_SCAN_SSID_REQ,
      payload: encodeWifiScanSsidBody(corrId, ssidFilter),
      decode: decodeWifiScanAck,
    });
  }

  async sendWifiScanSsidNoAck(requestId: string, corrId: number, ssidFilter: string): Promise<void> {
    if (this.pendingByRequestId.has(requestId)) {
      throw new Error(`Duplicate requestId: ${requestId}`);
    }
    const payload = encodeWifiScanSsidBody(corrId, ssidFilter);
    const encoded = this.engine.createRequest({
      requestId,
      channel: WIFI_SCAN_SSID_REQ.channel,
      commandId: WIFI_SCAN_SSID_REQ.commandId,
      payload,
    });
    const transportNoAck = this.transport as unknown as {
      writeCmd?: (frame: Uint8Array, options?: { timeoutMs?: number; retryCount?: number }) => Promise<void>;
    };
    try {
      if (typeof transportNoAck.writeCmd === "function") {
        await transportNoAck.writeCmd(encoded.frame);
      } else {
        await this.transport.write(encoded.frame);
      }
    } finally {
      void this.engine.complete(encoded.sequence);
    }
  }

  async sendWifiPolicyGet(
    requestId: string,
    corrId: number,
  ): Promise<WifiPolicyAck> {
    return await this.sendCommandAndDecode({
      requestId,
      command: WIFI_POLICY_GET_REQ,
      payload: encodeWifiCorrBody(corrId),
      decode: decodeWifiPolicyAck,
    });
  }

  async sendWifiPolicyGetNoAck(requestId: string, corrId: number): Promise<void> {
    if (this.pendingByRequestId.has(requestId)) {
      throw new Error(`Duplicate requestId: ${requestId}`);
    }
    const payload = encodeWifiCorrBody(corrId);
    const encoded = this.engine.createRequest({
      requestId,
      channel: WIFI_POLICY_GET_REQ.channel,
      commandId: WIFI_POLICY_GET_REQ.commandId,
      payload,
    });
    const transportNoAck = this.transport as unknown as {
      writeCmd?: (frame: Uint8Array, options?: { timeoutMs?: number; retryCount?: number }) => Promise<void>;
    };
    try {
      if (typeof transportNoAck.writeCmd === "function") {
        await transportNoAck.writeCmd(encoded.frame);
      } else {
        await this.transport.write(encoded.frame);
      }
    } finally {
      void this.engine.complete(encoded.sequence);
    }
  }

  async sendWifiPolicySet(
    requestId: string,
    corrId: number,
    autoConnectEnabled: boolean,
  ): Promise<WifiPolicyAck> {
    return await this.sendCommandAndDecode({
      requestId,
      command: WIFI_POLICY_SET_REQ,
      payload: encodeWifiPolicySetBody(corrId, autoConnectEnabled),
      decode: decodeWifiPolicyAck,
    });
  }

  async sendWifiPolicySetNoAck(
    requestId: string,
    corrId: number,
    autoConnectEnabled: boolean,
  ): Promise<void> {
    if (this.pendingByRequestId.has(requestId)) {
      throw new Error(`Duplicate requestId: ${requestId}`);
    }
    const payload = encodeWifiPolicySetBody(corrId, autoConnectEnabled);
    const encoded = this.engine.createRequest({
      requestId,
      channel: WIFI_POLICY_SET_REQ.channel,
      commandId: WIFI_POLICY_SET_REQ.commandId,
      payload,
    });
    const transportNoAck = this.transport as unknown as {
      writeCmd?: (frame: Uint8Array, options?: { timeoutMs?: number; retryCount?: number }) => Promise<void>;
    };
    try {
      if (typeof transportNoAck.writeCmd === "function") {
        await transportNoAck.writeCmd(encoded.frame);
      } else {
        await this.transport.write(encoded.frame);
      }
    } finally {
      void this.engine.complete(encoded.sequence);
    }
  }

  onFrame(handler: SessionFrameHandler): () => void {
    this.frameHandlers.add(handler);
    return () => {
      this.frameHandlers.delete(handler);
    };
  }

  onEvent(handler: SessionEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => {
      this.eventHandlers.delete(handler);
    };
  }

  onSensorSample(handler: SessionSensorSampleHandler): () => void {
    return this.onEvent((event) => {
      if (event.name !== "SENSOR_SAMPLE_V2" || !event.sensorSample) {
        return;
      }
      handler(event.sensorSample, event);
    });
  }

  private async processTimeouts(): Promise<void> {
    const actions = this.engine.pollTimeouts();

    for (const retry of actions.retries) {
      try {
        await this.transport.write(retry.requestFrame);
      } catch (error: unknown) {
        this.engine.complete(retry.sequence);
        const pending = this.pendingByRequestId.get(retry.requestId);
        if (pending) {
          pending.reject(
            error instanceof Error ? error : new Error(String(error)),
          );
          this.pendingByRequestId.delete(retry.requestId);
        }
      }
    }

    for (const timedOut of actions.expired) {
      const pending = this.pendingByRequestId.get(timedOut.requestId);
      if (pending) {
        pending.reject(
          new Error(
            `Request timed out after ${timedOut.maxAttempts} attempts (requestId=${timedOut.requestId})`,
          ),
        );
        this.pendingByRequestId.delete(timedOut.requestId);
      }
    }
  }

  private rejectAllPending(error: Error): void {
    for (const pending of this.pendingByRequestId.values()) {
      pending.reject(error);
    }
    this.pendingByRequestId.clear();
  }
}
