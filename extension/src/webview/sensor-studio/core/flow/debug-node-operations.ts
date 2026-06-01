/** Debug passthrough — coerce wired/config to finite number (node-animator `debug` parity). */
export function evaluateDebugValue(wired: unknown, configValue: unknown, fallback: number): number {
  if (typeof wired === "number" && Number.isFinite(wired)) {
    return wired;
  }
  if (typeof wired === "boolean") {
    return wired ? 1 : 0;
  }
  if (typeof configValue === "number" && Number.isFinite(configValue)) {
    return configValue;
  }
  const n = Number(configValue);
  return Number.isFinite(n) ? n : fallback;
}
