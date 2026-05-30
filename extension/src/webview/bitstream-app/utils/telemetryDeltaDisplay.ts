/*******************************************************************************
 * File Name : telemetryDeltaDisplay.ts
 *
 * Description : Pick Δt for LastUpdateBadge from device vs host ingest sources.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.2
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

export type TelemetryUpdateDeltaSource = "device" | "host" | "both";

/** Character length of every formatted Δ slot (ms and s modes). */
export const TELEMETRY_DELTA_SLOT_CHARS = 10;

/** Fixed-width Δ slot: space-padded integer `NNN Δms` / 2-decimal `NN.NN Δs`. */
export const TELEMETRY_DELTA_PLACEHOLDER = "--- Δms".padStart(TELEMETRY_DELTA_SLOT_CHARS, " ");

function padTelemetryDeltaSlot(text: string): string {
  return text.padStart(TELEMETRY_DELTA_SLOT_CHARS, " ");
}

/**
 * Fixed-width telemetry Δ for card headers: integer `NNN Δms` or 2-decimal `NN.NN Δs`.
 * Space-padded (not zero-padded) to prevent header jitter.
 */
export function formatTelemetryDeltaFixed(
  deltaMs: number | null | undefined,
  options?: { placeholder?: boolean },
): string | null {
  const usePlaceholder = options?.placeholder !== false;

  if (deltaMs == null || !Number.isFinite(deltaMs) || deltaMs < 0)
  {
    return usePlaceholder ? TELEMETRY_DELTA_PLACEHOLDER : null;
  }

  if (deltaMs >= 1000)
  {
    const sec = Math.min(deltaMs / 1000, 999.99);
    return padTelemetryDeltaSlot(`${sec.toFixed(2)} Δs`);
  }

  const clampedMs = Math.min(Math.max(0, Math.round(deltaMs)), 999);
  return padTelemetryDeltaSlot(`${clampedMs} Δms`);
}

/** Dual Δ row: device slot + host slot (fixed width, space between). */
export function formatTelemetryDeltaPairFixed(args: {
  deviceDeltaMs: number | null | undefined;
  hostDeltaMs: number | null | undefined;
}): string {
  const deviceText =
    formatTelemetryDeltaFixed(args.deviceDeltaMs, { placeholder: true }) ??
    TELEMETRY_DELTA_PLACEHOLDER;
  const hostText =
    formatTelemetryDeltaFixed(args.hostDeltaMs, { placeholder: true }) ??
    TELEMETRY_DELTA_PLACEHOLDER;
  return `${deviceText} ${hostText}`;
}

export function normalizeDeviceBadgeDeltaMs(args: {
  deviceInterArrivalMs: number | null | undefined;
  wallAgeMs: number | null;
}): number | null {
  const { deviceInterArrivalMs, wallAgeMs } = args;
  if (
    typeof deviceInterArrivalMs === "number" &&
    Number.isFinite(deviceInterArrivalMs) &&
    deviceInterArrivalMs >= 0
  ) {
    return deviceInterArrivalMs;
  }
  return wallAgeMs;
}

export function normalizeHostBadgeDeltaMs(args: {
  hostInterArrivalMs: number | null | undefined;
}): number | null {
  const { hostInterArrivalMs } = args;
  if (
    typeof hostInterArrivalMs === "number" &&
    Number.isFinite(hostInterArrivalMs) &&
    hostInterArrivalMs >= 0
  ) {
    return hostInterArrivalMs;
  }
  return null;
}

export function pickTelemetryBadgeDeltaMs(args: {
  deltaSource: TelemetryUpdateDeltaSource;
  deviceInterArrivalMs: number | null | undefined;
  hostInterArrivalMs: number | null | undefined;
  wallAgeMs: number | null;
}): number | null {
  const { deltaSource, deviceInterArrivalMs, hostInterArrivalMs, wallAgeMs } = args;

  if (deltaSource === "both") {
    return null;
  }

  if (deltaSource === "host") {
    return normalizeHostBadgeDeltaMs({ hostInterArrivalMs });
  }

  return normalizeDeviceBadgeDeltaMs({ deviceInterArrivalMs, wallAgeMs });
}

export function isTelemetryUpdateDeltaSource(
  value: string,
): value is TelemetryUpdateDeltaSource {
  return value === "device" || value === "host" || value === "both";
}
