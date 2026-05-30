import { createContext, useContext } from "react";
import type { DiagSnapshotData } from "../types/diagSnapshot.js";
import {
  IDLE_SENSOR_CONFIG_ACK,
  type SensorConfigAckState,
} from "../types/sensorConfigAck.js";
import type { BridgeAccessControlMode } from "../../../serialport-bridge/protocol.js";

export interface BitstreamAppControlApi {
  getSensorConfig: (sourceId: number) => Promise<{
    publishMode: number;
    samplingIntervalMs: number;
    deltaX100: number;
    minPublishIntervalMs: number;
    publishIntervalMs: number;
    enabled: boolean;
  } | null>;
  setSensorConfig: (sourceId: number, patch: {
    publishMode?: number;
    samplingIntervalMs?: number;
    deltaX100?: number;
    minPublishIntervalMs?: number;
    publishIntervalMs?: number;
    enabled?: boolean;
    mask?: number;
  }) => void;
  getBmi270SensorConfig: () => Promise<{
    publishMode: number;
    samplingIntervalMs: number;
    deltaX100: number;
    minPublishIntervalMs: number;
    publishIntervalMs: number;
    enabled: boolean;
  } | null>;
  setBmi270SensorConfig: (patch: {
    publishMode?: number;
    samplingIntervalMs?: number;
    deltaX100?: number;
    minPublishIntervalMs?: number;
    publishIntervalMs?: number;
    enabled?: boolean;
  }) => void;
  setBmi270SamplingIntervalMs: (samplingIntervalMs: number) => void;

  /** BS2 `SENSOR_CFG_SET` for BMI270, BMM350, SHT40, DPS368 at one Hz (returns `samplingIntervalMs`). */
  applyAllSensorsAtHz: (hz: number, options?: { publishMode?: 0 | 1 | 2 }) => number;

  /** Last `sensor.cfg.*` operation; `sourceId` scopes which sensor it refers to. */
  sensorConfigAck: SensorConfigAckState;
  /** Clears {@link sensorConfigAck} to `idle` (e.g. error overlay Dismiss). */
  clearSensorConfigAck: () => void;
  /** Replays last `sensor.cfg` patch or BMI270 output-mode apply after `error`. */
  retrySensorConfigAck: () => void;

  /** GET all four sensors from firmware (manual refresh). */
  refreshAllSensorCfgFromDevice: () => Promise<boolean>;
  /** SET only sensors whose draft differs from baseline. */
  applyDirtySensorConfigs: () => Promise<boolean>;
  /** SET one sensor when its draft differs from baseline. */
  applyDirtySensorConfigForSource: (sourceId: number) => Promise<boolean>;
  /** Revert draft to last firmware truth (one sensor or all). */
  revertSensorCfgDraft: (sourceId?: number) => void;
  /** Legacy sourceIds with unsaved draft changes. */
  listDirtySensorSourceIds: () => number[];
  isSensorCfgDirty: (sourceId: number) => boolean;

  getDiagSnapshot: () => Promise<DiagSnapshotData | null>;
  setDiagTaskPriority: (taskId: number, newPriority: number) => Promise<boolean>;
  setDiagTaskStreamConfig: (options: {
    taskPeriodMs: number;
    maxRowsPerBatch: number;
    priorityMode: "sensor" | "diagnostics";
    resyncPeriodMs: number;
  }) => Promise<{ ok: boolean; message: string }>;
  diagTaskStreamResyncNow: () => Promise<{ ok: boolean; message: string }>;
  startDiagStream: (
    globalPeriodMs: number,
    taskPeriodMs: number,
  ) => Promise<{ ok: boolean; message: string }>;
  stopDiagStream: () => Promise<{ ok: boolean; message: string }>;

  /** Wi‑Fi Bitstream channel (`0x06`); requires handshake CAPS Wi‑Fi bit and firmware support. */
  wifiScanAll: () => Promise<boolean>;
  wifiScanSsid: (ssidSubstring: string) => Promise<boolean>;
  wifiConnect: (ssid: string, password: string, security?: number) => Promise<boolean>;
  wifiDisconnect: () => Promise<boolean>;
  wifiStatusPoll: () => Promise<boolean>;
  wifiPolicyGet: () => Promise<boolean>;
  wifiPolicySet: (autoConnectEnabled: boolean) => Promise<boolean>;

  getFirmwareLogLevel: () => Promise<{
    ok: boolean;
    unsupported: boolean;
    level: number | null;
    errorCode: number | null;
    errorMessage: string | null;
  }>;
  setFirmwareLogLevel: (level: number) => Promise<{
    ok: boolean;
    unsupported: boolean;
    level: number | null;
    errorCode: number | null;
    errorMessage: string | null;
  }>;

  /** Current bridge ACL mode (runtime snapshot). */
  accessControlMode?: BridgeAccessControlMode;
}

export const BitstreamAppControlContext = createContext<BitstreamAppControlApi>({
  getSensorConfig: async () => null,
  setSensorConfig: () => {},
  getBmi270SensorConfig: async () => null,
  setBmi270SensorConfig: () => {},
  setBmi270SamplingIntervalMs: () => {},
  applyAllSensorsAtHz: () => 50,
  sensorConfigAck: IDLE_SENSOR_CONFIG_ACK,
  clearSensorConfigAck: () => {},
  retrySensorConfigAck: () => {},
  refreshAllSensorCfgFromDevice: async () => false,
  applyDirtySensorConfigs: async () => false,
  applyDirtySensorConfigForSource: async () => false,
  revertSensorCfgDraft: () => {},
  listDirtySensorSourceIds: () => [],
  isSensorCfgDirty: () => false,
  getDiagSnapshot: async () => null,
  setDiagTaskPriority: async () => false,
  setDiagTaskStreamConfig: async () => ({ ok: false, message: "No session" }),
  diagTaskStreamResyncNow: async () => ({ ok: false, message: "No session" }),
  startDiagStream: async () => ({ ok: false, message: "No session" }),
  stopDiagStream: async () => ({ ok: false, message: "No session" }),
  wifiScanAll: async () => false,
  wifiScanSsid: async () => false,
  wifiConnect: async () => false,
  wifiDisconnect: async () => false,
  wifiStatusPoll: async () => false,
  wifiPolicyGet: async () => false,
  wifiPolicySet: async () => false,
  getFirmwareLogLevel: async () => ({
    ok: false,
    unsupported: false,
    level: null,
    errorCode: null,
    errorMessage: null,
  }),
  setFirmwareLogLevel: async () => ({
    ok: false,
    unsupported: false,
    level: null,
    errorCode: null,
    errorMessage: null,
  }),
});

export function useBitstreamAppControl(): BitstreamAppControlApi {
  const ctx = useContext(BitstreamAppControlContext);
  return {
    ...ctx,
    sensorConfigAck: ctx.sensorConfigAck ?? IDLE_SENSOR_CONFIG_ACK,
  };
}

