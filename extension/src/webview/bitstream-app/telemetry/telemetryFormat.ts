export function toScaledValue(value: number | undefined): string {
  if (typeof value !== "number") {
    return "--";
  }
  return (value / 100).toFixed(2);
}

/**
 * Wraps a radian value to **(−π, π]** (equivalent to **±180°**), same as `atan2(sin, cos)`.
 * Use for fusion Euler channels when the wire may carry **0 … 2π** but the UI should show signed range.
 */
export function wrapRadiansSignedPi(rad: number): number {
  return Math.atan2(Math.sin(rad), Math.cos(rad));
}

/** Fusion Euler wire fields: radians ×100 → string in (−π, π] rad for display. */
export function toScaledFusionEulerAngleRad(value: number | undefined): string {
  if (typeof value !== "number") {
    return "--";
  }
  return wrapRadiansSignedPi(value / 100).toFixed(3);
}

export function toScaledValueBy(
  value: number | undefined,
  divisor: number,
  fractionDigits: number,
): string {
  if (typeof value !== "number" || divisor === 0) {
    return "--";
  }
  return (value / divisor).toFixed(fractionDigits);
}

export function toNormalizedQwFromBucket(value: number | undefined): string {
  if (typeof value !== "number") {
    return "--";
  }
  return ((value - 10000) / 10000).toFixed(2);
}

export function metricProgressPercent(
  value: number | undefined,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || max <= min) {
    return 0;
  }
  const ratio = (value - min) / (max - min);
  return Math.max(0, Math.min(100, ratio * 100));
}
