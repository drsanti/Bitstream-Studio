export type AudioScopeThemePreset =
  | "studio-cyan"
  | "amber"
  | "phosphor"
  | "mono"
  | "custom";

export type AudioScopeDisplayConfig = {
  themePreset: AudioScopeThemePreset;
  plotBackgroundHex: string;
  waveformColorHex: string;
  spectrumColorHex: string;
  waveformLineWidthPx: number;
  waveformStrokeOpacity: number;
  spectrumFillOpacity: number;
  waveformGain: number;
  spectrumGain: number;
  showGrid: boolean;
  showCenterLine: boolean;
  showFrame: boolean;
  timeDivisions: number;
  freqBarCount: number;
};

export const DEFAULT_AUDIO_SCOPE_DISPLAY: AudioScopeDisplayConfig = {
  themePreset: "studio-cyan",
  plotBackgroundHex: "#09090b",
  waveformColorHex: "#22d3ee",
  spectrumColorHex: "#22d3ee",
  waveformLineWidthPx: 1.5,
  waveformStrokeOpacity: 0.85,
  spectrumFillOpacity: 0.45,
  waveformGain: 1,
  spectrumGain: 1,
  showGrid: true,
  showCenterLine: true,
  showFrame: true,
  timeDivisions: 8,
  freqBarCount: 64,
};

export const AUDIO_SCOPE_THEME_PRESETS: ReadonlyArray<{
  id: Exclude<AudioScopeThemePreset, "custom">;
  label: string;
  hint: string;
  display: Omit<AudioScopeDisplayConfig, "themePreset">;
}> = [
  {
    id: "studio-cyan",
    label: "Studio",
    hint: "Default cyan trace on dark plot (matches Plotter ch1).",
    display: {
      plotBackgroundHex: "#09090b",
      waveformColorHex: "#22d3ee",
      spectrumColorHex: "#22d3ee",
      waveformLineWidthPx: 1.5,
      waveformStrokeOpacity: 0.85,
      spectrumFillOpacity: 0.45,
      waveformGain: 1,
      spectrumGain: 1,
      showGrid: true,
      showCenterLine: true,
      showFrame: true,
      timeDivisions: 8,
      freqBarCount: 64,
    },
  },
  {
    id: "amber",
    label: "Amber",
    hint: "Warm amber scope trace for high-contrast demos.",
    display: {
      plotBackgroundHex: "#0c0a09",
      waveformColorHex: "#fbbf24",
      spectrumColorHex: "#f59e0b",
      waveformLineWidthPx: 1.5,
      waveformStrokeOpacity: 0.9,
      spectrumFillOpacity: 0.5,
      waveformGain: 1,
      spectrumGain: 1,
      showGrid: true,
      showCenterLine: true,
      showFrame: true,
      timeDivisions: 8,
      freqBarCount: 64,
    },
  },
  {
    id: "phosphor",
    label: "Phosphor",
    hint: "Green phosphor oscilloscope look.",
    display: {
      plotBackgroundHex: "#020617",
      waveformColorHex: "#4ade80",
      spectrumColorHex: "#22c55e",
      waveformLineWidthPx: 1.5,
      waveformStrokeOpacity: 0.88,
      spectrumFillOpacity: 0.42,
      waveformGain: 1,
      spectrumGain: 1,
      showGrid: true,
      showCenterLine: true,
      showFrame: true,
      timeDivisions: 10,
      freqBarCount: 64,
    },
  },
  {
    id: "mono",
    label: "Mono",
    hint: "Neutral zinc trace for documentation captures.",
    display: {
      plotBackgroundHex: "#09090b",
      waveformColorHex: "#e4e4e7",
      spectrumColorHex: "#a1a1aa",
      waveformLineWidthPx: 1.25,
      waveformStrokeOpacity: 0.8,
      spectrumFillOpacity: 0.35,
      waveformGain: 1,
      spectrumGain: 1,
      showGrid: true,
      showCenterLine: true,
      showFrame: true,
      timeDivisions: 8,
      freqBarCount: 48,
    },
  },
];

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function asFinite(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asBool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function asHexColor(v: unknown, fallback: string): string {
  if (typeof v !== "string") {
    return fallback;
  }
  const s = v.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) {
    return s.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    const r = s[1]!;
    const g = s[2]!;
    const b = s[3]!;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

function asThemePreset(v: unknown, fallback: AudioScopeThemePreset): AudioScopeThemePreset {
  if (
    v === "studio-cyan" ||
    v === "amber" ||
    v === "phosphor" ||
    v === "mono" ||
    v === "custom"
  ) {
    return v;
  }
  return fallback;
}

/** Merge persisted `defaultConfig` with display defaults. */
export function coerceAudioScopeDisplayConfig(raw: unknown): AudioScopeDisplayConfig {
  const d = DEFAULT_AUDIO_SCOPE_DISPLAY;
  if (raw == null || typeof raw !== "object") {
    return { ...d };
  }
  const o = raw as Record<string, unknown>;
  return {
    themePreset: asThemePreset(o.themePreset, d.themePreset),
    plotBackgroundHex: asHexColor(o.plotBackgroundHex, d.plotBackgroundHex),
    waveformColorHex: asHexColor(o.waveformColorHex, d.waveformColorHex),
    spectrumColorHex: asHexColor(o.spectrumColorHex, d.spectrumColorHex),
    waveformLineWidthPx: clamp(asFinite(o.waveformLineWidthPx, d.waveformLineWidthPx), 0.5, 4),
    waveformStrokeOpacity: clamp(
      asFinite(o.waveformStrokeOpacity, d.waveformStrokeOpacity),
      0.1,
      1,
    ),
    spectrumFillOpacity: clamp(asFinite(o.spectrumFillOpacity, d.spectrumFillOpacity), 0.05, 1),
    waveformGain: clamp(asFinite(o.waveformGain, d.waveformGain), 0.25, 4),
    spectrumGain: clamp(asFinite(o.spectrumGain, d.spectrumGain), 0.25, 4),
    showGrid: asBool(o.showGrid, d.showGrid),
    showCenterLine: asBool(o.showCenterLine, d.showCenterLine),
    showFrame: asBool(o.showFrame, d.showFrame),
    timeDivisions: Math.round(clamp(asFinite(o.timeDivisions, d.timeDivisions), 2, 24)),
    freqBarCount: Math.round(clamp(asFinite(o.freqBarCount, d.freqBarCount), 16, 128)),
  };
}

export function audioScopeThemePresetFields(
  preset: Exclude<AudioScopeThemePreset, "custom">,
): Record<string, unknown> {
  const entry = AUDIO_SCOPE_THEME_PRESETS.find((p) => p.id === preset);
  if (entry == null) {
    return { themePreset: preset };
  }
  return {
    themePreset: preset,
    ...entry.display,
  };
}

export function parseHexColorRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = asHexColor(hex, "");
  if (!/^#[0-9a-f]{6}$/.test(normalized)) {
    return null;
  }
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

export function hexColorWithAlpha(hex: string, alpha: number): string {
  const rgb = parseHexColorRgb(hex);
  const a = clamp(alpha, 0, 1);
  if (rgb == null) {
    return `rgba(34, 211, 238, ${a})`;
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}
