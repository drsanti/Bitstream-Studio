export type HzPreset = {
  label: string;
  hz: number;
  intervalMs: number;
};

/** Internal sample tick (`samplingIntervalMs`). */
export const SAMPLING_HZ_PRESETS: HzPreset[] = [
  { label: "1 Hz", hz: 1, intervalMs: 1000 },
  { label: "2 Hz", hz: 2, intervalMs: 500 },
  { label: "5 Hz", hz: 5, intervalMs: 200 },
  { label: "10 Hz", hz: 10, intervalMs: 100 },
  { label: "20 Hz", hz: 20, intervalMs: 50 },
  { label: "25 Hz", hz: 25, intervalMs: 40 },
  { label: "50 Hz", hz: 50, intervalMs: 20 },
  { label: "100 Hz", hz: 100, intervalMs: 10 },
];

/** Fast IMU / mag (`BMI270`, `BMM350`). */
export const FAST_SENSOR_SAMPLING_HZ_PRESETS: HzPreset[] = SAMPLING_HZ_PRESETS;

/** Baro / RH-T (`DPS368`, `SHT40`). */
export const SLOW_SENSOR_SAMPLING_HZ_PRESETS: HzPreset[] = [
  { label: "0.33 Hz", hz: 0.33, intervalMs: 3000 },
  { label: "0.5 Hz", hz: 0.5, intervalMs: 2000 },
  { label: "1 Hz", hz: 1, intervalMs: 1000 },
  { label: "2 Hz", hz: 2, intervalMs: 500 },
  { label: "5 Hz", hz: 5, intervalMs: 200 },
  { label: "10 Hz", hz: 10, intervalMs: 100 },
  { label: "20 Hz", hz: 20, intervalMs: 50 },
];

/** Convert a target rate to `samplingIntervalMs` (rounded, minimum 1 ms). */
export function intervalMsFromHz(hz: number): number {
  if (!Number.isFinite(hz) || hz <= 0)
  {
    return 1000;
  }
  return Math.max(1, Math.round(1000 / hz));
}

/** UART `EVT_SENSOR` publish cadence (`publishIntervalMs`, v2.1). */
export const TELEMETRY_HZ_PRESETS: HzPreset[] = [
  { label: "1 Hz", hz: 1, intervalMs: 1000 },
  { label: "2 Hz", hz: 2, intervalMs: 500 },
  { label: "5 Hz", hz: 5, intervalMs: 200 },
  { label: "10 Hz", hz: 10, intervalMs: 100 },
  { label: "20 Hz", hz: 20, intervalMs: 50 },
  { label: "25 Hz", hz: 25, intervalMs: 40 },
  { label: "50 Hz", hz: 50, intervalMs: 20 },
];

/** Minimum gap between on-change / hybrid emits (`minPublishIntervalMs`). `0` = no floor. */
export const MIN_PUBLISH_HZ_PRESETS: HzPreset[] = [
  { label: "Off", hz: 0, intervalMs: 0 },
  { label: "1 Hz", hz: 1, intervalMs: 1000 },
  { label: "2 Hz", hz: 2, intervalMs: 500 },
  { label: "5 Hz", hz: 5, intervalMs: 200 },
  { label: "10 Hz", hz: 10, intervalMs: 100 },
  { label: "20 Hz", hz: 20, intervalMs: 50 },
];

/** BMI270 BSX fusion feed interval (host → firmware). */
export const FUSION_FEED_HZ_PRESETS: HzPreset[] = [
  { label: "10 Hz", hz: 10, intervalMs: 100 },
  { label: "15 Hz", hz: 15, intervalMs: 67 },
  { label: "20 Hz", hz: 20, intervalMs: 50 },
  { label: "25 Hz", hz: 25, intervalMs: 40 },
  { label: "50 Hz", hz: 50, intervalMs: 20 },
  { label: "100 Hz", hz: 100, intervalMs: 10 },
];

export function hzFromIntervalMs(intervalMs: number): string {
  if (intervalMs <= 0) {
    return "—";
  }
  const hz = 1000 / intervalMs;
  if (hz >= 10) {
    return `${hz.toFixed(0)} Hz`;
  }
  if (hz >= 1) {
    return `${hz.toFixed(1)} Hz`;
  }
  return `${hz.toFixed(2)} Hz`;
}

export function presetMatchesInterval(
  presets: HzPreset[],
  intervalMs: number,
): number | null {
  const match = presets.find((p) => p.intervalMs === intervalMs);
  return match?.hz ?? null;
}

export function clampIntervalMs(
  intervalMs: number,
  minMs: number,
  maxMs: number,
): number {
  if (intervalMs <= 0) {
    return 0;
  }
  return Math.max(minMs, Math.min(maxMs, Math.round(intervalMs)));
}

/** Hz equivalent of `intervalMs` (0 when off / invalid). */
export function hzValueFromIntervalMs(intervalMs: number): number
{
  if (intervalMs <= 0)
  {
    return 0;
  }
  return 1000 / intervalMs;
}

/** Slider axis bounds: left = low Hz, right = high Hz. */
export function hzSliderBoundsFromIntervalMsRange(
  minMs: number,
  maxMs: number,
  allowZero: boolean,
): { minHz: number; maxHz: number }
{
  const maxHz = minMs > 0 ? 1000 / minMs : 100;
  const minHz = allowZero ? 0 : maxMs > 0 ? 1000 / maxMs : 0;
  return { minHz, maxHz };
}

/** Slider bounds aligned with preset chip Hz labels (preferred for rate cards). */
export function hzSliderBoundsFromPresets(
  presets: HzPreset[],
  allowZero: boolean,
): { minHz: number; maxHz: number }
{
  const hzList = presets.map((p) => p.hz);
  const positiveHz = hzList.filter((h) => h > 0);
  const maxHz = positiveHz.length > 0 ? Math.max(...positiveHz) : 100;
  const minHz =
    allowZero && hzList.some((h) => h === 0)
      ? 0
      : positiveHz.length > 0
        ? Math.min(...positiveHz)
        : 0;
  return { minHz, maxHz };
}

/** Clamp range from preset `intervalMs` values (includes 0 when allowed). */
export function intervalMsBoundsFromPresets(
  presets: HzPreset[],
  allowZero: boolean,
): { minMs: number; maxMs: number }
{
  const msList = presets.map((p) => p.intervalMs);
  const positiveMs = msList.filter((m) => m > 0);
  const maxMs = positiveMs.length > 0 ? Math.max(...positiveMs) : 65535;
  const minMs =
    allowZero && msList.some((m) => m === 0)
      ? 0
      : positiveMs.length > 0
        ? Math.min(...positiveMs)
        : 1;
  return { minMs, maxMs };
}

/** Smallest positive Hz gap between preset chips (for slider step). */
export function hzSliderStepFromPresets(presets: HzPreset[]): number
{
  const hz = [...new Set(presets.map((p) => p.hz).filter((h) => h > 0))].sort((a, b) => a - b);
  if (hz.length <= 1)
  {
    return hz.length === 1 && hz[0] < 1 ? 0.01 : 1;
  }
  const minHz = hz[0];
  if (minHz < 1)
  {
    /* Sub-Hz chips (0.33, 0.5, …) need a fine grid; 0.01 hits all slow-sensor presets. */
    return 0.01;
  }
  let step = hz[1] - hz[0];
  for (let i = 2; i < hz.length; i++)
  {
    const delta = hz[i] - hz[i - 1];
    if (delta > 0 && delta < step)
    {
      step = delta;
    }
  }
  return Math.max(1, Math.round(step));
}

/** Round Hz for `<input type="range">` value (avoids 1000/3000 float noise). */
export function roundHzForSlider(hz: number): number
{
  if (!Number.isFinite(hz))
  {
    return 0;
  }
  if (hz < 1)
  {
    return Math.round(hz * 100) / 100;
  }
  if (hz < 10)
  {
    return Math.round(hz * 10) / 10;
  }
  return Math.round(hz);
}

/** Snap Hz to `stepHz` grid, clamped to [minHz, maxHz]. */
export function snapHzToSliderStep(
  hz: number,
  stepHz: number,
  minHz: number,
  maxHz: number,
): number
{
  if (!Number.isFinite(hz))
  {
    return minHz;
  }
  if (stepHz <= 0)
  {
    return Math.max(minHz, Math.min(maxHz, hz));
  }
  let snapped = Math.round(hz / stepHz) * stepHz;
  snapped = roundHzForSlider(snapped);
  if (snapped < minHz)
  {
    snapped = minHz;
  }
  if (snapped > maxHz)
  {
    snapped = maxHz;
  }
  return snapped;
}
