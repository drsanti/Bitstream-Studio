/**
 * Formats a finite number with fixed decimals.
 * When `value > 0`, prefixes with `+` (explicit positive sign).
 * Negative values keep the default `-` from `toFixed`.
 * Zero is displayed without a leading `+`.
 */
export function formatSignedFixed(value: number, fractionDigits: number): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  const s = value.toFixed(fractionDigits);
  if (value > 0) {
    return `+${s}`;
  }
  return s;
}
