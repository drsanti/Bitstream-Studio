import type { BitstreamTelemetryConfigFieldDef } from "../types";
import {
  BS2_PUBLISH_MODE_LABELS,
  FW_DELTA_MAX_X100,
  FW_SAMPLING_MAX_MS,
  FW_SAMPLING_MIN_MS,
} from "./firmware-limits";

/** Per-sensor SENSOR_CFG fields (BS2 v2.1). */
export function buildSharedSensorConfigSchema(): Record<string, BitstreamTelemetryConfigFieldDef> {
  return {
    enabled: {
      type: "boolean",
      default: true,
      description: "When false, firmware does not stream this sensor.",
    },
    publishMode: {
      type: "enum",
      values: [...BS2_PUBLISH_MODE_LABELS],
      default: "periodic",
      description:
        "periodic = emit on sampling tick; on_change = emit when delta threshold met; hybrid = both gates.",
    },
    mask: {
      type: "u8",
      min: 0,
      max: 255,
      description: "Bitmask of EVT_SENSOR channels (see maskChannels per sensor).",
    },
    samplingIntervalMs: {
      type: "u16",
      min: FW_SAMPLING_MIN_MS,
      max: FW_SAMPLING_MAX_MS,
      description: "Firmware sample period (ms). 0 = no sampling tick.",
    },
    publishIntervalMs: {
      type: "u16",
      min: 0,
      max: FW_SAMPLING_MAX_MS,
      default: 0,
      description: "UART publish decimation (ms). 0 = same as samplingIntervalMs.",
    },
    deltaX100: {
      type: "u16",
      min: 0,
      max: FW_DELTA_MAX_X100,
      description: "Change threshold × 0.01 for on_change / hybrid modes.",
    },
    minPublishIntervalMs: {
      type: "u16",
      min: 0,
      max: FW_SAMPLING_MAX_MS,
      description: "Minimum time between UART publishes (debounce cap).",
    },
  };
}
