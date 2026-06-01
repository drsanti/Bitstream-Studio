import type { SensorHealthStatus } from "../../store/flow-editor.store";

export type GaugeCanvasHealthTone = "stale" | "offline";

/** Dim canvas gauges when upstream telemetry is stale or offline. */
export function resolveGaugeCanvasHealthTone(
  sensorHealth?: SensorHealthStatus,
): GaugeCanvasHealthTone | null {
  if (sensorHealth === "stale") {
    return "stale";
  }
  if (sensorHealth === "offline") {
    return "offline";
  }
  return null;
}

export function gaugeCanvasHealthGlobalAlpha(
  tone: GaugeCanvasHealthTone | null,
): number {
  if (tone === "offline") {
    return 0.42;
  }
  if (tone === "stale") {
    return 0.68;
  }
  return 1;
}

/** Apply before drawing gauge chrome on a Canvas 2D context (pair with `ctx.restore()`). */
export function beginGaugeCanvasHealthStyle(
  ctx: CanvasRenderingContext2D,
  sensorHealth?: SensorHealthStatus,
): GaugeCanvasHealthTone | null {
  const tone = resolveGaugeCanvasHealthTone(sensorHealth);
  const alpha = gaugeCanvasHealthGlobalAlpha(tone);
  if (alpha >= 1) {
    return null;
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  return tone;
}

export function endGaugeCanvasHealthStyle(
  ctx: CanvasRenderingContext2D,
  tone: GaugeCanvasHealthTone | null,
): void {
  if (tone != null) {
    ctx.restore();
  }
}

export function gaugeCanvasHealthPanelClassName(
  sensorHealth?: SensorHealthStatus,
): string | undefined {
  if (sensorHealth === "offline") {
    return "opacity-45 saturate-50";
  }
  if (sensorHealth === "stale") {
    return "opacity-70 saturate-75";
  }
  return undefined;
}
