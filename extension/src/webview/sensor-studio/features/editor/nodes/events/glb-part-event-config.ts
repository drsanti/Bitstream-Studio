/** Scalar visibility/opacity for GLB **part** drives: 0 = hidden; (0, 1) = material opacity; 1 = visible. */

export const STUDIO_GLB_PART_DRIVE_MODE_KEY = "glbPartDriveMode" as const;

export type StudioGlbPartDriveModeV1 = "visibility" | "opacity";

export function readGlbPartDriveMode(
  defaultConfig: Record<string, unknown>,
): StudioGlbPartDriveModeV1 {
  const raw = defaultConfig[STUDIO_GLB_PART_DRIVE_MODE_KEY];
  return raw === "opacity" ? "opacity" : "visibility";
}

function readRawPartScalar(defaultConfig: Record<string, unknown>): number | null {
  const raw = defaultConfig.value;
  if (typeof raw === "boolean") {
    return raw ? 1 : 0;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes" || s === "visible" || s === "on") {
      return 1;
    }
    if (s === "false" || s === "0" || s === "no" || s === "hidden" || s === "off") {
      return 0;
    }
    const n = Number.parseFloat(s);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return null;
}

function clampOpacityScalar(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Part drive scalar for preview/simulation — respects **visibility** vs **opacity** mode. */
export function readGlbPartDriveScalar(defaultConfig: Record<string, unknown>): number {
  const mode = readGlbPartDriveMode(defaultConfig);
  const raw = readRawPartScalar(defaultConfig);
  if (raw == null) {
    return 0;
  }
  if (mode === "opacity") {
    return clampOpacityScalar(raw);
  }
  return raw > 0.5 ? 1 : 0;
}

/** @deprecated Use {@link readGlbPartDriveScalar} — kept for event-runner call sites. */
export function readGlbPartVisibilityScalar(defaultConfig: Record<string, unknown>): number {
  return readGlbPartDriveScalar(defaultConfig);
}

function readRawSetToScalar(defaultConfig: Record<string, unknown>): number | null {
  const raw = defaultConfig.setTo;
  if (typeof raw === "boolean") {
    return raw ? 1 : 0;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes" || s === "visible" || s === "on") {
      return 1;
    }
    if (s === "false" || s === "0" || s === "no" || s === "hidden" || s === "off") {
      return 0;
    }
    const n = Number.parseFloat(s);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return null;
}

export function readGlbPartSetVisibleTarget(defaultConfig: Record<string, unknown>): number {
  const mode = readGlbPartDriveMode(defaultConfig);
  const raw = readRawSetToScalar(defaultConfig);
  if (raw == null) {
    return mode === "opacity" ? 1 : 1;
  }
  if (mode === "opacity") {
    return clampOpacityScalar(raw);
  }
  return raw > 0.5 ? 1 : 0;
}

export function toggleGlbPartVisibilityScalar(
  current: number,
  mode: StudioGlbPartDriveModeV1 = "visibility",
): number {
  if (mode === "opacity") {
    return current > 0.5 ? 0 : 1;
  }
  return current > 0.5 ? 0 : 1;
}

export function formatGlbPartVisibilityLabel(
  scalar: number,
  mode: StudioGlbPartDriveModeV1 = "visibility",
): string {
  if (mode === "opacity") {
    return `Opacity ${clampOpacityScalar(scalar).toFixed(2)}`;
  }
  return scalar > 0.5 ? "Visible" : "Hidden";
}
