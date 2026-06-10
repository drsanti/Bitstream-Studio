export function normalizeInfographicRatio(
  value: number | null,
  min: number,
  max: number,
): number | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }
  const span = max - min;
  if (Math.abs(span) <= Number.EPSILON) {
    return 0;
  }
  return Math.max(0, Math.min(1, (value - min) / span));
}

export function normalizeInfographicAngleDeg(value: number | null): number | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }
  const wrapped = ((value % 360) + 360) % 360;
  return wrapped;
}

export function formatInfographicValue(value: number | null, decimals: number): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  return value.toFixed(decimals);
}
