import type { SensorHealthStatus } from "../../../store/flow-editor.store";

/** Whether a live readout should use full semantic tint or idle neutral. */
export type LiveReadingStreamTone = "live" | "idle";

/** Scalar semantic kinds — temp / humidity / pressure match sensor deck + library palette. */
export type LiveScalarReadingKind = "temperature" | "humidity" | "pressure" | "neutral";

export type LiveScalarReadingColorHints = {
  /** Flow output handle id (`temp`, `humidity`, `pressure`, `out`, …). */
  handleId?: string;
  /** Catalog node id (`sht40-tap-humidity`, `dps368-input`, …). */
  nodeId?: string;
  unit?: string;
  label?: string;
};

const LIVE_SCALAR_TINT_CLASS: Record<LiveScalarReadingKind, string> = {
  temperature: "text-orange-400/95",
  humidity: "text-cyan-400/95",
  pressure: "text-purple-400/95",
  neutral: "text-zinc-100",
};

const IDLE_SCALAR_TINT_CLASS = "text-zinc-500";

const NODE_ID_SCALAR_KIND: Record<string, LiveScalarReadingKind> = {
  "dps368-tap-pressure": "pressure",
  "sht40-tap-humidity": "humidity",
  "dps368-tap-temp": "temperature",
  "sht40-tap-temp": "temperature",
  "bmm350-tap-temp": "temperature",
  "bmi270-tap-temp": "temperature",
};

function resolveFromHandleId(handleId: string): LiveScalarReadingKind | null {
  const id = handleId.trim().toLowerCase();
  if (id === "temp" || id === "temperature") {
    return "temperature";
  }
  if (id === "humidity" || id === "rh") {
    return "humidity";
  }
  if (id === "pressure" || id === "pr") {
    return "pressure";
  }
  return null;
}

function resolveFromNodeId(nodeId: string): LiveScalarReadingKind | null {
  const mapped = NODE_ID_SCALAR_KIND[nodeId];
  if (mapped != null) {
    return mapped;
  }
  if (nodeId.endsWith("-tap-pressure")) {
    return "pressure";
  }
  if (nodeId.endsWith("-tap-humidity")) {
    return "humidity";
  }
  if (nodeId.endsWith("-tap-temp")) {
    return "temperature";
  }
  return null;
}

function resolveFromUnitOrLabel(hints: {
  unit?: string;
  label?: string;
}): LiveScalarReadingKind {
  const unit = hints.unit?.trim().toLowerCase() ?? "";
  const label = hints.label?.trim().toLowerCase() ?? "";

  if (unit === "°c" || label.includes("temp")) {
    return "temperature";
  }
  if (unit === "%rh" || label === "rh" || label.includes("humid")) {
    return "humidity";
  }
  if (unit === "hpa" || label.includes("pressure") || label === "pr") {
    return "pressure";
  }
  return "neutral";
}

/** Resolve scalar semantic kind from handle, node, unit, or label hints. */
export function resolveLiveScalarReadingKind(
  hints: LiveScalarReadingColorHints,
): LiveScalarReadingKind {
  if (hints.handleId != null && hints.handleId.length > 0) {
    const fromHandle = resolveFromHandleId(hints.handleId);
    if (fromHandle != null) {
      return fromHandle;
    }
  }
  if (hints.nodeId != null && hints.nodeId.length > 0) {
    const fromNode = resolveFromNodeId(hints.nodeId);
    if (fromNode != null) {
      return fromNode;
    }
  }
  return resolveFromUnitOrLabel(hints);
}

const LIVE_SCALAR_FRACTION_DIGITS: Record<LiveScalarReadingKind, number> = {
  temperature: 2,
  humidity: 2,
  /** Matches `dps368PressureDisplayFractionDigits` default in Bitstream config. */
  pressure: 1,
  neutral: 2,
};

/** Decimal places for scalar live readouts (library, flow sockets, aligned rows). */
export function resolveLiveScalarReadingFractionDigits(
  hints: LiveScalarReadingColorHints,
): number {
  return LIVE_SCALAR_FRACTION_DIGITS[resolveLiveScalarReadingKind(hints)];
}

/** Tailwind text color for a scalar live readout (library rows, flow sockets, inspector). */
export function getLiveScalarReadingColorClass(
  streamMode: LiveReadingStreamTone,
  hints: LiveScalarReadingColorHints,
): string {
  if (streamMode === "idle") {
    return IDLE_SCALAR_TINT_CLASS;
  }
  return LIVE_SCALAR_TINT_CLASS[resolveLiveScalarReadingKind(hints)];
}

const LIVE_STREAM_RECENT_MS = 3_000;

/** Derive live vs idle tint from node health and per-handle freshness. */
export function resolveLiveReadingStreamTone(args: {
  sensorHealth?: SensorHealthStatus;
  lastValidAtIso?: string;
  value?: number | null;
}): LiveReadingStreamTone {
  const { sensorHealth, lastValidAtIso, value } = args;
  if (sensorHealth === "live" || sensorHealth === "sim") {
    return "live";
  }
  if (lastValidAtIso != null) {
    const ts = new Date(lastValidAtIso).getTime();
    if (Number.isFinite(ts) && Date.now() - ts <= LIVE_STREAM_RECENT_MS) {
      return "live";
    }
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return "live";
  }
  return "idle";
}
