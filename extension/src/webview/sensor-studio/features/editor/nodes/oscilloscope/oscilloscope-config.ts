/** Persisted oscilloscope UI + styling (Sensor Studio flow node `defaultConfig`). */

export const OSCILLOSCOPE_INPUT_IDS = ["ch1", "ch2", "ch3", "ch4"] as const;
export type OscilloscopeInputId = (typeof OSCILLOSCOPE_INPUT_IDS)[number];

export type OscilloscopeLineStyle = "solid" | "dashed" | "dotted";
export type OscilloscopeMarkerStyle = "none" | "dots" | "cross";

export type OscilloscopeChannelStyle = {
  label: string;
  visible: boolean;
  colorHex: string;
  lineStyle: OscilloscopeLineStyle;
  lineWidthPx: number;
  marker: OscilloscopeMarkerStyle;
  /** Draw a marker every N samples along the visible window (≥ 1). */
  markerEvery: number;
};

export type OscilloscopeConfig = {
  /** Depth of the shared time buffer (samples retained per channel). */
  sampleCount: number;
  /** Vertical amplifier — multiplied on every sample before mapping (shared Y axis). */
  verticalGain: number;
  /** Added after gain (shared offset, volts-offset analogy). */
  verticalOffset: number;
  /** When true, Y limits follow visible window min/max across visible traces. */
  autoScale: boolean;
  /** Fixed amplitude limits when `autoScale` is false. */
  yMin: number;
  yMax: number;
  showGrid: boolean;
  timeDivisions: number;
  ampDivisions: number;
  showLegend: boolean;
  channels: Record<string, OscilloscopeChannelStyle>;
};

const DEFAULT_CHANNEL_COLORS: Record<OscilloscopeInputId, string> = {
  ch1: "#22d3ee",
  ch2: "#fbbf24",
  ch3: "#34d399",
  ch4: "#fb7185",
};

const DEFAULT_CHANNEL_LABELS: Record<OscilloscopeInputId, string> = {
  ch1: "Ch 1",
  ch2: "Ch 2",
  ch3: "Ch 3",
  ch4: "Ch 4",
};

export const DEFAULT_OSCILLOSCOPE_CONFIG: OscilloscopeConfig = {
  sampleCount: 256,
  verticalGain: 1,
  verticalOffset: 0,
  autoScale: true,
  yMin: -1,
  yMax: 1,
  showGrid: true,
  timeDivisions: 8,
  ampDivisions: 6,
  showLegend: true,
  channels: OSCILLOSCOPE_INPUT_IDS.reduce(
    (acc, id) => {
      acc[id] = {
        label: DEFAULT_CHANNEL_LABELS[id],
        visible: true,
        colorHex: DEFAULT_CHANNEL_COLORS[id],
        lineStyle: "solid",
        lineWidthPx: 1.75,
        marker: "none",
        markerEvery: 8,
      };
      return acc;
    },
    {} as Record<string, OscilloscopeChannelStyle>,
  ),
};

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

function asLineStyle(v: unknown, fallback: OscilloscopeLineStyle): OscilloscopeLineStyle {
  return v === "solid" || v === "dashed" || v === "dotted" ? v : fallback;
}

function asMarkerStyle(v: unknown, fallback: OscilloscopeMarkerStyle): OscilloscopeMarkerStyle {
  return v === "none" || v === "dots" || v === "cross" ? v : fallback;
}

function asHexColor(v: unknown, fallback: string): string {
  if (typeof v !== "string") {
    return fallback;
  }
  const s = v.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s) || /^#[0-9a-fA-F]{3}$/.test(s)) {
    return s;
  }
  return fallback;
}

function coerceChannel(raw: unknown, id: OscilloscopeInputId): OscilloscopeChannelStyle {
  const d = DEFAULT_OSCILLOSCOPE_CONFIG.channels[id]!;
  if (raw == null || typeof raw !== "object") {
    return { ...d };
  }
  const o = raw as Record<string, unknown>;
  return {
    label: typeof o.label === "string" && o.label.trim().length > 0 ? o.label.trim() : d.label,
    visible: asBool(o.visible, d.visible),
    colorHex: asHexColor(o.colorHex, d.colorHex),
    lineStyle: asLineStyle(o.lineStyle, d.lineStyle),
    lineWidthPx: clamp(asFinite(o.lineWidthPx, d.lineWidthPx), 0.5, 6),
    marker: asMarkerStyle(o.marker, d.marker),
    markerEvery: Math.round(clamp(asFinite(o.markerEvery, d.markerEvery), 1, 64)),
  };
}

/** Merge catalog defaults with persisted `defaultConfig` fragments. */
export function coerceOscilloscopeConfig(raw: unknown): OscilloscopeConfig {
  const d = DEFAULT_OSCILLOSCOPE_CONFIG;
  if (raw == null || typeof raw !== "object") {
    return {
      ...d,
      channels: OSCILLOSCOPE_INPUT_IDS.reduce(
        (acc, id) => {
          acc[id] = { ...d.channels[id]! };
          return acc;
        },
        {} as Record<string, OscilloscopeChannelStyle>,
      ),
    };
  }
  const o = raw as Record<string, unknown>;
  let yMin = asFinite(o.yMin, d.yMin);
  let yMax = asFinite(o.yMax, d.yMax);
  if (yMin > yMax) {
    const t = yMin;
    yMin = yMax;
    yMax = t;
  }
  const channelsRaw = (o.channels ?? null) as Record<string, unknown> | null;
  const channels: Record<string, OscilloscopeChannelStyle> = {};
  for (const id of OSCILLOSCOPE_INPUT_IDS) {
    channels[id] = coerceChannel(channelsRaw?.[id], id);
  }
  return {
    sampleCount: Math.round(
      clamp(asFinite(o.sampleCount, d.sampleCount), 16, 2048),
    ),
    verticalGain: clamp(asFinite(o.verticalGain, d.verticalGain), 0.001, 1e6),
    verticalOffset: asFinite(o.verticalOffset, d.verticalOffset),
    autoScale: asBool(o.autoScale, d.autoScale),
    yMin,
    yMax,
    showGrid: asBool(o.showGrid, d.showGrid),
    timeDivisions: Math.round(clamp(asFinite(o.timeDivisions, d.timeDivisions), 2, 32)),
    ampDivisions: Math.round(clamp(asFinite(o.ampDivisions, d.ampDivisions), 2, 24)),
    showLegend: asBool(o.showLegend, d.showLegend),
    channels,
  };
}

export function persistOscilloscopeConfig(cfg: OscilloscopeConfig): OscilloscopeConfig {
  return coerceOscilloscopeConfig(cfg);
}
