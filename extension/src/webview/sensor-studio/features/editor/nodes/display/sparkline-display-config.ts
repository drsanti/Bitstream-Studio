import { normalizeGaugeHexColor, readGaugeFiniteNumber } from "./gauge-display-config";

export type SparklineConfig = {
  historySize: number;
  strokeColor: string;
  strokeWidth: number;
};

export function coerceSparklineConfig(dc: Record<string, unknown>): SparklineConfig {
  const historyRaw = readGaugeFiniteNumber(dc.historySize, 24);
  const strokeRaw = readGaugeFiniteNumber(dc.strokeWidth, 3);
  return {
    historySize: Math.max(4, Math.min(512, Math.round(historyRaw))),
    strokeColor: normalizeGaugeHexColor(
      typeof dc.strokeColor === "string" ? dc.strokeColor : null,
      "#22d3ee",
    ),
    strokeWidth: Math.max(1, Math.min(8, strokeRaw)),
  };
}

/** Build SVG polyline `points` for normalized sparkline rendering. */
export function buildSparklinePolylinePoints(
  samples: readonly number[],
  historySize: number,
): string {
  const bars = samples.slice(-historySize);
  if (bars.length === 0) {
    return "";
  }
  const maxAbs = bars.reduce((acc, value) => Math.max(acc, Math.abs(value)), 1);
  return bars
    .map((value, index) => {
      const x =
        bars.length <= 1 ? 0 : (index / (bars.length - 1)) * 100;
      const normalized = (value + maxAbs) / (maxAbs * 2);
      const y = (1 - normalized) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}
