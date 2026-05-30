/*******************************************************************************
 * File Name : telemetryMetaDisplay.ts
 *
 * Description : Telemetry Meta row labels and fixed-width Hz / counter display.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { BitstreamSensorSourceHint } from "../../../bitstream/events/sensor-decoder.js";
import type { StreamHzByHint } from "./telemetryStreamRate.js";

export type TelemetryMetaDisplayMode = "counter" | "hz" | "both";

export type TelemetryMetaRateSource = "device" | "host" | "counter" | "smoothed";

export const TELEMETRY_META_HZ_SLOT_CHARS = 7;

export const TELEMETRY_META_HZ_PLACEHOLDER = "--.--".padStart(TELEMETRY_META_HZ_SLOT_CHARS, " ");

/** Fixed-width Hz value for TRNParameter (2 decimals). */
export function formatTelemetryMetaHzFixed(hz: number | null | undefined): string {
  if (hz == null || !Number.isFinite(hz) || hz < 0)
  {
    return TELEMETRY_META_HZ_PLACEHOLDER;
  }
  if (hz > 9999)
  {
    return ">9999".padStart(TELEMETRY_META_HZ_SLOT_CHARS, " ");
  }
  const clamped = Math.min(9999, hz);
  return clamped.toFixed(2).padStart(TELEMETRY_META_HZ_SLOT_CHARS, " ");
}

export function isTelemetryMetaDisplayMode(value: string): value is TelemetryMetaDisplayMode {
  return value === "counter" || value === "hz" || value === "both";
}

export function isTelemetryMetaRateSource(value: string): value is TelemetryMetaRateSource {
  return (
    value === "device" ||
    value === "host" ||
    value === "counter" ||
    value === "smoothed"
  );
}

/** Pick smoothed Hz for the selected rate source. */
export function pickTelemetryMetaHz(args: {
  rateSource: TelemetryMetaRateSource;
  hint: BitstreamSensorSourceHint;
  streamHzDeviceByHint: StreamHzByHint;
  streamHzHostByHint: StreamHzByHint;
  streamHzCounterByHint: StreamHzByHint;
  streamHzSmoothedByHint: StreamHzByHint;
}): number | null {
  const {
    rateSource,
    hint,
    streamHzDeviceByHint,
    streamHzHostByHint,
    streamHzCounterByHint,
    streamHzSmoothedByHint,
  } = args;

  switch (rateSource)
  {
    case "host":
      return streamHzHostByHint[hint];
    case "counter":
      return streamHzCounterByHint[hint];
    case "smoothed":
      return streamHzSmoothedByHint[hint];
    case "device":
    default:
      return streamHzDeviceByHint[hint];
  }
}

export function telemetryMetaRowLabel(sensorLabel: string, mode: TelemetryMetaDisplayMode): string {
  switch (mode)
  {
    case "hz":
      return `${sensorLabel} stream rate`;
    case "both":
      return `${sensorLabel} counter · rate`;
    case "counter":
    default:
      return `${sensorLabel} sample counter`;
  }
}

export function buildTelemetryMetaRowDisplay(args: {
  displayMode: TelemetryMetaDisplayMode;
  counterText: string;
  hz: number | null;
}): { value: string; unit: string; pulseKey: string } {
  const { displayMode, counterText, hz } = args;
  const hzText = formatTelemetryMetaHzFixed(hz);

  if (displayMode === "counter")
  {
    return { value: counterText, unit: "", pulseKey: counterText };
  }

  if (displayMode === "hz")
  {
    return { value: hzText, unit: "Hz", pulseKey: hzText };
  }

  const combined = `${counterText} · ${hzText}`;
  return { value: combined, unit: "Hz", pulseKey: combined };
}
