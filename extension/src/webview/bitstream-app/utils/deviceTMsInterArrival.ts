/*******************************************************************************
 * File Name : deviceTMsInterArrival.ts
 *
 * Description : BS2 EVT_SENSOR device timestamp (tMs) inter-arrival helpers for
 *               telemetry Δ badges and ingest metrics.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { BitstreamSensorSampleV2 } from "../../../bitstream/events/sensor-decoder.js";

/** u32 device-time gap between consecutive EVT_SENSOR publishes (wrap-safe). */
export function deviceTMsInterArrivalMs(prevTMs: number, nextTMs: number): number {
  const prev = prevTMs >>> 0;
  const next = nextTMs >>> 0;
  if (next >= prev)
  {
    return next - prev;
  }
  return 0xffffffff - prev + 1 + next;
}

/**
 * Prefer protocol `deviceTMs` delta; fall back to host wall-clock when tMs is absent
 * (legacy decode path). Keeps prior Δ when BMI270 mask subsets share one publish.
 */
export function computeSampleInterArrivalMs(args: {
  sample: BitstreamSensorSampleV2;
  prevLatest: BitstreamSensorSampleV2 | null;
  prevWallAtMs: number | null;
  prevInterArrivalMs: number | null;
  nowMs: number;
}): number | null {
  const { sample, prevLatest, prevWallAtMs, prevInterArrivalMs, nowMs } = args;
  const nextTMs = sample.deviceTMs;
  const prevTMs = prevLatest?.deviceTMs;

  if (typeof nextTMs === "number" && Number.isFinite(nextTMs))
  {
    if (typeof prevTMs === "number" && Number.isFinite(prevTMs))
    {
      if (nextTMs === prevTMs && sample.counter === prevLatest?.counter)
      {
        return prevInterArrivalMs;
      }
      return deviceTMsInterArrivalMs(prevTMs, nextTMs);
    }
    return null;
  }

  if (prevWallAtMs != null)
  {
    return nowMs - prevWallAtMs;
  }
  return null;
}
