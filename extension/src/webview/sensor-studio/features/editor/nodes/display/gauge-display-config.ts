export type GaugeDisplayZone = {
  from: number;
  to: number;
  color: string;
};

export type GaugeScaleReadoutConfig = {
  min: number;
  max: number;
  unit: string;
  decimals: number;
  zones: GaugeDisplayZone[];
};

export type GaugeZonePresetId = "traffic" | "monochrome" | "cold-hot";

export const GAUGE_ZONE_PRESET_OPTIONS: ReadonlyArray<{
  id: GaugeZonePresetId;
  label: string;
  hint: string;
}> = [
  {
    id: "traffic",
    label: "Traffic light",
    hint: "Cyan normal, amber warning, red critical across the current scale.",
  },
  {
    id: "monochrome",
    label: "Monochrome",
    hint: "Single neutral band for minimal dashboards.",
  },
  {
    id: "cold-hot",
    label: "Cold → hot",
    hint: "Blue cool, amber mid, red hot thirds of the scale.",
  },
];

const TRAFFIC_COLORS = ["#22d3ee", "#fbbf24", "#f87171"] as const;
const COLD_HOT_COLORS = ["#38bdf8", "#fbbf24", "#f87171"] as const;

export function readGaugeFiniteNumber(raw: unknown, fallback: number): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeGaugeHexColor(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") {
    return fallback;
  }
  const trimmed = raw.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : fallback;
}

export function coerceGaugeDisplayZones(raw: unknown): GaugeDisplayZone[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((entry) => {
      if (entry == null || typeof entry !== "object") {
        return null;
      }
      const o = entry as Record<string, unknown>;
      const from = readGaugeFiniteNumber(o.from, Number.NaN);
      const to = readGaugeFiniteNumber(o.to, Number.NaN);
      if (!Number.isFinite(from) || !Number.isFinite(to)) {
        return null;
      }
      return {
        from,
        to,
        color: normalizeGaugeHexColor(o.color, "#22d3ee"),
      };
    })
    .filter((z): z is GaugeDisplayZone => z != null);
}

export function coerceGaugeScaleReadoutConfig(
  dc: Record<string, unknown>,
  defaults?: Partial<GaugeScaleReadoutConfig>,
): GaugeScaleReadoutConfig {
  const min = readGaugeFiniteNumber(dc.min, defaults?.min ?? 0);
  const max = readGaugeFiniteNumber(dc.max, defaults?.max ?? 100);
  const unit = typeof dc.unit === "string" ? dc.unit : (defaults?.unit ?? "");
  const decimalsRaw = readGaugeFiniteNumber(dc.decimals, defaults?.decimals ?? 1);
  const decimals = Math.max(0, Math.min(6, Math.round(decimalsRaw)));
  const zones =
    coerceGaugeDisplayZones(dc.zones).length > 0
      ? coerceGaugeDisplayZones(dc.zones)
      : (defaults?.zones ?? gaugeZonesFromPreset("traffic", min, max));
  return { min, max, unit, decimals, zones };
}

export function gaugeZonesFromPreset(
  preset: GaugeZonePresetId,
  min: number,
  max: number,
): GaugeDisplayZone[] {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const span = hi - lo;
  if (!Number.isFinite(span) || span <= 0) {
    return [{ from: lo, to: hi, color: TRAFFIC_COLORS[0] }];
  }
  if (preset === "monochrome") {
    return [{ from: lo, to: hi, color: "#a1a1aa" }];
  }
  const colors = preset === "cold-hot" ? COLD_HOT_COLORS : TRAFFIC_COLORS;
  const splits = [0, 0.6, 0.8, 1];
  if (preset === "cold-hot") {
    splits[1] = 1 / 3;
    splits[2] = 2 / 3;
  }
  return [
    {
      from: lo + span * splits[0],
      to: lo + span * splits[1],
      color: colors[0],
    },
    {
      from: lo + span * splits[1],
      to: lo + span * splits[2],
      color: colors[1],
    },
    {
      from: lo + span * splits[2],
      to: lo + span * splits[3],
      color: colors[2],
    },
  ];
}

const GAUGE_ZONE_COMPARE_EPSILON = 1e-6;

function gaugeZonesEqual(
  left: readonly GaugeDisplayZone[],
  right: readonly GaugeDisplayZone[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((zone, index) => {
    const other = right[index];
    if (other == null) {
      return false;
    }
    return (
      Math.abs(zone.from - other.from) <= GAUGE_ZONE_COMPARE_EPSILON &&
      Math.abs(zone.to - other.to) <= GAUGE_ZONE_COMPARE_EPSILON &&
      zone.color.toLowerCase() === other.color.toLowerCase()
    );
  });
}

/** Preset id when zones match a template at the current scale; otherwise `custom`. */
export function matchGaugeZonePreset(
  zones: readonly GaugeDisplayZone[],
  min: number,
  max: number,
): GaugeZonePresetId | "custom" {
  for (const preset of GAUGE_ZONE_PRESET_OPTIONS) {
    if (gaugeZonesEqual(zones, gaugeZonesFromPreset(preset.id, min, max))) {
      return preset.id;
    }
  }
  return "custom";
}

export function gaugePreviewValue(cfg: GaugeScaleReadoutConfig): number {
  const lo = Math.min(cfg.min, cfg.max);
  const hi = Math.max(cfg.min, cfg.max);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    return 0;
  }
  return lo + (hi - lo) * 0.62;
}

export function gaugeZoneColor(
  zones: GaugeDisplayZone[],
  value: number,
  fallback: string,
): string {
  let c = fallback;
  for (const z of zones) {
    if (value >= z.from && value <= z.to) {
      c = z.color;
    }
  }
  return c;
}

export function readGaugeBoolean(raw: unknown, defaultValue: boolean): boolean {
  return typeof raw === "boolean" ? raw : defaultValue;
}

export type RadialGaugeArcPresetId = "automotive270" | "semicircle180" | "wide240";

export const RADIAL_GAUGE_ARC_PRESET_OPTIONS: ReadonlyArray<{
  id: RadialGaugeArcPresetId;
  label: string;
  hint: string;
}> = [
  {
    id: "automotive270",
    label: "270° automotive",
    hint: "Classic sweep with gap at the bottom — default Studio look.",
  },
  {
    id: "semicircle180",
    label: "180° semicircle",
    hint: "Flat bottom arc for compact horizontal layouts.",
  },
  {
    id: "wide240",
    label: "240° wide arc",
    hint: "Extra sweep for dense tick labels on wide nodes.",
  },
];

export type RadialGaugeAppearanceConfig = {
  arcPreset: RadialGaugeArcPresetId;
  showFaceplate: boolean;
  showTrack: boolean;
  showTicks: boolean;
  showTickLabels: boolean;
  showNeedle: boolean;
  showDigitalValue: boolean;
  showUnit: boolean;
  /** Exponential smoothing time constant in ms; 0 = snap instantly. */
  needleSmoothingMs: number;
  showSetpoint: boolean;
  setpoint: number;
  setpointColor: string;
};

export type RadialGaugeConfig = GaugeScaleReadoutConfig & RadialGaugeAppearanceConfig;

export function radialGaugeArcGeometry(preset: RadialGaugeArcPresetId): {
  startDeg: number;
  sweepDeg: number;
} {
  switch (preset) {
    case "semicircle180":
      return { startDeg: 180, sweepDeg: 180 };
    case "wide240":
      return { startDeg: 150, sweepDeg: 240 };
    default:
      return { startDeg: 225, sweepDeg: 270 };
  }
}

function coerceRadialGaugeArcPreset(raw: unknown): RadialGaugeArcPresetId {
  if (raw === "semicircle180" || raw === "wide240" || raw === "automotive270") {
    return raw;
  }
  return "automotive270";
}

export function coerceRadialGaugeAppearanceConfig(
  dc: Record<string, unknown>,
  scale?: GaugeScaleReadoutConfig,
): RadialGaugeAppearanceConfig {
  const smoothingRaw = readGaugeFiniteNumber(dc.needleSmoothingMs, 0);
  const scaleCfg = scale ?? coerceGaugeScaleReadoutConfig(dc);
  const lo = Math.min(scaleCfg.min, scaleCfg.max);
  const hi = Math.max(scaleCfg.min, scaleCfg.max);
  const setpointRaw = readGaugeFiniteNumber(dc.setpoint, (lo + hi) / 2);
  return {
    arcPreset: coerceRadialGaugeArcPreset(dc.arcPreset),
    showFaceplate: readGaugeBoolean(dc.showFaceplate, true),
    showTrack: readGaugeBoolean(dc.showTrack, true),
    showTicks: readGaugeBoolean(dc.showTicks, true),
    showTickLabels: readGaugeBoolean(dc.showTickLabels, true),
    showNeedle: readGaugeBoolean(dc.showNeedle, true),
    showDigitalValue: readGaugeBoolean(dc.showDigitalValue, true),
    showUnit: readGaugeBoolean(dc.showUnit, true),
    needleSmoothingMs: Math.max(0, Math.min(5000, Math.round(smoothingRaw))),
    showSetpoint: readGaugeBoolean(dc.showSetpoint, false),
    setpoint: Math.max(lo, Math.min(hi, setpointRaw)),
    setpointColor: normalizeGaugeHexColor(
      typeof dc.setpointColor === "string" ? dc.setpointColor : null,
      "#fbbf24",
    ),
  };
}

export function coerceRadialGaugeConfig(dc: Record<string, unknown>): RadialGaugeConfig {
  const scale = coerceGaugeScaleReadoutConfig(dc);
  return {
    ...scale,
    ...coerceRadialGaugeAppearanceConfig(dc, scale),
  };
}

export type BarMeterOrientation = "vertical" | "horizontal";

export type BarMeterConfig = GaugeScaleReadoutConfig & {
  orientation: BarMeterOrientation;
  showPeakHold: boolean;
  /** Fill animation time constant in ms (0 = snap to each sample). */
  fillSmoothingMs: number;
};

export function coerceBarMeterConfig(dc: Record<string, unknown>): BarMeterConfig {
  const scale = coerceGaugeScaleReadoutConfig(dc);
  const smoothingRaw = readGaugeFiniteNumber(dc.fillSmoothingMs, 0);
  return {
    ...scale,
    decimals: Math.max(0, Math.min(4, scale.decimals)),
    orientation: dc.orientation === "horizontal" ? "horizontal" : "vertical",
    showPeakHold: readGaugeBoolean(dc.showPeakHold, true),
    fillSmoothingMs: Math.max(0, Math.min(5000, Math.round(smoothingRaw))),
  };
}

export type NumericDisplayConfig = {
  label: string;
  unit: string;
  decimals: number;
  showStatusBar: boolean;
  zones: GaugeDisplayZone[];
};

export function coerceNumericDisplayConfig(dc: Record<string, unknown>): NumericDisplayConfig {
  const decimalsRaw = readGaugeFiniteNumber(dc.decimals, 2);
  const zones = coerceGaugeDisplayZones(dc.zones);
  return {
    label: typeof dc.label === "string" ? dc.label : "",
    unit: typeof dc.unit === "string" ? dc.unit : "",
    decimals: Math.max(0, Math.min(6, Math.round(decimalsRaw))),
    showStatusBar: readGaugeBoolean(dc.showStatusBar, true),
    zones:
      zones.length > 0 ? zones : gaugeZonesFromPreset("traffic", 0, 100),
  };
}

/** Bounds used when applying zone presets on numeric displays (absolute thresholds). */
export function numericDisplayZonePresetBounds(cfg: NumericDisplayConfig): {
  min: number;
  max: number;
} {
  if (cfg.zones.length === 0) {
    return { min: 0, max: 100 };
  }
  let min = Infinity;
  let max = -Infinity;
  for (const z of cfg.zones) {
    min = Math.min(min, z.from, z.to);
    max = Math.max(max, z.from, z.to);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
    return { min: 0, max: 100 };
  }
  return { min, max };
}

export type KnobConfig = GaugeScaleReadoutConfig & {
  value: number;
  step: number;
};

export function coerceKnobConfig(dc: Record<string, unknown>): KnobConfig {
  const scale = coerceGaugeScaleReadoutConfig(dc);
  const lo = Math.min(scale.min, scale.max);
  const hi = Math.max(scale.min, scale.max);
  const valueRaw = readGaugeFiniteNumber(dc.value, lo);
  const stepRaw = readGaugeFiniteNumber(dc.step, 0);
  return {
    ...scale,
    decimals: Math.max(0, Math.min(4, scale.decimals)),
    value: Math.max(lo, Math.min(hi, valueRaw)),
    step: stepRaw > 0 ? stepRaw : 0,
  };
}

export function clampGaugeScalar(value: number | null, min: number, max: number): number | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return Math.max(lo, Math.min(hi, value));
}

/** One exponential-smoothing step toward `target` (time constant = smoothingMs). */
export function stepGaugeNeedleSmoothing(
  current: number,
  target: number,
  dtMs: number,
  smoothingMs: number,
): number {
  if (smoothingMs <= 0 || !Number.isFinite(dtMs) || dtMs <= 0) {
    return target;
  }
  const alpha = 1 - Math.exp(-dtMs / smoothingMs);
  return current + (target - current) * alpha;
}

export function gaugeNeedleSmoothingSettled(
  current: number,
  target: number,
  min: number,
  max: number,
): boolean {
  const span = Math.abs(Math.max(min, max) - Math.min(min, max)) || 1;
  return Math.abs(current - target) <= span * 0.0005;
}

/** @deprecated Legacy compact gauge tile — migrated to {@link LEGACY_GAUGE_MIGRATION_TARGET} on hydrate. */
export const LEGACY_GAUGE_NODE_ID = "gauge";
export const LEGACY_GAUGE_MIGRATION_TARGET = "bar-meter";

export type StudioNodeDataLikeForGaugeMigration = {
  nodeId: string;
  defaultConfig?: Record<string, unknown>;
};

/**
 * Legacy `gauge` assumed values in roughly [-1, 1] for its horizontal fill ratio.
 * Map to horizontal bar meter with the same numeric span.
 */
export function migrateLegacyGaugeNodeData<T extends StudioNodeDataLikeForGaugeMigration>(
  data: T,
): T {
  if (data.nodeId !== LEGACY_GAUGE_NODE_ID) {
    return data;
  }
  const dc = data.defaultConfig ?? {};
  const decimals = readGaugeFiniteNumber(dc.decimals, 3);
  const unit = typeof dc.unit === "string" ? dc.unit : "";
  const min = -1;
  const max = 1;
  return {
    ...data,
    nodeId: LEGACY_GAUGE_MIGRATION_TARGET,
    defaultConfig: {
      min,
      max,
      unit,
      decimals: Math.max(0, Math.min(4, Math.round(decimals))),
      orientation: "horizontal",
      showPeakHold: false,
      fillSmoothingMs: 0,
      zones: gaugeZonesFromPreset("traffic", min, max),
    },
  };
}
