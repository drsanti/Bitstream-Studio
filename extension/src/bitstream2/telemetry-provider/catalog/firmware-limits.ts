/**
 * Firmware SENSOR_CFG clamp limits (CM55 parity).
 * Keep aligned with `bitstream2/dev/uart-sensor-cfg-assert.ts`.
 */
export const FW_SAMPLING_MIN_MS = 10;
export const FW_SAMPLING_MAX_MS = 60000;
export const FW_DELTA_MAX_X100 = 10000;

export const BS2_PUBLISH_MODE_LABELS = ["periodic", "on_change", "hybrid"] as const;
export type Bs2PublishModeLabel = (typeof BS2_PUBLISH_MODE_LABELS)[number];

export function publishModeLabel(mode: number): Bs2PublishModeLabel {
  if (mode === 1) return "on_change";
  if (mode === 2) return "hybrid";
  return "periodic";
}

export function publishModeCode(label: Bs2PublishModeLabel): 0 | 1 | 2 {
  if (label === "on_change") return 1;
  if (label === "hybrid") return 2;
  return 0;
}
