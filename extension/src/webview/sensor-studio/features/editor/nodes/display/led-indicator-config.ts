import { normalizeGaugeHexColor, readGaugeFiniteNumber } from "./gauge-display-config";

export type LedIndicatorConfig = {
  label: string;
  onColor: string;
  offColor: string;
  threshold: number;
  blink: boolean;
};

export function coerceLedIndicatorConfig(dc: Record<string, unknown>): LedIndicatorConfig {
  return {
    label: typeof dc.label === "string" ? dc.label : "LED",
    onColor: normalizeGaugeHexColor(
      typeof dc.onColor === "string" ? dc.onColor : null,
      "#22c55e",
    ),
    offColor: normalizeGaugeHexColor(
      typeof dc.offColor === "string" ? dc.offColor : null,
      "#18181b",
    ),
    threshold: readGaugeFiniteNumber(dc.threshold, 0.5),
    blink: dc.blink === true,
  };
}

export function ledIndicatorIsOn(
  value: number | boolean | string | null | undefined,
  threshold: number,
): boolean {
  if (value == null) {
    return false;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= threshold;
  }
  if (typeof value === "string") {
    return value === "true" || value === "1";
  }
  return false;
}
