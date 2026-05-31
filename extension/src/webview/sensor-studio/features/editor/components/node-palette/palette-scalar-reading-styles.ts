import type { PalettePreviewStreamTone } from "./palette-live-preview";

/** Scalar reading tints — aligned with sensor deck semantics (temp / humidity / pressure). */
export type PaletteScalarReadingKind = "temperature" | "humidity" | "pressure" | "neutral";

const LIVE_TINT_CLASS: Record<PaletteScalarReadingKind, string> = {
  temperature: "text-orange-400/95",
  humidity: "text-cyan-400/95",
  pressure: "text-purple-400/95",
  neutral: "text-zinc-100",
};

export function resolvePaletteScalarReadingKind(hints: {
  unit?: string;
  label?: string;
}): PaletteScalarReadingKind {
  const unit = hints.unit?.trim().toLowerCase() ?? "";
  const label = hints.label?.trim().toLowerCase() ?? "";

  if (unit === "°c" || label.includes("temp")) {
    return "temperature";
  }
  if (unit === "%rh" || label === "rh" || label.includes("humid")) {
    return "humidity";
  }
  if (unit === "hpa" || label.includes("pressure") || label === "pr") {
    return "pressure";
  }
  return "neutral";
}

export function getPaletteScalarReadingColorClass(
  streamMode: PalettePreviewStreamTone,
  hints: { unit?: string; label?: string },
): string {
  if (streamMode === "idle") {
    return "text-zinc-500";
  }
  return LIVE_TINT_CLASS[resolvePaletteScalarReadingKind(hints)];
}
