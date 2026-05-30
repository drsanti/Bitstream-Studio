import {
  isProject4TwinCubemapId,
  PROJECT4_TWIN_CUBEMAP_NONE,
} from "../lib/project4-twin-environments";
import { classifyMcuConnectionPreset } from "../lib/mcu-connection-presets";
import { PROJECT4_SETTINGS_DEFAULTS } from "./project4-settings.defaults";
import type { Project4SettingsState } from "./project4-settings.types";

/** Signed degrees for scanner arc limits (HUD + twin yaw semantics); inputs allow negatives. */
export const PROJECT4_SCANNER_AZIMUTH_DEG_MIN = -180;
export const PROJECT4_SCANNER_AZIMUTH_DEG_MAX = 180;

/** Wider bound for MCU-reported sweep endpoints (may exceed ±180 depending on firmware). */
export const PROJECT4_SCANNER_TELEMETRY_SWEEP_DEG_MIN = -360;
export const PROJECT4_SCANNER_TELEMETRY_SWEEP_DEG_MAX = 360;

function isHttpUrlCandidate(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.max(min, Math.min(max, n));
}

function clampPositiveFloat(value: unknown, fallback: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return n > 0 ? n : fallback;
}

function clampNonEmptyString(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const t = value.trim();
  return t.length > 0 ? t : fallback;
}

function clampPath(value: unknown, fallback: string): string {
  const s = clampNonEmptyString(value, fallback);
  return s.startsWith("/") ? s : `/${s}`;
}

function clampQueryKey(value: unknown, fallback: string): string {
  const s = typeof value === "string" ? value.trim() : "";
  if (s.length === 0) {
    return fallback;
  }
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s) ? s : fallback;
}

function clampTwinCubemapEnvironmentId(value: unknown, fallback: string): string {
  const d = PROJECT4_SETTINGS_DEFAULTS.twinCubemapEnvironmentId;
  if (typeof value !== "string") {
    return fallback;
  }
  const s = value.trim();
  if (s.length === 0 || s === PROJECT4_TWIN_CUBEMAP_NONE) {
    return PROJECT4_TWIN_CUBEMAP_NONE;
  }
  return isProject4TwinCubemapId(s) ? s : d;
}

function normalizeScannerArcDegPair(
  minUnknown: unknown,
  maxUnknown: unknown,
  fallbackMin: number,
  fallbackMax: number,
): { min: number; max: number } {
  const lo = PROJECT4_SCANNER_AZIMUTH_DEG_MIN;
  const hi = PROJECT4_SCANNER_AZIMUTH_DEG_MAX;
  let mn = clampInt(minUnknown, lo, hi, fallbackMin);
  let mx = clampInt(maxUnknown, lo, hi, fallbackMax);
  if (mx <= mn) {
    mn = fallbackMin;
    mx = fallbackMax;
  }
  return { min: mn, max: mx };
}

function normalizeTelemetrySweepDegPair(
  minUnknown: unknown,
  maxUnknown: unknown,
  fallbackMin: number,
  fallbackMax: number,
): { min: number; max: number } {
  const lo = PROJECT4_SCANNER_TELEMETRY_SWEEP_DEG_MIN;
  const hi = PROJECT4_SCANNER_TELEMETRY_SWEEP_DEG_MAX;
  let mn = clampInt(minUnknown, lo, hi, fallbackMin);
  let mx = clampInt(maxUnknown, lo, hi, fallbackMax);
  if (mx <= mn) {
    mn = fallbackMin;
    mx = fallbackMax;
  }
  return { min: mn, max: mx };
}

/** Coerce any partial overlay into a fully valid persisted shape (defaults fill gaps). */
export function normalizeProject4Settings(
  input: Partial<Project4SettingsState> | Project4SettingsState,
): Project4SettingsState {
  const d = PROJECT4_SETTINGS_DEFAULTS;
  const baseUrlRaw = clampNonEmptyString(input.mcuBaseUrl, d.mcuBaseUrl).trim();
  const mcuBaseUrl = isHttpUrlCandidate(baseUrlRaw) ? baseUrlRaw : d.mcuBaseUrl;

  const frontArc = normalizeScannerArcDegPair(
    input.scannerFrontAzimuthMinDeg,
    input.scannerFrontAzimuthMaxDeg,
    d.scannerFrontAzimuthMinDeg,
    d.scannerFrontAzimuthMaxDeg,
  );
  const rearArc = normalizeScannerArcDegPair(
    input.scannerRearAzimuthMinDeg,
    input.scannerRearAzimuthMaxDeg,
    d.scannerRearAzimuthMinDeg,
    d.scannerRearAzimuthMaxDeg,
  );
  const telemetrySweep = normalizeTelemetrySweepDegPair(
    input.scannerTelemetrySweepMinDeg,
    input.scannerTelemetrySweepMaxDeg,
    d.scannerTelemetrySweepMinDeg,
    d.scannerTelemetrySweepMaxDeg,
  );

  return {
    schemaVersion: clampInt(input.schemaVersion, 1, 999, d.schemaVersion),
    mcuBaseUrl,
    mcuConnectionPreset: classifyMcuConnectionPreset(mcuBaseUrl),
    telemetryPath: clampPath(input.telemetryPath, d.telemetryPath),
    movePath: clampPath(input.movePath, d.movePath),
    setSpeedPath: clampPath(input.setSpeedPath, d.setSpeedPath),
    moveDirQueryKey: clampQueryKey(input.moveDirQueryKey, d.moveDirQueryKey),
    setSpeedValueQueryKey: clampQueryKey(
      input.setSpeedValueQueryKey,
      d.setSpeedValueQueryKey,
    ),
    telemetryPollIntervalMs: clampInt(input.telemetryPollIntervalMs, 50, 5000, d.telemetryPollIntervalMs),
    httpRequestTimeoutMs: clampInt(input.httpRequestTimeoutMs, 500, 60_000, d.httpRequestTimeoutMs),
    trackWidthM: clampPositiveFloat(input.trackWidthM, d.trackWidthM),
    wheelbaseM: clampPositiveFloat(input.wheelbaseM, d.wheelbaseM),
    wheelRadiusM: clampPositiveFloat(input.wheelRadiusM, d.wheelRadiusM),
    scannerFrontAzimuthMinDeg: frontArc.min,
    scannerFrontAzimuthMaxDeg: frontArc.max,
    scannerRearAzimuthMinDeg: rearArc.min,
    scannerRearAzimuthMaxDeg: rearArc.max,
    scannerTelemetrySweepMinDeg: telemetrySweep.min,
    scannerTelemetrySweepMaxDeg: telemetrySweep.max,
    reverseSafetyStopCmDisplay: clampPositiveFloat(
      input.reverseSafetyStopCmDisplay,
      d.reverseSafetyStopCmDisplay,
    ),
    robotModelUrl: clampNonEmptyString(input.robotModelUrl, d.robotModelUrl),
    twinCubemapEnvironmentId: clampTwinCubemapEnvironmentId(
      input.twinCubemapEnvironmentId,
      d.twinCubemapEnvironmentId,
    ),
    setSpeedUseQuery:
      typeof input.setSpeedUseQuery === "boolean" ? input.setSpeedUseQuery : d.setSpeedUseQuery,
  };
}

export function mergeProject4SettingsFromUnknown(raw: unknown): Project4SettingsState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...PROJECT4_SETTINGS_DEFAULTS };
  }
  const o = raw as Record<string, unknown>;
  const merged: Partial<Project4SettingsState> = {
    ...PROJECT4_SETTINGS_DEFAULTS,
  };
  const keys = Object.keys(PROJECT4_SETTINGS_DEFAULTS) as (keyof Project4SettingsState)[];
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(o, key)) {
      const v = o[key as string];
      merged[key] = v as never;
    }
  }

  const newScannerKeys = [
    "scannerFrontAzimuthMinDeg",
    "scannerFrontAzimuthMaxDeg",
    "scannerRearAzimuthMinDeg",
    "scannerRearAzimuthMaxDeg",
  ] as const;
  const hasNewScannerFields = newScannerKeys.some((k) => typeof o[k] === "number");
  const legacyMin = o.scannerAzimuthMinDeg;
  const legacyMax = o.scannerAzimuthMaxDeg;
  if (
    !hasNewScannerFields &&
    typeof legacyMin === "number" &&
    typeof legacyMax === "number"
  ) {
    merged.scannerFrontAzimuthMinDeg = legacyMin;
    merged.scannerFrontAzimuthMaxDeg = legacyMax;
    merged.scannerRearAzimuthMinDeg = legacyMin;
    merged.scannerRearAzimuthMaxDeg = legacyMax;
  }

  return normalizeProject4Settings(merged);
}
