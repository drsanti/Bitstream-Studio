import { create } from "zustand";
import {
  SENSOR_SOURCE_ID_BMI270,
  SENSOR_SOURCE_ID_BMM350,
  SENSOR_SOURCE_ID_DPS368,
  SENSOR_SOURCE_ID_SHT40,
} from "../constants/sensorSourceIds.js";
import { DEVICE_SENSOR_CONFIG_STORAGE_KEY } from "./deviceSensorConfigLocalStorage.js";

/** One row of verified firmware `sensor.cfg` for a `sourceId`. */
export interface DeviceSensorConfigRow {
  sourceId: number;
  enabled: boolean;
  publishMode: number;
  /** Sensor-specific stream mask (BS2 SENSOR_CFG). */
  mask: number;
  samplingIntervalMs: number;
  deltaX100: number;
  minPublishIntervalMs: number;
  /** v2.1 telemetry UART rate; `0` = same as `samplingIntervalMs`. */
  publishIntervalMs: number;
  updatedAtMs: number;
}

interface BitstreamDeviceSensorConfigState {
  bySourceId: Partial<Record<number, DeviceSensorConfigRow>>;
  /** Last firmware-verified rows (GET or SET ack). Draft dirty when it differs. */
  baselineBySourceId: Partial<Record<number, DeviceSensorConfigRow>>;
  /** True after post-handshake cold sync or successful manual refresh. */
  sensorCfgTruthReady: boolean;
  mergeVerifiedDeviceSensorConfig: (
    row: Omit<DeviceSensorConfigRow, "updatedAtMs"> & { updatedAtMs?: number },
  ) => void;
  /** Set draft + baseline from firmware GET/SET ack (clears dirty for those rows). */
  commitFirmwareTruthRows: (rows: DeviceSensorConfigRow[]) => void;
  /** Copy baseline into draft for one or all sensors. */
  revertDraftToBaseline: (sourceId?: number) => void;
  setSensorCfgTruthReady: (ready: boolean) => void;
  resetSensorCfgSyncState: () => void;
  /**
   * Resets **`bySourceId`** to **`SEEDED_DEFAULT_CONFIGS`**. Intended for tests or an explicit
   * “factory reset” UX — **not** invoked on serial disconnect (last verified rows are kept until
   * the next post-handshake **`sensor.cfg.get`** cold sync overwrites them).
   */
  clearDeviceSensorConfigs: () => void;
}

const SEEDED_DEFAULT_CONFIGS: Partial<Record<number, DeviceSensorConfigRow>> = {
  // Zero-ACK UI mode: seed defaults so partial patches never implicitly flip `enabled` to false
  // before we have any bridge runtime snapshot reconciliation.
  [SENSOR_SOURCE_ID_BMI270]: {
    sourceId: SENSOR_SOURCE_ID_BMI270,
    enabled: true,
    publishMode: 2,
    mask: 0x1f,
    samplingIntervalMs: 25,
    deltaX100: 0,
    minPublishIntervalMs: 0,
    publishIntervalMs: 0,
    updatedAtMs: 0,
  },
  [SENSOR_SOURCE_ID_DPS368]: {
    sourceId: SENSOR_SOURCE_ID_DPS368,
    enabled: true,
    publishMode: 2,
    mask: 0xff,
    samplingIntervalMs: 1000,
    deltaX100: 0,
    minPublishIntervalMs: 0,
    publishIntervalMs: 0,
    updatedAtMs: 0,
  },
  [SENSOR_SOURCE_ID_SHT40]: {
    sourceId: SENSOR_SOURCE_ID_SHT40,
    enabled: true,
    publishMode: 2,
    mask: 0xff,
    samplingIntervalMs: 500,
    deltaX100: 50,
    minPublishIntervalMs: 0,
    publishIntervalMs: 0,
    updatedAtMs: 0,
  },
  [SENSOR_SOURCE_ID_BMM350]: {
    sourceId: SENSOR_SOURCE_ID_BMM350,
    enabled: true,
    publishMode: 2,
    mask: 0xff,
    samplingIntervalMs: 50,
    deltaX100: 0,
    minPublishIntervalMs: 0,
    publishIntervalMs: 0,
    updatedAtMs: 0,
  },
};

/** Fresh seeds only — localStorage hydration disabled while sensor cfg pipeline is rebuilt. */
const INITIAL_BY_SOURCE_ID: Partial<Record<number, DeviceSensorConfigRow>> = {
  ...SEEDED_DEFAULT_CONFIGS,
};

function cloneRowMap(
  src: Partial<Record<number, DeviceSensorConfigRow>>,
): Partial<Record<number, DeviceSensorConfigRow>>
{
  return { ...src };
}

export const useBitstreamDeviceSensorConfigStore =
  create<BitstreamDeviceSensorConfigState>((set) => ({
    bySourceId: INITIAL_BY_SOURCE_ID,
    baselineBySourceId: {},
    sensorCfgTruthReady: false,

    mergeVerifiedDeviceSensorConfig: (row) =>
      set((state) => {
        const prev = state.bySourceId[row.sourceId];
        const ts = row.updatedAtMs ?? Date.now();
        if (prev != null && ts < prev.updatedAtMs)
        {
          return state;
        }
        const next: DeviceSensorConfigRow = {
          sourceId: row.sourceId,
          enabled: row.enabled,
          publishMode: row.publishMode,
          mask: row.mask,
          samplingIntervalMs: row.samplingIntervalMs,
          deltaX100: row.deltaX100,
          minPublishIntervalMs: row.minPublishIntervalMs,
          publishIntervalMs: row.publishIntervalMs ?? 0,
          updatedAtMs: ts,
        };
        return {
          bySourceId: {
            ...state.bySourceId,
            [row.sourceId]: next,
          },
        };
      }),

    commitFirmwareTruthRows: (rows) =>
      set((state) => {
        const nextDraft = { ...state.bySourceId };
        const nextBaseline = { ...state.baselineBySourceId };
        for (const row of rows)
        {
          const committed = { ...row };
          nextDraft[row.sourceId] = committed;
          nextBaseline[row.sourceId] = { ...committed };
        }
        return {
          bySourceId: nextDraft,
          baselineBySourceId: nextBaseline,
        };
      }),

    revertDraftToBaseline: (sourceId) =>
      set((state) => {
        if (sourceId == null)
        {
          return {
            bySourceId: cloneRowMap(state.baselineBySourceId),
          };
        }
        const baseline = state.baselineBySourceId[sourceId];
        if (baseline == null)
        {
          return state;
        }
        return {
          bySourceId: {
            ...state.bySourceId,
            [sourceId]: baseline,
          },
        };
      }),

    setSensorCfgTruthReady: (ready) => {
      set({ sensorCfgTruthReady: ready });
    },

    resetSensorCfgSyncState: () => {
      set({
        baselineBySourceId: {},
        sensorCfgTruthReady: false,
      });
    },

    clearDeviceSensorConfigs: () => {
      try
      {
        if (typeof window !== "undefined" && typeof window.localStorage !== "undefined")
        {
          window.localStorage.removeItem(DEVICE_SENSOR_CONFIG_STORAGE_KEY);
        }
      }
      catch
      {
        // ignore
      }
      set({
        bySourceId: SEEDED_DEFAULT_CONFIGS,
        baselineBySourceId: {},
        sensorCfgTruthReady: false,
      });
    },
  }));

export function mergeVerifiedDeviceSensorConfig(
  row: Omit<DeviceSensorConfigRow, "updatedAtMs"> & { updatedAtMs?: number },
): void
{
  useBitstreamDeviceSensorConfigStore
    .getState()
    .mergeVerifiedDeviceSensorConfig(row);
}

export function clearDeviceSensorConfigs(): void
{
  useBitstreamDeviceSensorConfigStore.getState().clearDeviceSensorConfigs();
}
