/**
 * Diagnostics stream period bounds (milliseconds), aligned with firmware policy.
 *
 * Source of truth (clamp applied on `DIAG_STREAM_START`): `BITSTREAM_DIAG_STREAM_PERIOD_MIN_MS` /
 * `BITSTREAM_DIAG_STREAM_PERIOD_MAX_MS` in
 * `proj_cm55/src/bitstream/modules/diag/src/bitstream_diag_service.c` (TESAIoT Firmware —
 * see MCP README `bitstream/mcp-server/README.md` repo layout).
 *
 * Wire format still uses uint16 LE per byte (`HostSession.sendDiagStreamStart`); firmware clamps
 * values into this range before storing (values above 60000 ms become 60000).
 */
export const DIAG_STREAM_INTERVAL_MS_MIN = 20;
export const DIAG_STREAM_INTERVAL_MS_MAX = 60000;

/** Dashboard slider UI only (subset of firmware-allowed range). */
export const DIAG_STREAM_SLIDER_MIN_MS = 20;
export const DIAG_STREAM_SLIDER_MAX_MS = 3000;
export const DIAG_STREAM_SLIDER_STEP_MS = 10;
/** Matches default `TRNParameterSlider` throttle; reduces serial traffic while dragging. */
export const DIAG_STREAM_SLIDER_THROTTLE_MS = 500;

export function clampDiagStreamIntervalMs(value: number): number {
  if (!Number.isFinite(value)) {
    return DIAG_STREAM_INTERVAL_MS_MIN;
  }
  return Math.max(
    DIAG_STREAM_INTERVAL_MS_MIN,
    Math.min(DIAG_STREAM_INTERVAL_MS_MAX, Math.round(value)),
  );
}

/** Clamp to slider bounds so UI state stays consistent with `TRNParameterSlider` min/max. */
export function clampDiagStreamSliderMs(value: number): number {
  if (!Number.isFinite(value)) {
    return DIAG_STREAM_SLIDER_MIN_MS;
  }
  return Math.max(
    DIAG_STREAM_SLIDER_MIN_MS,
    Math.min(DIAG_STREAM_SLIDER_MAX_MS, Math.round(value)),
  );
}
