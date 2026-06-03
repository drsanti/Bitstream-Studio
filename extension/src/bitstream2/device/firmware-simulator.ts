import { encodeBsEnvelope } from "../framing/bs-envelope";
import { BsFramer } from "../framing/bs-framer";
import { BS2_CMD } from "../domains/config/commands";
import { BS2_WIFI_CMD, BS2_WIFI_EVT_KIND } from "../domains/wifi/commands";
import {
  BS2_RTC_ERR_NTP_NOT_IMPL,
  BS2_RTC_FLAG_VALID,
  BS2_RTC_SOURCE_HOST,
  BS2_TIME_CMD,
} from "../domains/time/commands";
import { encodeRtcStatusBody } from "../domains/time/encode-status";
import type { BitstreamRtcStatusPayload } from "../domains/time/store-types";
import {
  decodeSensorCfgBody,
  effectivePublishIntervalMs,
  encodeSensorCfgBody,
  isSensorStreamRunnable,
  normalizeSensorCfg,
  type Bs2SensorConfig,
} from "../domains/config/sensor-config";
import { encodeHello, type BsHello } from "../protocol/hello";
import { encodeRes, type BsReq } from "../protocol/req-res";
import { encodeEvtSensor } from "../protocol/evt-sensor-encode";
import { BS_TYPE } from "../protocol/types";
import { routeFrame } from "../runtime/router";
import { BS2_SENSOR_ID } from "../domains/sensors/sensor-ids";
import {
  decodeBmi270FusionFeedResBody,
  decodeBmi270ModeResBody,
  encodeBmi270FusionFeedSetBody,
  encodeBmi270ModeSetBody,
  type Bs2Bmi270StreamMode,
} from "../domains/bmi270/bmi270-control";
import { BS2_SIM_BOARD_PROFILE } from "./board-profile";
import { SensorStreamScheduler } from "./sensor-stream";
import { buildSyntheticSensorValues } from "./sensor-synth";
import {
  scalarsFromValuesBytes,
  shouldPublishForConfig,
} from "./publish-gate";

export type BsFirmwareSimulatorOptions = {
  hello?: BsHello;
  defaultSensorConfigs?: Bs2SensorConfig[];
};

/** Snapshot published on `bitstream2/dev/sim/state` for the simulator UI. */
export type BsFirmwareSimStatePayload = {
  fwTag: string;
  version: number;
  caps: number;
  mtuSensor: number;
  mtuCtrl: number;
  configs: Bs2SensorConfig[];
  streamActiveSensorIds: number[];
  sampleCountBySensorId: Record<number, number>;
  atMs: number;
};

type SensorStreamRuntime = {
  lastPublishedScalars: number[] | null;
  lastEmitMs: number;
};

/**
 * Software UART peer — BS protocol device (no MCU).
 * Feed host TX via `rxFromHost`; subscribe via `onTx` for firmware replies.
 */
export class BsFirmwareSimulator {
  private readonly framer = new BsFramer();
  private readonly configs = new Map<number, Bs2SensorConfig>();
  private readonly sampleCountBySensorId = new Map<number, number>();
  private readonly streamRuntime = new Map<number, SensorStreamRuntime>();
  private readonly stream = new SensorStreamScheduler();
  private readonly hello: BsHello;
  private streamingPaused = false;
  private bmi270StreamMode: Bs2Bmi270StreamMode = 0;
  private bmi270FusionFeedIntervalMs = 10;
  private simRtcStatus: BitstreamRtcStatusPayload = {
    unixSec: Math.floor(Date.now() / 1000),
    flags: BS2_RTC_FLAG_VALID,
    source: BS2_RTC_SOURCE_HOST,
    netSyncState: 0,
    lastNetSyncUnix: 0,
    lastError: 0,
  };
  private readonly waveChannels = new Map<
    string,
    { waves: ReadonlyArray<{ freqHz: number; amp: number }> }
  >();

  constructor(
    private readonly onTx: (bytes: Uint8Array) => void,
    options: BsFirmwareSimulatorOptions = {},
  ) {
    this.hello = options.hello ?? { ...BS2_SIM_BOARD_PROFILE.hello };
    const defaults = options.defaultSensorConfigs ?? BS2_SIM_BOARD_PROFILE.defaultSensorConfigs;
    for (const cfg of defaults) {
      this.configs.set(cfg.sensorId, normalizeSensorCfg({ ...cfg }));
    }
  }

  setWaveChannel(
    sensorId: number,
    channelKey: string,
    waves: Array<{ freqHz: number; amp: number }>,
  ): void {
    const key = `${sensorId}:${channelKey}`;
    this.waveChannels.set(key, { waves: waves.slice(0, 3) });
  }

  /** After bridge connect: HELLO + start configured streams (unless paused). */
  onBoot(): void {
    this.emitHello();
    if (!this.streamingPaused) {
      this.resumeAllStreams();
    }
  }

  /** Stop periodic EVT_SENSOR timers (REQ/RES and HELLO still work). */
  setStreamingPaused(paused: boolean): void {
    if (this.streamingPaused === paused) {
      return;
    }
    this.streamingPaused = paused;
    if (paused) {
      this.stream.clearAll();
      return;
    }
    this.resumeAllStreams();
  }

  isStreamingPaused(): boolean {
    return this.streamingPaused;
  }

  private resumeAllStreams(): void {
    for (const cfg of this.configs.values()) {
      this.syncStreamForConfig(cfg);
    }
  }

  getSnapshot(): BsFirmwareSimStatePayload {
    const configs = [...this.configs.values()].sort((a, b) => a.sensorId - b.sensorId);
    const sampleCountBySensorId: Record<number, number> = {};
    for (const [id, n] of this.sampleCountBySensorId) {
      sampleCountBySensorId[id] = n;
    }
    return {
      fwTag: this.hello.fwTag ?? "bs2-sim",
      version: this.hello.version,
      caps: this.hello.caps,
      mtuSensor: this.hello.mtuSensor,
      mtuCtrl: this.hello.mtuCtrl,
      configs,
      streamActiveSensorIds: this.stream.activeSensorIds(),
      sampleCountBySensorId,
      atMs: Date.now(),
    };
  }

  emitHello(): void {
    const payload = encodeHello(this.hello);
    this.txFrame(BS_TYPE.HELLO, payload);
  }

  /** @deprecated Use `emitSensorSample`. */
  emitBmi270AccSample(tMs = Date.now()): void {
    this.emitSensorSample(BS2_SENSOR_ID.BMI270, tMs);
  }

  /** @deprecated Use `emitSensorSample`. */
  emitBmi270Sample(tMs = Date.now()): void {
    this.emitSensorSample(BS2_SENSOR_ID.BMI270, tMs);
  }

  /** Force one EVT_SENSOR (bypasses publish gating). */
  emitSensorSample(sensorId: number, tMs = Date.now()): void {
    const cfg = this.getOrDefaultConfig(sensorId);
    const mask = cfg.mask & 0xff;
    if (mask === 0) return;
    const rt = this.getOrCreateRuntime(sensorId);
    const getWavesForChannel = (channelKey: string): Array<{ freqHz: number; amp: number }> | null =>
      (this.waveChannels.get(`${sensorId}:${channelKey}`)?.waves as Array<{ freqHz: number; amp: number }> | undefined) ??
      null;
    const valuesBytes = buildSyntheticSensorValues(sensorId, mask, tMs, getWavesForChannel);
    this.txSensorPayload(sensorId, mask, valuesBytes, tMs);
    rt.lastPublishedScalars = scalarsFromValuesBytes(valuesBytes);
    rt.lastEmitMs = tMs;
  }

  rxFromHost(chunk: Uint8Array): void {
    const frames = this.framer.feed(chunk);
    for (const frame of frames) {
      const routed = routeFrame(frame);
      if (routed.type !== "req") continue;
      this.handleReq(routed.req);
    }
  }

  dispose(): void {
    this.stream.clearAll();
    this.streamRuntime.clear();
  }

  private handleReq(req: BsReq): void {
    switch (req.cmdId) {
      case BS2_CMD.PING:
        this.reply(req, 0, new Uint8Array(0));
        return;
      case BS2_CMD.CAPS_GET:
        this.reply(req, 0, Uint8Array.of(this.hello.caps & 0xff, (this.hello.caps >> 8) & 0xff));
        return;
      case BS2_CMD.SENSOR_CFG_GET: {
        const sensorId = req.body[0] ?? BS2_SENSOR_ID.BMI270;
        const cfg = this.getOrDefaultConfig(sensorId);
        this.reply(req, 0, encodeSensorCfgBody(cfg));
        return;
      }
      case BS2_CMD.SENSOR_CFG_SET: {
        const cfg = decodeSensorCfgBody(req.body);
        if (!cfg) {
          this.reply(req, 1, new Uint8Array(0));
          return;
        }
        const normalized = normalizeSensorCfg(cfg);
        this.configs.set(normalized.sensorId, normalized);
        this.resetStreamRuntime(normalized.sensorId);
        this.syncStreamForConfig(normalized);
        this.reply(req, 0, encodeSensorCfgBody(normalized));
        return;
      }
      case BS2_CMD.STREAM_MASK_SET: {
        const sensorId = req.body[0] ?? 0;
        const mask = req.body[1] ?? 0;
        const cfg = this.getOrDefaultConfig(sensorId);
        const next = normalizeSensorCfg({ ...cfg, mask: mask & 0xff });
        this.configs.set(sensorId, next);
        this.resetStreamRuntime(sensorId);
        this.syncStreamForConfig(next);
        this.reply(req, 0, encodeSensorCfgBody(next));
        return;
      }
      case BS2_CMD.STREAM_RATE_SET: {
        const sensorId = req.body[0] ?? 0;
        const samplingIntervalMs =
          req.body.byteLength >= 3
            ? new DataView(req.body.buffer, req.body.byteOffset, req.body.byteLength).getUint16(
                1,
                true,
              )
            : 0;
        const cfg = this.getOrDefaultConfig(sensorId);
        const next = normalizeSensorCfg({ ...cfg, samplingIntervalMs });
        this.configs.set(sensorId, next);
        this.resetStreamRuntime(sensorId);
        this.syncStreamForConfig(next);
        this.reply(req, 0, encodeSensorCfgBody(next));
        return;
      }
      case BS2_CMD.BMI270_MODE_SET: {
        if (req.body.byteLength < 1) {
          this.reply(req, 1, new Uint8Array(0));
          return;
        }
        const mode = req.body[0] ?? 0;
        if (mode > 2) {
          this.reply(req, 2, Uint8Array.of(this.bmi270StreamMode));
          return;
        }
        this.bmi270StreamMode = mode as Bs2Bmi270StreamMode;
        this.reply(req, 0, Uint8Array.of(this.bmi270StreamMode));
        return;
      }
      case BS2_CMD.BMI270_MODE_GET: {
        this.reply(req, 0, Uint8Array.of(this.bmi270StreamMode));
        return;
      }
      case BS2_CMD.BMI270_FUSION_FEED_SET: {
        if (req.body.byteLength < 2) {
          this.reply(req, 1, new Uint8Array(0));
          return;
        }
        const intervalMs = decodeBmi270FusionFeedResBody(req.body) ?? 10;
        const clamped = Math.max(10, Math.min(100, Math.round(intervalMs)));
        this.bmi270FusionFeedIntervalMs = clamped;
        this.reply(req, 0, encodeBmi270FusionFeedSetBody(clamped));
        return;
      }
      case BS2_CMD.BMI270_FUSION_FEED_GET: {
        this.reply(req, 0, encodeBmi270FusionFeedSetBody(this.bmi270FusionFeedIntervalMs));
        return;
      }
      case BS2_WIFI_CMD.SCAN_ALL:
      case BS2_WIFI_CMD.SCAN_SSID: {
        this.reply(req, 0, new Uint8Array(0));
        this.simulateWifiScan(req.reqId);
        return;
      }
      case BS2_WIFI_CMD.STATUS_GET: {
        const snap = this.encodeSimWifiLinkPayload(req.reqId, 2, -42, 0, "TESAIoT-SIM");
        this.reply(req, 0, snap.subarray(3));
        return;
      }
      case BS2_WIFI_CMD.CONNECT:
      case BS2_WIFI_CMD.DISCONNECT:
      case BS2_WIFI_CMD.POLICY_GET:
      case BS2_WIFI_CMD.POLICY_SET: {
        this.reply(req, 0, new Uint8Array(0));
        return;
      }
      case BS2_TIME_CMD.GET: {
        this.simRtcStatus.unixSec = Math.floor(Date.now() / 1000);
        this.reply(req, 0, encodeRtcStatusBody(this.simRtcStatus));
        return;
      }
      case BS2_TIME_CMD.SET: {
        if (req.body.byteLength < 6)
        {
          this.reply(req, 1, Uint8Array.of(1, 4));
          return;
        }
        const view = new DataView(req.body.buffer, req.body.byteOffset, req.body.byteLength);
        this.simRtcStatus = {
          ...this.simRtcStatus,
          unixSec: view.getUint32(0, true),
          flags: BS2_RTC_FLAG_VALID,
          source: BS2_RTC_SOURCE_HOST,
          lastError: 0,
        };
        this.reply(req, 0, Uint8Array.of(0, 0));
        return;
      }
      case BS2_TIME_CMD.SYNC: {
        this.reply(req, 1, Uint8Array.of(1, BS2_RTC_ERR_NTP_NOT_IMPL));
        return;
      }
      default:
        this.reply(req, 0xff, new Uint8Array(0));
    }
  }

  private syncStreamForConfig(cfg: Bs2SensorConfig): void {
    const sensorId = cfg.sensorId;
    if (this.streamingPaused || !isSensorStreamRunnable(cfg)) {
      this.stream.clear(sensorId);
      return;
    }
    this.stream.setStream(sensorId, cfg.samplingIntervalMs, () => {
      this.onSensorSampleTick(sensorId);
    });
  }

  private onSensorSampleTick(sensorId: number): void {
    const cfg = this.getOrDefaultConfig(sensorId);
    const mask = cfg.mask & 0xff;
    if (!isSensorStreamRunnable(cfg) || mask === 0) {
      return;
    }

    const rt = this.getOrCreateRuntime(sensorId);
    const nowMs = Date.now();
    const getWavesForChannel = (channelKey: string): Array<{ freqHz: number; amp: number }> | null =>
      (this.waveChannels.get(`${sensorId}:${channelKey}`)?.waves as Array<{ freqHz: number; amp: number }> | undefined) ??
      null;
    const valuesBytes = buildSyntheticSensorValues(sensorId, mask, nowMs, getWavesForChannel);
    const current = scalarsFromValuesBytes(valuesBytes);
    const publishMs = effectivePublishIntervalMs(cfg);
    const periodicDue =
      rt.lastEmitMs <= 0 || nowMs - rt.lastEmitMs >= publishMs;
    const changeDue = shouldPublishForConfig(
      cfg,
      current,
      rt.lastPublishedScalars,
      rt.lastEmitMs,
      nowMs,
    );

    let emit = false;
    switch (cfg.publishMode) {
      case 0:
        emit = periodicDue;
        break;
      case 1:
        emit = changeDue;
        break;
      case 2:
        emit = periodicDue || changeDue;
        break;
      default:
        emit = periodicDue;
    }

    if (!emit) {
      return;
    }

    this.txSensorPayload(sensorId, mask, valuesBytes, nowMs);
    rt.lastPublishedScalars = current;
    rt.lastEmitMs = nowMs;
  }

  private txSensorPayload(
    sensorId: number,
    mask: number,
    valuesBytes: Uint8Array,
    tMs: number,
  ): void {
    const counter = (this.sampleCountBySensorId.get(sensorId) ?? 0) + 1;
    this.sampleCountBySensorId.set(sensorId, counter);
    const payload = encodeEvtSensor({
      sensorId,
      mask,
      counter,
      tMs: tMs >>> 0,
      valuesBytes,
    });
    this.txFrame(BS_TYPE.EVT_SENSOR, payload);
  }

  private getOrDefaultConfig(sensorId: number): Bs2SensorConfig {
    return (
      this.configs.get(sensorId) ??
      normalizeSensorCfg({
        sensorId,
        enabled: false,
        publishMode: 0,
        mask: 0,
        samplingIntervalMs: 0,
        publishIntervalMs: 0,
        deltaX100: 0,
        minPublishIntervalMs: 0,
      })
    );
  }

  private getOrCreateRuntime(sensorId: number): SensorStreamRuntime {
    let rt = this.streamRuntime.get(sensorId);
    if (!rt) {
      rt = { lastPublishedScalars: null, lastEmitMs: 0 };
      this.streamRuntime.set(sensorId, rt);
    }
    return rt;
  }

  private resetStreamRuntime(sensorId: number): void {
    this.streamRuntime.delete(sensorId);
  }

  private reply(req: BsReq, status: number, body: Uint8Array): void {
    const payload = encodeRes({
      reqId: req.reqId,
      cmdId: req.cmdId,
      status,
      body,
    });
    this.txFrame(BS_TYPE.RES, payload);
  }

  private txFrame(type: number, payload: Uint8Array): void {
    const wire = encodeBsEnvelope({ type, payload }).bytes;
    this.onTx(wire);
  }

  private encodeSimWifiLinkPayload(
    reqId: number,
    state: number,
    rssi: number,
    reason: number,
    ssid: string,
  ): Uint8Array {
    const pl = new Uint8Array(41);
    const view = new DataView(pl.buffer);
    view.setUint16(0, reqId & 0xffff, true);
    pl[2] = BS2_WIFI_EVT_KIND.LINK;
    pl[3] = state & 0xff;
    view.setInt16(4, rssi, true);
    view.setUint16(6, reason, true);
    const enc = new TextEncoder();
    const raw = enc.encode(ssid);
    pl.set(raw.subarray(0, Math.min(32, raw.length)), 8);
    return pl;
  }

  private encodeSimWifiScanRow(
    reqId: number,
    index: number,
    total: number,
    ssid: string,
    rssi: number,
  ): Uint8Array {
    const pl = new Uint8Array(52);
    const view = new DataView(pl.buffer);
    view.setUint16(0, reqId & 0xffff, true);
    pl[2] = BS2_WIFI_EVT_KIND.SCAN_ROW;
    view.setUint16(3, index, true);
    view.setUint16(5, total, true);
    view.setInt16(7, rssi, true);
    pl[9] = 6;
    view.setUint32(10, 0x00200000, true);
    const enc = new TextEncoder();
    const raw = enc.encode(ssid);
    pl.set(raw.subarray(0, Math.min(32, raw.length)), 14);
    return pl;
  }

  private encodeSimWifiScanDone(reqId: number, total: number): Uint8Array {
    const pl = new Uint8Array(7);
    const view = new DataView(pl.buffer);
    view.setUint16(0, reqId & 0xffff, true);
    pl[2] = BS2_WIFI_EVT_KIND.SCAN_DONE;
    view.setUint16(3, total, true);
    view.setUint16(5, 0, true);
    return pl;
  }

  private simulateWifiScan(reqId: number): void {
    const aps: Array<{ ssid: string; rssi: number }> = [
      { ssid: "TESAIoT-SIM-1", rssi: -45 },
      { ssid: "TESAIoT-SIM-2", rssi: -58 },
      { ssid: "Office-Guest", rssi: -67 },
    ];
    const total = aps.length;
    for (let i = 0; i < total; i++) {
      const row = aps[i];
      if (!row) continue;
      this.txFrame(BS_TYPE.EVT_STATUS, this.encodeSimWifiScanRow(reqId, i, total, row.ssid, row.rssi));
    }
    this.txFrame(BS_TYPE.EVT_STATUS, this.encodeSimWifiScanDone(reqId, total));
  }
}

/** @deprecated Use `BsFirmwareSimulator` — kept for existing imports/tests. */
export const BsMockFirmware = BsFirmwareSimulator;

export type BsMockFirmwareOptions = BsFirmwareSimulatorOptions;

/** Loopback pair: host write → simulator RX; simulator TX → host RX. */
export function createBsMockLoopback(
  options: BsFirmwareSimulatorOptions = {},
): {
  mock: BsFirmwareSimulator;
  hostWrite: (bytes: Uint8Array) => void;
  onHostRx: (handler: (bytes: Uint8Array) => void) => void;
} {
  let hostRx: ((bytes: Uint8Array) => void) | null = null;
  const mock = new BsFirmwareSimulator((bytes) => hostRx?.(bytes), options);
  return {
    mock,
    hostWrite: (bytes) => mock.rxFromHost(bytes),
    onHostRx: (handler) => {
      hostRx = handler;
    },
  };
}
