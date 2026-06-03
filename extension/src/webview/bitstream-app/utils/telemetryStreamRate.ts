/*******************************************************************************
 * File Name : telemetryStreamRate.ts
 *
 * Description : Smoothed stream rate (Hz) from device tMs, host ingest gaps,
 *               counter slope, and rolling host-gap mean for Telemetry Meta.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { BitstreamSensorSourceHint } from "../../../bitstream/events/sensor-decoder.js";

/** EMA blend for instant Hz estimates (lower = smoother). */
export const TELEMETRY_STREAM_HZ_EMA_ALPHA = 0.25;

/** Max host inter-arrival gaps kept per sensor for smoothed Hz. */
export const TELEMETRY_HOST_GAP_RING_MAX = 64;

export type StreamHzByHint = Record<BitstreamSensorSourceHint, number | null>;

/** Empty Hz map for metrics snapshot init / reset. */
export function emptyStreamHzByHint(): StreamHzByHint {
  return {
    unknown: null,
    sht40: null,
    dps368: null,
    bmi270: null,
    bmm350: null,
  };
}

/** Instant Hz from a single inter-arrival gap (ms). */
export function hzInstantFromGapMs(gapMs: number | null | undefined): number | null {
  if (gapMs == null || !Number.isFinite(gapMs) || gapMs <= 0)
  {
    return null;
  }
  return 1000 / gapMs;
}

/** Exponential moving average of stream Hz. */
export function emaStreamHz(
  prev: number | null,
  instantHz: number | null,
  alpha: number = TELEMETRY_STREAM_HZ_EMA_ALPHA,
): number | null {
  if (instantHz == null || !Number.isFinite(instantHz))
  {
    return prev;
  }
  if (prev == null || !Number.isFinite(prev))
  {
    return instantHz;
  }
  return prev * (1 - alpha) + instantHz * alpha;
}

/** Monotonic u32 counter delta with wrap. */
export function u32CounterDelta(prev: number, next: number): number {
  if (!Number.isFinite(prev) || !Number.isFinite(next))
  {
    return 0;
  }
  const p = Math.floor(prev) >>> 0;
  const n = Math.floor(next) >>> 0;
  if (n >= p)
  {
    return n - p;
  }
  return (0xffffffff - p + n + 1) >>> 0;
}

/** Append a host gap and trim ring to max length. */
export function pushHostGapRing(ring: number[], gapMs: number, maxLen: number): number[] {
  const next = [...ring, gapMs];
  while (next.length > maxLen)
  {
    next.shift();
  }
  return next;
}

/** Mean of recent host gaps → Hz (smoothed receive rate). */
export function smoothedHzFromGapRing(gaps: number[]): number | null {
  if (gaps.length === 0)
  {
    return null;
  }
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  return hzInstantFromGapMs(mean);
}

export type UpdateTelemetryStreamRatesInput = {
  hint: BitstreamSensorSourceHint;
  interArrivalMs: number | null;
  hostInterArrivalMs: number | null;
  prevCounter: number | undefined;
  nextCounter: number;
  streamHzDeviceByHint: StreamHzByHint;
  streamHzHostByHint: StreamHzByHint;
  streamHzCounterByHint: StreamHzByHint;
  streamHzSmoothedByHint: StreamHzByHint;
  hostGapRing: number[];
};

export type UpdateTelemetryStreamRatesResult = {
  streamHzDeviceByHint: StreamHzByHint;
  streamHzHostByHint: StreamHzByHint;
  streamHzCounterByHint: StreamHzByHint;
  streamHzSmoothedByHint: StreamHzByHint;
  hostGapRing: number[];
};

/**
 * Update all four Hz tracks for one ingested sample. Counter Hz advances only when
 * the payload counter changes (BMI270 mask subsets with the same counter are skipped).
 */
export function updateTelemetryStreamRates(
  input: UpdateTelemetryStreamRatesInput,
): UpdateTelemetryStreamRatesResult {
  const {
    hint,
    interArrivalMs,
    hostInterArrivalMs,
    prevCounter,
    nextCounter,
    hostGapRing,
  } = input;

  const streamHzDeviceByHint = { ...input.streamHzDeviceByHint };
  const streamHzHostByHint = { ...input.streamHzHostByHint };
  const streamHzCounterByHint = { ...input.streamHzCounterByHint };
  const streamHzSmoothedByHint = { ...input.streamHzSmoothedByHint };

  const deviceInstant = hzInstantFromGapMs(interArrivalMs);
  streamHzDeviceByHint[hint] = emaStreamHz(streamHzDeviceByHint[hint], deviceInstant);

  let nextRing = hostGapRing;
  if (hostInterArrivalMs != null && hostInterArrivalMs > 0)
  {
    const hostInstant = hzInstantFromGapMs(hostInterArrivalMs);
    streamHzHostByHint[hint] = emaStreamHz(streamHzHostByHint[hint], hostInstant);
    nextRing = pushHostGapRing(hostGapRing, hostInterArrivalMs, TELEMETRY_HOST_GAP_RING_MAX);
    const smoothedInstant = smoothedHzFromGapRing(nextRing);
    streamHzSmoothedByHint[hint] = emaStreamHz(streamHzSmoothedByHint[hint], smoothedInstant);
  }

  const counterChanged =
    prevCounter != null && Number.isFinite(prevCounter) && nextCounter !== prevCounter;
  if (
    counterChanged &&
    hostInterArrivalMs != null &&
    hostInterArrivalMs > 0
  )
  {
    const deltaC = u32CounterDelta(prevCounter, nextCounter);
    if (deltaC > 0)
    {
      const counterInstant = (deltaC * 1000) / hostInterArrivalMs;
      streamHzCounterByHint[hint] = emaStreamHz(streamHzCounterByHint[hint], counterInstant);
    }
  }

  return {
    streamHzDeviceByHint,
    streamHzHostByHint,
    streamHzCounterByHint,
    streamHzSmoothedByHint,
    hostGapRing: nextRing,
  };
}

/** Human-readable aggregate decode rate for toolbar chips (all sensor hints combined). */
export function formatAggregateDecodeFps(fps: number | null | undefined): string {
  if (fps == null || !Number.isFinite(fps)) {
    return "— fps";
  }
  if (fps < 1) {
    return "<1 fps";
  }
  if (fps >= 100) {
    return `${Math.round(fps)} fps`;
  }
  if (fps >= 10) {
    return `${fps.toFixed(1)} fps`;
  }
  return `${fps.toFixed(2)} fps`;
}

/** Rolling window FPS from monotonic sample counter deltas. */
export function computeRollingFpsFromSampleCount(args: {
  sampleCount: number;
  nowMs: number;
  prevTick: { sampleCount: number; atMs: number };
  minWindowSec?: number;
}): { fps: number | null; nextTick: { sampleCount: number; atMs: number } } {
  const { sampleCount, nowMs, prevTick, minWindowSec = 0.25 } = args;
  const dtSec = (nowMs - prevTick.atMs) / 1000;
  if (dtSec < minWindowSec) {
    return { fps: null, nextTick: prevTick };
  }
  const delta = sampleCount - prevTick.sampleCount;
  const fps = delta / dtSec;
  return {
    fps: Number.isFinite(fps) ? Math.max(0, fps) : null,
    nextTick: { sampleCount, atMs: nowMs },
  };
}
