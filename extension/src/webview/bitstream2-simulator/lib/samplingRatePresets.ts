export type HzPreset = {
  label: string;
  hz: number;
  intervalMs: number;
};

export const SAMPLING_HZ_PRESETS: HzPreset[] = [
  { label: "1 Hz", hz: 1, intervalMs: 1000 },
  { label: "5 Hz", hz: 5, intervalMs: 200 },
  { label: "10 Hz", hz: 10, intervalMs: 100 },
  { label: "25 Hz", hz: 25, intervalMs: 40 },
  { label: "50 Hz", hz: 50, intervalMs: 20 },
  { label: "100 Hz", hz: 100, intervalMs: 10 },
];

export const TELEMETRY_HZ_PRESETS: HzPreset[] = [
  { label: "1 Hz", hz: 1, intervalMs: 1000 },
  { label: "2 Hz", hz: 2, intervalMs: 500 },
  { label: "5 Hz", hz: 5, intervalMs: 200 },
  { label: "10 Hz", hz: 10, intervalMs: 100 },
  { label: "20 Hz", hz: 20, intervalMs: 50 },
];

export function hzFromIntervalMs(intervalMs: number): string {
  if (intervalMs <= 0) return "—";
  const hz = 1000 / intervalMs;
  if (hz >= 10) return `${hz.toFixed(0)} Hz`;
  return `${hz.toFixed(1)} Hz`;
}

export function presetMatchesInterval(presets: HzPreset[], intervalMs: number): number | null {
  const match = presets.find((p) => p.intervalMs === intervalMs);
  return match?.hz ?? null;
}
