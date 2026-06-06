/** Persisted Plotter UI + styling (Sensor Studio flow node `defaultConfig`). */

export const PLOTTER_NODE_ID = "plotter";
/** @deprecated Hydrate migrates persisted graphs to {@link PLOTTER_NODE_ID}. */
export const LEGACY_OSCILLOSCOPE_NODE_ID = "oscilloscope";

export function isPlotterNodeId(nodeId: string): boolean {
  return nodeId === PLOTTER_NODE_ID || nodeId === LEGACY_OSCILLOSCOPE_NODE_ID;
}

export const PLOTTER_INPUT_IDS = ["ch1", "ch2", "ch3", "ch4"] as const;
export type PlotterInputId = (typeof PLOTTER_INPUT_IDS)[number];

export type PlotterLineStyle = "solid" | "dashed" | "dotted";
export type PlotterMarkerStyle = "none" | "dots" | "cross";

export type PlotterChannelStyle = {
  label: string;
  visible: boolean;
  colorHex: string;
  lineStyle: PlotterLineStyle;
  lineWidthPx: number;
  marker: PlotterMarkerStyle;
  /** Draw a marker every N samples along the visible window (≥ 1). */
  markerEvery: number;
};

export type PlotterConfig = {
  /** Points retained per channel (not sample rate in Hz). */
  historyLength: number;
  verticalGain: number;
  verticalOffset: number;
  autoScale: boolean;
  yMin: number;
  yMax: number;
  showGrid: boolean;
  timeDivisions: number;
  ampDivisions: number;
  showLegend: boolean;
  /** Stop appending samples while frozen (trace buffer is retained). */
  pauseAcquisition: boolean;
  channels: Record<string, PlotterChannelStyle>;
};

const DEFAULT_CHANNEL_COLORS: Record<PlotterInputId, string> = {
  ch1: "#22d3ee",
  ch2: "#fbbf24",
  ch3: "#34d399",
  ch4: "#fb7185",
};

const DEFAULT_CHANNEL_LABELS: Record<PlotterInputId, string> = {
  ch1: "Ch 1",
  ch2: "Ch 2",
  ch3: "Ch 3",
  ch4: "Ch 4",
};

export const DEFAULT_PLOTTER_CONFIG: PlotterConfig = {
  historyLength: 256,
  verticalGain: 1,
  verticalOffset: 0,
  autoScale: true,
  yMin: -1,
  yMax: 1,
  showGrid: true,
  timeDivisions: 8,
  ampDivisions: 6,
  showLegend: true,
  pauseAcquisition: false,
  channels: PLOTTER_INPUT_IDS.reduce(
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
    {} as Record<string, PlotterChannelStyle>,
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

function asLineStyle(v: unknown, fallback: PlotterLineStyle): PlotterLineStyle {
  return v === "solid" || v === "dashed" || v === "dotted" ? v : fallback;
}

function asMarkerStyle(v: unknown, fallback: PlotterMarkerStyle): PlotterMarkerStyle {
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

function coerceChannel(raw: unknown, id: PlotterInputId): PlotterChannelStyle {
  const d = DEFAULT_PLOTTER_CONFIG.channels[id]!;
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

function readHistoryLength(o: Record<string, unknown>, fallback: number): number {
  if (o.historyLength != null) {
    return Math.round(clamp(asFinite(o.historyLength, fallback), 16, 2048));
  }
  if (o.sampleCount != null) {
    return Math.round(clamp(asFinite(o.sampleCount, fallback), 16, 2048));
  }
  return Math.round(clamp(fallback, 16, 2048));
}

/** Merge catalog defaults with persisted `defaultConfig` fragments. */
export function coercePlotterConfig(raw: unknown): PlotterConfig {
  const d = DEFAULT_PLOTTER_CONFIG;
  if (raw == null || typeof raw !== "object") {
    return {
      ...d,
      channels: PLOTTER_INPUT_IDS.reduce(
        (acc, id) => {
          acc[id] = { ...d.channels[id]! };
          return acc;
        },
        {} as Record<string, PlotterChannelStyle>,
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
  const channels: Record<string, PlotterChannelStyle> = {};
  for (const id of PLOTTER_INPUT_IDS) {
    channels[id] = coerceChannel(channelsRaw?.[id], id);
  }
  return {
    historyLength: readHistoryLength(o, d.historyLength),
    verticalGain: clamp(asFinite(o.verticalGain, d.verticalGain), 0.001, 1e6),
    verticalOffset: asFinite(o.verticalOffset, d.verticalOffset),
    autoScale: asBool(o.autoScale, d.autoScale),
    yMin,
    yMax,
    showGrid: asBool(o.showGrid, d.showGrid),
    timeDivisions: Math.round(clamp(asFinite(o.timeDivisions, d.timeDivisions), 2, 32)),
    ampDivisions: Math.round(clamp(asFinite(o.ampDivisions, d.ampDivisions), 2, 24)),
    showLegend: asBool(o.showLegend, d.showLegend),
    pauseAcquisition: asBool(o.pauseAcquisition, d.pauseAcquisition),
    channels,
  };
}

export function persistPlotterConfig(cfg: PlotterConfig): PlotterConfig {
  return coercePlotterConfig(cfg);
}

/** Migrate legacy oscilloscope node payload on hydrate / import. */
export function migrateLegacyPlotterNodeData(data: StudioNodeDataLike): StudioNodeDataLike {
  let next: StudioNodeDataLike =
    data.nodeId === LEGACY_OSCILLOSCOPE_NODE_ID ? { ...data, nodeId: PLOTTER_NODE_ID } : data;

  if (next.nodeId !== PLOTTER_NODE_ID) {
    return next;
  }

  const dc = { ...(next.defaultConfig ?? {}) };
  if (dc.historyLength == null && dc.sampleCount != null) {
    dc.historyLength = dc.sampleCount;
  }
  delete dc.sampleCount;

  const livePlotHistory = next.livePlotHistory ?? next.liveScopeHistory;
  const { liveScopeHistory: _legacyScope, ...rest } = next;
  return {
    ...rest,
    defaultConfig: dc,
    ...(livePlotHistory != null ? { livePlotHistory } : {}),
  };
}

/** Minimal shape for migrate helper (avoids store import cycle). */
export type StudioNodeDataLike = {
  nodeId: string;
  defaultConfig?: Record<string, unknown>;
  livePlotHistory?: Record<string, number[]>;
  liveScopeHistory?: Record<string, number[]>;
};
