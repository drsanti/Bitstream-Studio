/*******************************************************************************
 * File Name : bitstreamTelemetryBackend.ts
 *
 * Description : Telemetry Source types (Bitstream firmware vs external Simulator).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.2
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

export type BitstreamTelemetryBackend = "uart" | "simulator";

/** Alias kept for transport helpers that previously resolved Auto → effective route. */
export type BitstreamTelemetryEffectiveBackend = BitstreamTelemetryBackend;

/** User-facing data-source labels (`backend` store values unchanged). */
export const BITSTREAM_TELEMETRY_SOURCE_LABELS: Record<BitstreamTelemetryBackend, string> = {
  uart: "Hardware",
  simulator: "Simulator",
};

/** Activity-log prefix when bringing up firmware serial link (`backend: "uart"`). */
export const BITSTREAM_FIRMWARE_ACTIVITY_LOG_PREFIX =
  BITSTREAM_TELEMETRY_SOURCE_LABELS.uart;

export function telemetrySourceDisplayLabel(
  backend: BitstreamTelemetryBackend,
): string {
  return BITSTREAM_TELEMETRY_SOURCE_LABELS[backend];
}

export function resolveEffectiveTelemetryBackend(
  backend: BitstreamTelemetryBackend,
): BitstreamTelemetryEffectiveBackend {
  return backend;
}
