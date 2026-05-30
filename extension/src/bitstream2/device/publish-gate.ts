import type { Bs2PublishMode, Bs2SensorConfig } from "../domains/config/sensor-config";

/** Decode packed i16 LE scalars from EVT_SENSOR valuesBytes. */
export function scalarsFromValuesBytes(valuesBytes: Uint8Array): number[] {
  const out: number[] = [];
  const view = new DataView(valuesBytes.buffer, valuesBytes.byteOffset, valuesBytes.byteLength);
  for (let o = 0; o + 2 <= valuesBytes.byteLength; o += 2) {
    out.push(view.getInt16(o, true));
  }
  return out;
}

export function exceedsDeltaThreshold(
  current: number[],
  lastPublished: number[] | null,
  deltaX100: number,
): boolean {
  if (lastPublished == null || lastPublished.length === 0) {
    return true;
  }
  if (deltaX100 === 0) {
    return true;
  }
  const threshold = deltaX100 / 100;
  const n = Math.min(current.length, lastPublished.length);
  for (let i = 0; i < n; i++) {
    if (Math.abs(current[i]! - lastPublished[i]!) >= threshold) {
      return true;
    }
  }
  return current.length !== lastPublished.length;
}

export function minPublishIntervalElapsed(
  lastEmitMs: number,
  nowMs: number,
  minPublishIntervalMs: number,
): boolean {
  if (minPublishIntervalMs <= 0) return true;
  if (lastEmitMs <= 0) return true;
  return nowMs - lastEmitMs >= minPublishIntervalMs;
}

export function shouldPublishSample(args: {
  publishMode: Bs2PublishMode;
  deltaX100: number;
  current: number[];
  lastPublished: number[] | null;
  lastEmitMs: number;
  nowMs: number;
  minPublishIntervalMs: number;
}): boolean {
  if (!minPublishIntervalElapsed(args.lastEmitMs, args.nowMs, args.minPublishIntervalMs)) {
    return false;
  }

  const deltaHit = exceedsDeltaThreshold(args.current, args.lastPublished, args.deltaX100);

  switch (args.publishMode) {
    case 0:
      return true;
    case 1:
      return deltaHit;
    case 2:
      return true || deltaHit;
    default:
      return true;
  }
}

export function shouldPublishForConfig(
  cfg: Bs2SensorConfig,
  current: number[],
  lastPublished: number[] | null,
  lastEmitMs: number,
  nowMs: number,
): boolean {
  return shouldPublishSample({
    publishMode: cfg.publishMode,
    deltaX100: cfg.deltaX100,
    current,
    lastPublished,
    lastEmitMs,
    nowMs,
    minPublishIntervalMs: cfg.minPublishIntervalMs,
  });
}
