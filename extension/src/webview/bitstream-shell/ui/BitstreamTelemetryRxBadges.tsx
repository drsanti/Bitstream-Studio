import { ArrowDownToLine, Radio } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import {
  TRNDataGrid,
  type TRNDataGridColumn,
} from "../../ui/TRN/TRNDataGrid.js";
import { TRNHintText } from "../../ui/TRN/TRNHintText.js";
import { TRNTooltip } from "../../ui/TRN/TRNTooltip.js";
import {
  SENSOR_SOURCE_ID_BMI270,
  SENSOR_SOURCE_ID_BMM350,
  SENSOR_SOURCE_ID_DPS368,
  SENSOR_SOURCE_ID_SHT40,
} from "../../bitstream-app/constants/sensorSourceIds.js";
import {
  isBs2UartFirmwareLink,
  isSimulatorTelemetryBackend,
  isTelemetryDecodePipelineActive,
  isTelemetryTransportReady,
  telemetryLinkStatusLabel,
} from "../../bitstream-app/utils/bitstreamTelemetryTransport.js";
import { useBitstreamConnectionStore } from "../../bitstream-app/state/bitstreamConnection.store.js";
import type { DeviceSensorConfigRow } from "../../bitstream-app/state/bitstreamDeviceSensorConfig.store.js";
import { useBitstreamDeviceSensorConfigStore } from "../../bitstream-app/state/bitstreamDeviceSensorConfig.store.js";
import {
  type HandshakeLifecycleState,
  useBitstreamLiveStore,
} from "../../bitstream-app/state/bitstreamLive.store.js";
import {
  computeRollingFpsFromSampleCount,
  formatAggregateDecodeFps,
} from "../../bitstream-app/utils/telemetryStreamRate.js";
import {
  formatTelemetryDeltaFixed,
  normalizeDeviceBadgeDeltaMs,
} from "../../bitstream-app/utils/telemetryDeltaDisplay.js";
import {
  BITSTREAM_SHELL_STATUS_CHIP_FRAME_CLASS,
  BITSTREAM_SHELL_STATUS_CHIP_ICON_CLASS,
  BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS,
  BITSTREAM_SHELL_TOOLBAR_DECODE_FPS_CHIP_CLASS,
  BITSTREAM_SHELL_TOOLBAR_TELEMETRY_CHIP_TEXT_CLASS,
} from "./workspace-chrome-chip.js";

export type SensorRxChipMetric = "freshness" | "aggregateFps";

export type TelemetryRxBadgeVariant = "chip" | "cardRow" | "panel";

/** Panel layout: one worst-age header row vs one bordered row per sensor hint. */
export type PanelSensorRowsLayout = "aggregate" | "perSensor";

function formatTime(ts: number | null): string {
  if (ts == null) {
    return "—";
  }
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return String(ts);
  }
}

export function formatThroughputBps(bps: number): string {
  if (!Number.isFinite(bps) || bps < 0) {
    return "—";
  }
  if (bps < 1024) {
    return `${Math.round(bps)} B/s`;
  }
  if (bps < 1024 * 1024) {
    return `${(bps / 1024).toFixed(1)} KB/s`;
  }
  return `${(bps / (1024 * 1024)).toFixed(2)} MB/s`;
}

export const SENSOR_RX_HINTS = ["sht40", "dps368", "bmm350", "bmi270"] as const;

const HINT_TO_SOURCE_ID: Record<(typeof SENSOR_RX_HINTS)[number], number> = {
  sht40: SENSOR_SOURCE_ID_SHT40,
  dps368: SENSOR_SOURCE_ID_DPS368,
  bmm350: SENSOR_SOURCE_ID_BMM350,
  bmi270: SENSOR_SOURCE_ID_BMI270,
};

/** Clamp firmware `samplingIntervalMs` to a sane UI window (ms). */
function clampSamplingIntervalMs(raw: number | undefined): number {
  if (raw == null || !Number.isFinite(raw)) {
    return 250;
  }
  return Math.max(10, Math.min(60_000, raw));
}

function isSensorRowEnabled(row: DeviceSensorConfigRow | undefined): boolean {
  if (row == null) {
    return true;
  }
  return row.enabled !== false;
}

/**
 * Per-sensor freshness: **emerald** ≤ 2× configured sampling interval, **amber** ≤ 4×, **rose** beyond.
 * Sensors are evaluated independently (each uses its own `samplingIntervalMs` from verified device config).
 */
function tierForSensorAge(ageMs: number, intervalMs: number | undefined): 0 | 1 | 2 {
  const i = clampSamplingIntervalMs(intervalMs);
  const ok = 2 * i;
  const warn = 4 * i;
  if (ageMs <= ok) {
    return 0;
  }
  if (ageMs <= warn) {
    return 1;
  }
  return 2;
}

/** Exported for telemetry diagnostics wedge banner (same rules as sensor RX badge). */
export function computeWorstSampleAgeMs(
  lastAtByHint: Record<string, number | null>,
  nowMs: number,
  bySourceId: Partial<Record<number, DeviceSensorConfigRow>>,
): number | null {
  const worst = findWorstEnabledSensorAge(lastAtByHint, nowMs, bySourceId);
  return worst?.ageMs ?? null;
}

export type WorstEnabledSensorAge = {
  hint: (typeof SENSOR_RX_HINTS)[number];
  ageMs: number;
  lastAtMs: number;
};

/** Enabled sensor with the largest wall-clock age since last decode. */
export function findWorstEnabledSensorAge(
  lastAtByHint: Record<string, number | null>,
  nowMs: number,
  bySourceId: Partial<Record<number, DeviceSensorConfigRow>>,
): WorstEnabledSensorAge | null {
  let worst: WorstEnabledSensorAge | null = null;
  for (const hint of SENSOR_RX_HINTS) {
    const sid = HINT_TO_SOURCE_ID[hint];
    const row = bySourceId[sid];
    if (!isSensorRowEnabled(row)) {
      continue;
    }
    const t = lastAtByHint[hint];
    if (typeof t !== "number") {
      continue;
    }
    const ageMs = Math.max(0, nowMs - t);
    if (worst == null || ageMs > worst.ageMs) {
      worst = { hint, ageMs, lastAtMs: t };
    }
  }
  return worst;
}

function hintToChipShortLabel(hint: (typeof SENSOR_RX_HINTS)[number]): string {
  switch (hint) {
    case "sht40":
      return "SHT";
    case "dps368":
      return "DPS";
    case "bmm350":
      return "BMM";
    case "bmi270":
      return "BMI";
    default:
      return hint;
  }
}

/** Toolbar chip label — wall age for the pinned worst sensor (not inter-arrival Δ). */
export function formatSensorDecodeChipLabel(hint: (typeof SENSOR_RX_HINTS)[number], ageMs: number): string {
  return `${hintToChipShortLabel(hint)} · ${formatWallClockAgeAgo(ageMs)}`;
}

export type StickyWorstSensorPin = {
  hint: (typeof SENSOR_RX_HINTS)[number];
  pinnedLastAt: number;
};

/**
 * Keep showing one sensor's climbing wall age until that sensor gets a new decode,
 * so the toolbar chip does not flicker when another sensor is only slightly fresher.
 */
export function resolveStickyWorstSensorDisplay(args: {
  pin: StickyWorstSensorPin | null;
  lastAtByHint: Record<string, number | null>;
  nowMs: number;
  bySourceId: Partial<Record<number, DeviceSensorConfigRow>>;
}): { pin: StickyWorstSensorPin; display: WorstEnabledSensorAge } | null {
  const { pin, lastAtByHint, nowMs, bySourceId } = args;

  if (pin != null) {
    const sid = HINT_TO_SOURCE_ID[pin.hint];
    const row = bySourceId[sid];
    const lastAt = lastAtByHint[pin.hint];
    if (
      isSensorRowEnabled(row) &&
      typeof lastAt === "number" &&
      lastAt === pin.pinnedLastAt
    ) {
      return {
        pin,
        display: {
          hint: pin.hint,
          lastAtMs: lastAt,
          ageMs: Math.max(0, nowMs - lastAt),
        },
      };
    }
  }

  const worst = findWorstEnabledSensorAge(lastAtByHint, nowMs, bySourceId);
  if (worst == null) {
    return null;
  }
  return {
    pin: { hint: worst.hint, pinnedLastAt: worst.lastAtMs },
    display: worst,
  };
}

function computeWorstFreshnessTier(
  lastAtByHint: Record<string, number | null>,
  nowMs: number,
  bySourceId: Partial<Record<number, DeviceSensorConfigRow>>,
): 0 | 1 | 2 {
  let worst: 0 | 1 | 2 = 0;
  for (const hint of SENSOR_RX_HINTS) {
    const sid = HINT_TO_SOURCE_ID[hint];
    const row = bySourceId[sid];
    if (!isSensorRowEnabled(row)) {
      continue;
    }
    const t = lastAtByHint[hint];
    if (typeof t !== "number") {
      continue;
    }
    const age = Math.max(0, nowMs - t);
    const tier = tierForSensorAge(age, row?.samplingIntervalMs);
    if (tier > worst) {
      worst = tier;
    }
  }
  return worst;
}

function formatSampleAge(ageMs: number): string {
  if (!Number.isFinite(ageMs) || ageMs < 0) {
    return "—";
  }
  if (ageMs < 1000) {
    return "<1s";
  }
  if (ageMs < 60_000) {
    return `${(ageMs / 1000).toFixed(1)}s`;
  }
  return `${Math.floor(ageMs / 60_000)}m`;
}

/** Wall-clock age since last decode — avoids misleading `0ms ago` while samples are streaming. */
export function formatWallClockAgeAgo(ageMs: number): string {
  if (!Number.isFinite(ageMs) || ageMs < 0) {
    return "—";
  }
  if (ageMs < 1000) {
    return "just now";
  }
  return `${formatSampleAge(ageMs)} ago`;
}

function hintToSensorTitle(hint: (typeof SENSOR_RX_HINTS)[number]): string {
  switch (hint) {
    case "sht40":
      return "SHT40";
    case "dps368":
      return "DPS368";
    case "bmm350":
      return "BMM350";
    case "bmi270":
      return "BMI270";
    default:
      return hint;
  }
}

type PerSensorDecodeRowModel = {
  hint: (typeof SENSOR_RX_HINTS)[number];
  title: string;
  subtitle: string;
  /** Single-line fallback (link pending, disabled, no sample). */
  valueLabel: string;
  /** Last frame Δt (device tMs gap, host fallback via normalizeDeviceBadgeDeltaMs). */
  deltaLabel?: string;
  /** Wall-clock age since last decode in this webview. */
  ageLabel?: string;
  borderClass: string;
  toneClass: string;
};

function formatPerSensorWallAgeLabel(ageMs: number): string {
  return formatWallClockAgeAgo(ageMs);
}

function buildPerSensorDecodeDualLabels(args: {
  ageMs: number;
  deviceInterArrivalMs: number | null | undefined;
}): { deltaLabel: string; ageLabel: string } {
  const deltaMs = normalizeDeviceBadgeDeltaMs({
    deviceInterArrivalMs: args.deviceInterArrivalMs,
    wallAgeMs: args.ageMs,
  });
  return {
    deltaLabel:
      formatTelemetryDeltaFixed(deltaMs, { placeholder: false }) ??
      formatTelemetryDeltaFixed(null, { placeholder: true }) ??
      "--- Δms",
    ageLabel: formatPerSensorWallAgeLabel(args.ageMs),
  };
}

function freshnessTierPanelStyles(tier: 0 | 1 | 2): { borderClass: string; toneClass: string } {
  if (tier === 0) {
    return {
      borderClass: "border-emerald-500/35 bg-emerald-500/10",
      toneClass: "text-emerald-400",
    };
  }
  if (tier === 1) {
    return {
      borderClass: "border-amber-500/35 bg-amber-500/10",
      toneClass: "text-amber-400",
    };
  }
  return {
    borderClass: "border-rose-500/40 bg-rose-500/10",
    toneClass: "text-rose-400",
  };
}

const PANEL_NEUTRAL_STYLES = {
  borderClass: "border-zinc-600/50 bg-white/4",
  toneClass: "text-zinc-500",
} as const;

function buildPerSensorDecodeRowModels(args: {
  decodePipelineActive: boolean;
  linkStatusTransportReady: boolean;
  handshakeState: HandshakeLifecycleState;
  lastAtByHint: Record<string, number | null>;
  lastDeltaMsByHint: Record<string, number | null>;
  nowMs: number;
  bySourceId: Partial<Record<number, DeviceSensorConfigRow>>;
  simulatorMode?: boolean;
}): PerSensorDecodeRowModel[] {
  const {
    decodePipelineActive,
    linkStatusTransportReady,
    handshakeState,
    lastAtByHint,
    lastDeltaMsByHint,
    nowMs,
    bySourceId,
    simulatorMode,
  } = args;

  return SENSOR_RX_HINTS.map((hint) => {
    const sid = HINT_TO_SOURCE_ID[hint];
    const cfg = bySourceId[sid];
    const title = hintToSensorTitle(hint);
    const interval = clampSamplingIntervalMs(cfg?.samplingIntervalMs);

    if (!isSensorRowEnabled(cfg)) {
      return {
        hint,
        title,
        subtitle: "bitstreamLive · disabled",
        valueLabel: "—",
        ...PANEL_NEUTRAL_STYLES,
      };
    }

    const t = lastAtByHint[hint];
    if (typeof t === "number") {
      const ageMs = Math.max(0, nowMs - t);
      const tier = tierForSensorAge(ageMs, cfg?.samplingIntervalMs);
      const status = tier === 0 ? "Good" : tier === 1 ? "Marginal" : "Stale";
      const { borderClass, toneClass } = freshnessTierPanelStyles(tier);
      const { deltaLabel, ageLabel } = buildPerSensorDecodeDualLabels({
        ageMs,
        deviceInterArrivalMs: lastDeltaMsByHint[hint],
      });

      return {
        hint,
        title,
        subtitle: `bitstreamLive · ${interval} ms · ${status}`,
        valueLabel: `${deltaLabel} · ${ageLabel}`,
        deltaLabel,
        ageLabel,
        borderClass,
        toneClass,
      };
    }

    if (!decodePipelineActive) {
      const linkStatus = telemetryLinkStatusLabel({
        transportReady: linkStatusTransportReady,
        handshakeState,
        simulatorMode,
      });
      return {
        hint,
        title,
        subtitle: "bitstreamLive · link pending",
        valueLabel: linkStatus ?? "Link down",
        ...PANEL_NEUTRAL_STYLES,
      };
    }

    return {
      hint,
      title,
      subtitle: `bitstreamLive · ${interval} ms interval`,
      valueLabel: "No sample",
      ...PANEL_NEUTRAL_STYLES,
    };
  });
}

function maxSensorSampleAtMs(
  lastAtByHint: Record<string, number | null>,
  nowMs: number,
): number | null {
  const reasonableUpper = nowMs + 60_000;
  let max = 0;
  for (const hint of SENSOR_RX_HINTS) {
    const t = lastAtByHint[hint];
    if (typeof t === "number" && t <= reasonableUpper && t > max) {
      max = t;
    }
  }
  return max > 0 ? max : null;
}

export type MetricValueRow = { id: string; metric: string; value: string };

export const METRIC_VALUE_GRID_COLUMNS: TRNDataGridColumn<MetricValueRow>[] = [
  {
    id: "metric",
    label: "Metric",
    width: 168,
    sortable: false,
    align: "start",
    getValue: (r) => r.metric,
  },
  {
    id: "value",
    label: "Value",
    width: 208,
    sortable: false,
    align: "end",
    getValue: (r) => r.value,
    cell: (r) => (
      <span className="inline-block min-w-32 normal-nums">{r.value}</span>
    ),
  },
];

export type SensorDiagnosticsRow = {
  id: string;
  sensor: string;
  age: string;
  status: string;
  interval: string;
  last: string;
};

export const SENSOR_DECODE_DIAGNOSTICS_GRID_COLUMNS: TRNDataGridColumn<SensorDiagnosticsRow>[] = [
  {
    id: "sensor",
    label: "Sensor",
    width: 88,
    sortable: false,
    align: "start",
    getValue: (r) => r.sensor,
  },
  {
    id: "age",
    label: "Wall age",
    width: 96,
    sortable: false,
    align: "end",
    getValue: (r) => r.age,
    cell: (r) => (
      <span className="inline-block min-w-18 normal-nums">{r.age}</span>
    ),
  },
  {
    id: "status",
    label: "Status",
    width: 112,
    sortable: false,
    align: "end",
    getValue: (r) => r.status,
  },
  {
    id: "interval",
    label: "Interval",
    width: 96,
    sortable: false,
    align: "end",
    getValue: (r) => r.interval,
    cell: (r) => (
      <span className="inline-block min-w-18 normal-nums">{r.interval}</span>
    ),
  },
  {
    id: "last",
    label: "Last decode",
    width: 112,
    sortable: false,
    align: "end",
    getValue: (r) => r.last,
    cell: (r) => (
      <span className="inline-block min-w-22 normal-nums">{r.last}</span>
    ),
  },
];

export function buildSensorDiagnosticsRows(args: {
  transportReady: boolean;
  handshakeState: HandshakeLifecycleState;
  lastAtByHint: Record<string, number | null>;
  nowMs: number;
  bySourceId: Partial<Record<number, DeviceSensorConfigRow>>;
  simulatorMode?: boolean;
}): SensorDiagnosticsRow[] {
  const { transportReady, handshakeState, lastAtByHint, nowMs, bySourceId } = args;
  const linkStatus = telemetryLinkStatusLabel({
    transportReady,
    handshakeState,
    simulatorMode: args.simulatorMode,
  });

  return SENSOR_RX_HINTS.map((hint) => {
    const sid = HINT_TO_SOURCE_ID[hint];
    const cfg = bySourceId[sid];
    const interval = `${clampSamplingIntervalMs(cfg?.samplingIntervalMs)} ms`;

    if (!transportReady) {
      return {
        id: hint,
        sensor: hintToSensorTitle(hint),
        age: "—",
        status: linkStatus ?? "Link down",
        interval,
        last: "—",
      };
    }
    if (handshakeState !== "passed") {
      return {
        id: hint,
        sensor: hintToSensorTitle(hint),
        age: "—",
        status: linkStatus ?? "—",
        interval,
        last: "—",
      };
    }
    if (!isSensorRowEnabled(cfg)) {
      return {
        id: hint,
        sensor: hintToSensorTitle(hint),
        age: "—",
        status: "Disabled",
        interval,
        last: "—",
      };
    }
    const t = lastAtByHint[hint];
    if (typeof t !== "number") {
      return {
        id: hint,
        sensor: hintToSensorTitle(hint),
        age: "—",
        status: "No sample yet",
        interval,
        last: "—",
      };
    }
    const ageMs = Math.max(0, nowMs - t);
    const tier = tierForSensorAge(ageMs, cfg?.samplingIntervalMs);
    const status = tier === 0 ? "Good" : tier === 1 ? "Marginal" : "Stale";
    return {
      id: hint,
      sensor: hintToSensorTitle(hint),
      age: formatSampleAge(ageMs),
      status,
      interval,
      last: formatTime(t),
    };
  });
}

/**
 * Host-side **serial bridge** RX throughput from `serialport/status` (`bytesRead`), merged on a timer
 * in `runtimeSync` so Zustand is not flooded. Compare with the sensor **Δ** chip: high BRx with stale Δ ⇒ bytes
 * arrive but sensor decode path is stuck or traffic is non-sensor.
 */
export function BitstreamBridgeSerialRxBadge(props: {
  variant?: TelemetryRxBadgeVariant;
  /** Strip outer panel chrome when wrapped in a TRNInteractiveCard. */
  panelEmbed?: boolean;
}) {
  const variant = props.variant ?? "chip";
  const panelEmbed = props.panelEmbed ?? false;
  const serial = useBitstreamConnectionStore((s) => s.serialBridgeStatus);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const tickRef = useRef<{ bytesRead: number; atMs: number }>({ bytesRead: 0, atMs: Date.now() });
  const prevBytesRef = useRef<number | null>(null);
  const lastBytesIncreaseAtRef = useRef<number | null>(null);
  const [displayBps, setDisplayBps] = useState<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 400);
    return () => window.clearInterval(id);
  }, []);

  const bytesRead = serial?.bytesRead ?? 0;
  const bytesWritten = serial?.bytesWritten ?? 0;

  useEffect(() => {
    if (serial?.isOpen !== true) {
      prevBytesRef.current = null;
      lastBytesIncreaseAtRef.current = null;
      return;
    }
    const prev = prevBytesRef.current;
    if (prev != null && bytesRead > prev) {
      lastBytesIncreaseAtRef.current = Date.now();
    }
    prevBytesRef.current = bytesRead;
  }, [bytesRead, serial?.isOpen]);

  useEffect(() => {
    if (serial?.isOpen === true) {
      const br = serial.bytesRead ?? 0;
      const t = Date.now();
      tickRef.current = { bytesRead: br, atMs: t };
      prevBytesRef.current = br;
      lastBytesIncreaseAtRef.current = t;
      setDisplayBps(null);
    }
  }, [serial?.path, serial?.isOpen]);

  useEffect(() => {
    if (serial?.isOpen !== true) {
      setDisplayBps(null);
      return;
    }
    const now = nowMs;
    const prev = tickRef.current;
    const dtSec = (now - prev.atMs) / 1000;
    if (dtSec < 0.25) {
      return;
    }
    const delta = bytesRead - prev.bytesRead;
    const bps = delta / dtSec;
    setDisplayBps(Number.isFinite(bps) ? Math.max(0, bps) : null);
    tickRef.current = { bytesRead, atMs: now };
  }, [bytesRead, nowMs, serial?.isOpen]);

  const triggerAriaLabel = useMemo(() => {
    const tot = `${bytesRead.toLocaleString()} bytes read`;
    const bps = displayBps;
    return bps == null
      ? `Host serial bridge receive rate: estimating (${tot}). See tooltip.`
      : `Host serial bridge receive rate ${formatThroughputBps(bps)} (${tot}). See tooltip.`;
  }, [bytesRead, displayBps]);

  const hostMetricRows = useMemo((): MetricValueRow[] | null => {
    if (serial?.isOpen !== true) {
      return null;
    }
    return [
      { id: "read", metric: "bytesRead (cumulative)", value: bytesRead.toLocaleString() },
      { id: "write", metric: "bytesWritten (cumulative)", value: bytesWritten.toLocaleString() },
    ];
  }, [serial?.isOpen, bytesRead, bytesWritten]);

  if (serial?.isOpen !== true) {
    if (variant === "chip") {
      return null;
    }
    return (
      <div className="rounded-md border border-white/10 bg-black/25 px-2 py-1.5 text-[11px] text-zinc-500">
        Host RX unavailable (serial closed).
      </div>
    );
  }

  const bps = displayBps;
  const idleMs =
    lastBytesIncreaseAtRef.current != null ? nowMs - lastBytesIncreaseAtRef.current : null;
  const toneClass =
    bps != null && bps >= 200
      ? "text-emerald-400"
      : bps != null && bps >= 32
        ? "text-emerald-300/90"
        : bps != null && bps > 0
          ? "text-amber-400"
          : idleMs != null && idleMs > 5000
            ? "text-rose-400"
            : "text-zinc-500";
  const borderClass =
    bps != null && bps >= 32
      ? "border-emerald-500/35 bg-emerald-500/10"
      : bps != null && bps > 0
        ? "border-amber-500/35 bg-amber-500/10"
        : idleMs != null && idleMs > 5000
          ? "border-rose-500/40 bg-rose-500/10"
          : "border-zinc-600/50 bg-white/4";

  const rateLabel = bps == null ? "BRx …" : `BRx ${formatThroughputBps(bps)}`;

  const tooltip = (
    <div className="min-w-0 max-w-[280px] whitespace-pre-line text-left">
      <div className="font-semibold text-zinc-100">Host serial RX (bridge)</div>
      <div className="text-zinc-300">
        From <span className="font-mono">serialport/status</span> — bridge-side{" "}
        <span className="font-mono">bytesRead</span> / <span className="font-mono">bytesWritten</span> counters on the
        Node process (not decoded sensor Hz).
      </div>
      <div className="mt-1 font-mono text-[11px] text-zinc-300">
        bytesRead: {bytesRead.toLocaleString()}
        {"\n"}
        bytesWritten: {bytesWritten.toLocaleString()}
      </div>
      {bps != null ? <div className="mt-1 text-zinc-400">Rate: ~{formatThroughputBps(bps)}</div> : null}
      <div className="mt-2 text-zinc-500">
        If <span className="font-mono">BRx</span> stays strong but the sensor <span className="font-mono">Δ</span> chip
        goes red, the PC is receiving UART data while this UI is not turning it into decoded sensor samples (parser,
        session, or non-sensor traffic).
      </div>
    </div>
  );

  const hostRxRow = (
    <div
      role={variant === "panel" ? "region" : "button"}
      tabIndex={variant === "panel" ? -1 : 0}
      aria-label={variant === "panel" ? undefined : triggerAriaLabel}
      className={twMerge(
        "flex w-full min-w-0 items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-left outline-none transition-colors",
        variant === "panel"
          ? "cursor-default"
          : "cursor-default focus-visible:ring-1 focus-visible:ring-amber-300/60",
        borderClass,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <ArrowDownToLine size={16} aria-hidden className={`shrink-0 ${toneClass}`} />
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Host RX</div>
          <div className="truncate text-[10px] text-zinc-500">serialport/status · bytesRead</div>
        </div>
      </div>
      <div
        className={twMerge(
          "shrink-0 text-xs text-zinc-100",
          variant === "panel"
            ? "inline-block min-w-30 text-end"
            : "",
          toneClass,
        )}
      >
        {rateLabel}
      </div>
    </div>
  );

  const hostRxPanelDetails =
    variant === "panel" && hostMetricRows != null ? (
      <div className="min-w-0 space-y-2 border-t border-zinc-800/70 bg-zinc-950/35 px-2 py-2">
        <TRNDataGrid
          columns={METRIC_VALUE_GRID_COLUMNS}
          rows={hostMetricRows}
          getRowId={(r) => r.id}
          stickyHeader={false}
          className="border-zinc-700/60 text-[11px]"
        />
        <TRNHintText tone="muted" className="mb-0 text-[10px] leading-snug">
          From serialport/status on the Node bridge (not MCU UART TX counters). If BRx stays strong while the sensor
          decode summary goes stale, bytes reach this host but decoded samples are not updating.
        </TRNHintText>
      </div>
    ) : null;

  if (variant === "panel") {
    const cardsBody = (
      <>
        {hostRxRow}
        {hostRxPanelDetails}
      </>
    );
    if (panelEmbed) {
      return cardsBody;
    }
    return (
      <div className="overflow-hidden rounded-lg border border-zinc-700/60 bg-zinc-950/50 ring-1 ring-black/15">
        {cardsBody}
      </div>
    );
  }

  if (variant === "cardRow") {
    return (
      <TRNTooltip
        placement="bottom-start"
        openDelayMs={450}
        disableHoverFx
        triggerClassName={twMerge("!p-0 block w-full")}
        triggerAriaLabel={triggerAriaLabel}
        content={tooltip}
        trigger={hostRxRow}
      />
    );
  }

  return (
    <TRNTooltip
      placement="bottom-end"
      openDelayMs={650}
      disableHoverFx
      triggerClassName="!p-0 max-w-full"
      triggerAriaLabel={triggerAriaLabel}
      content={tooltip}
      trigger={
        <span
          className={`inline-flex min-w-0 max-w-full select-none items-center justify-end gap-1 truncate rounded-md border px-1.5 py-0.5 text-[10px] leading-none ${borderClass} text-zinc-200/95`}
        >
          <ArrowDownToLine size={12} aria-hidden="true" className={`shrink-0 ${toneClass}`} />
          <span className={`min-w-0 truncate ${toneClass}`}>{rateLabel}</span>
        </span>
      }
    />
  );
}

/**
 * Time since **this webview** last decoded a sensor sample into `bitstreamLive` (not the same as
 * broker `FIRMWARE_LIVENESS`). Helps when WS + serial stay “green” but telemetry values stop moving.
 */
export function BitstreamSensorSampleRxBadge(props: {
  variant?: TelemetryRxBadgeVariant;
  panelEmbed?: boolean;
  /** Panel-only: aggregate worst-age row (default) vs one row per sensor hint. */
  panelSensorRows?: PanelSensorRowsLayout;
  /** Chip-only: show rolling decode FPS (all sensors) vs worst-sensor wall age. */
  chipMetric?: SensorRxChipMetric;
  /** When decode Δ is stale (≥3s), click triggers reconnect (Sensor Studio toolbar). */
  onReconnectTelemetry?: () => void;
  /** Fixed-width shell toolbar slot for aggregate FPS chip (always visible). */
  toolbarSlot?: boolean;
}) {
  const variant = props.variant ?? "chip";
  const panelEmbed = props.panelEmbed ?? false;
  const panelSensorRows = props.panelSensorRows ?? "aggregate";
  const chipMetric = props.chipMetric ?? "freshness";
  const toolbarSlot = props.toolbarSlot ?? false;
  const isAggregateFpsChip = variant === "chip" && chipMetric === "aggregateFps";
  const isToolbarFpsSlot = toolbarSlot && isAggregateFpsChip;
  const onReconnectTelemetry = props.onReconnectTelemetry;
  const handshakeState = useBitstreamLiveStore((s) => s.handshakeState);
  const lastAtByHint = useBitstreamLiveStore((s) => s.lastAtByHint);
  const lastDeltaMsByHint = useBitstreamLiveStore((s) => s.lastDeltaMsByHint);
  const sampleCount = useBitstreamLiveStore((s) => s.sampleCount);
  const bySourceId = useBitstreamDeviceSensorConfigStore((s) => s.bySourceId);
  const connected = useBitstreamConnectionStore((s) => s.connected);
  const transportState = useBitstreamConnectionStore((s) => s.transportState);
  const serialBridgeStatus = useBitstreamConnectionStore((s) => s.serialBridgeStatus);
  const simulatorMode = isSimulatorTelemetryBackend();
  const transportReady = isTelemetryTransportReady({
    connected,
    transportState,
    serialBridgeStatus,
  });
  const [nowMs, setNowMs] = useState(() => Date.now());
  const stickyWorstPinRef = useRef<StickyWorstSensorPin | null>(null);
  const fpsTickRef = useRef({ sampleCount: 0, atMs: Date.now() });
  const prevSampleCountRef = useRef<number | null>(null);
  const lastSampleIncreaseAtRef = useRef<number | null>(null);
  const [displayFps, setDisplayFps] = useState<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 350);
    return () => window.clearInterval(id);
  }, []);

  const newestSampleAtMs = useMemo(() => maxSensorSampleAtMs(lastAtByHint, nowMs), [lastAtByHint, nowMs]);
  const pipelineAgeMs =
    newestSampleAtMs != null ? Math.max(0, nowMs - newestSampleAtMs) : null;
  const fpsIdleMs =
    lastSampleIncreaseAtRef.current != null
      ? nowMs - lastSampleIncreaseAtRef.current
      : null;

  const visible = isTelemetryDecodePipelineActive(
    { connected, transportState, serialBridgeStatus },
    handshakeState,
  );
  const linkStatusTransportReady = isBs2UartFirmwareLink() ? visible : transportReady;

  useEffect(() => {
    if (!isAggregateFpsChip || !visible) {
      prevSampleCountRef.current = null;
      lastSampleIncreaseAtRef.current = null;
      setDisplayFps(null);
      return;
    }
    const prev = prevSampleCountRef.current;
    if (prev != null && sampleCount > prev) {
      lastSampleIncreaseAtRef.current = Date.now();
    }
    prevSampleCountRef.current = sampleCount;
  }, [isAggregateFpsChip, sampleCount, visible]);

  useEffect(() => {
    if (!isAggregateFpsChip || !visible) {
      return;
    }
    if (sampleCount === 0) {
      fpsTickRef.current = { sampleCount: 0, atMs: Date.now() };
      setDisplayFps(null);
      return;
    }
    const { fps, nextTick } = computeRollingFpsFromSampleCount({
      sampleCount,
      nowMs,
      prevTick: fpsTickRef.current,
    });
    if (fps != null) {
      setDisplayFps(fps);
      fpsTickRef.current = nextTick;
    }
  }, [isAggregateFpsChip, nowMs, sampleCount, visible]);

  const worstSampleAgeMs = useMemo(
    () => computeWorstSampleAgeMs(lastAtByHint, nowMs, bySourceId),
    [bySourceId, lastAtByHint, nowMs],
  );

  const stickyWorstDisplay = useMemo(() => {
    const resolved = resolveStickyWorstSensorDisplay({
      pin: stickyWorstPinRef.current,
      lastAtByHint,
      nowMs,
      bySourceId,
    });
    stickyWorstPinRef.current = resolved?.pin ?? null;
    return resolved?.display ?? null;
  }, [bySourceId, lastAtByHint, nowMs]);

  const freshnessTier = useMemo(
    () => computeWorstFreshnessTier(lastAtByHint, nowMs, bySourceId),
    [bySourceId, lastAtByHint, nowMs],
  );

  const hasEnabledFreshnessSignal = useMemo(() => {
    for (const hint of SENSOR_RX_HINTS) {
      const sid = HINT_TO_SOURCE_ID[hint];
      const row = bySourceId[sid];
      if (!isSensorRowEnabled(row)) {
        continue;
      }
      if (typeof lastAtByHint[hint] === "number") {
        return true;
      }
    }
    return false;
  }, [bySourceId, lastAtByHint]);

  const sensorDiagnosticsRows = useMemo(
    () =>
      buildSensorDiagnosticsRows({
        transportReady,
        handshakeState,
        lastAtByHint,
        nowMs,
        bySourceId,
        simulatorMode,
      }),
    [transportReady, handshakeState, lastAtByHint, nowMs, bySourceId, simulatorMode],
  );

  const perSensorDecodeRowModels = useMemo(
    () =>
      buildPerSensorDecodeRowModels({
        decodePipelineActive: visible,
        linkStatusTransportReady,
        handshakeState,
        lastAtByHint,
        lastDeltaMsByHint,
        nowMs,
        bySourceId,
        simulatorMode,
      }),
    [
      visible,
      linkStatusTransportReady,
      handshakeState,
      lastAtByHint,
      lastDeltaMsByHint,
      nowMs,
      bySourceId,
      simulatorMode,
    ],
  );

  const aggregateFpsSlowButLive =
    isAggregateFpsChip &&
    visible &&
    sampleCount > 0 &&
    (pipelineAgeMs == null || pipelineAgeMs < 3000) &&
    displayFps != null &&
    displayFps < 1;

  const toneClass = isAggregateFpsChip
    ? !visible || sampleCount <= 0
      ? "text-zinc-500"
      : pipelineAgeMs != null && pipelineAgeMs >= 3000
        ? "text-rose-400"
        : displayFps != null && displayFps >= 4
          ? "text-emerald-400"
          : displayFps != null && displayFps >= 1
            ? "text-emerald-300/90"
            : aggregateFpsSlowButLive
              ? "text-emerald-300/90"
              : fpsIdleMs != null && fpsIdleMs > 5000
                ? "text-rose-400"
                : "text-zinc-500"
    : !visible
      ? "text-zinc-500"
      : !hasEnabledFreshnessSignal
        ? "text-zinc-500"
        : freshnessTier === 0
          ? "text-emerald-400"
          : freshnessTier === 1
            ? "text-amber-400"
            : "text-rose-400";
  const borderClass = isAggregateFpsChip
    ? !visible || sampleCount <= 0
      ? "border-zinc-600/50 bg-white/4"
      : pipelineAgeMs != null && pipelineAgeMs >= 3000
        ? "border-rose-500/40 bg-rose-500/10"
        : displayFps != null && displayFps >= 4
          ? "border-emerald-500/35 bg-emerald-500/10"
          : displayFps != null && (displayFps >= 1 || aggregateFpsSlowButLive)
            ? "border-emerald-500/35 bg-emerald-500/10"
            : fpsIdleMs != null && fpsIdleMs > 5000
              ? "border-rose-500/40 bg-rose-500/10"
              : "border-zinc-600/50 bg-white/4"
    : !visible
      ? "border-zinc-600/50 bg-white/4"
      : !hasEnabledFreshnessSignal
        ? "border-zinc-600/50 bg-white/4"
        : freshnessTier === 0
          ? "border-emerald-500/35 bg-emerald-500/10"
          : freshnessTier === 1
            ? "border-amber-500/35 bg-amber-500/10"
            : "border-rose-500/40 bg-rose-500/10";

  const label = isAggregateFpsChip
    ? !visible
      ? "RX —"
      : sampleCount <= 0
        ? "RX —"
        : displayFps != null
          ? formatAggregateDecodeFps(displayFps)
          : "… fps"
    : !visible
      ? "RX —"
      : !hasEnabledFreshnessSignal
        ? sampleCount > 0
          ? "RX …"
          : "RX —"
        : stickyWorstDisplay != null
          ? formatSensorDecodeChipLabel(stickyWorstDisplay.hint, stickyWorstDisplay.ageMs)
          : "RX —";

  const cardValueLabel =
    !visible
      ? handshakeState === "running"
        ? "Handshake…"
        : handshakeState === "failed"
          ? "Handshake failed"
          : telemetryLinkStatusLabel({
              transportReady: linkStatusTransportReady,
              handshakeState,
              simulatorMode,
            }) ?? "Link down"
      : label;

  const decodeAgeLabel =
    stickyWorstDisplay != null
      ? formatSensorDecodeChipLabel(stickyWorstDisplay.hint, stickyWorstDisplay.ageMs)
      : worstSampleAgeMs != null
        ? formatWallClockAgeAgo(worstSampleAgeMs)
        : null;
  const sensorRowValueLabel =
    (variant === "panel" || variant === "cardRow") && decodeAgeLabel != null
      ? decodeAgeLabel
      : cardValueLabel;

  const perHintLines = SENSOR_RX_HINTS.map((hint) => {
    const sid = HINT_TO_SOURCE_ID[hint];
    const row = bySourceId[sid];
    if (!isSensorRowEnabled(row)) {
      return `${hint}: — (disabled)`;
    }
    const t = lastAtByHint[hint];
    if (typeof t !== "number") {
      return `${hint}: —`;
    }
    const a = Math.max(0, nowMs - t);
    const i = clampSamplingIntervalMs(row?.samplingIntervalMs);
    const tier = tierForSensorAge(a, row?.samplingIntervalMs);
    const tierLabel = tier === 0 ? "ok" : tier === 1 ? "warn" : "stale";
    return `${hint}: ${formatWallClockAgeAgo(a)} · ≤${2 * i}ms fresh · ${tierLabel}`;
  }).join("\n");

  const triggerAriaLabel = useMemo(() => {
    if (!visible) {
      return isAggregateFpsChip
        ? simulatorMode
          ? "Sensor decode rate: hidden until Connect (simulator) and handshake pass."
          : "Sensor decode rate: hidden until serial is open and handshake passes."
        : simulatorMode
          ? "Sensor decode freshness: hidden until Connect (simulator) and handshake pass."
          : "Sensor decode freshness: hidden until serial is open and handshake passes.";
    }
    if (isAggregateFpsChip) {
      if (sampleCount <= 0) {
        return "Sensor decode rate: waiting for first decoded frame; see tooltip";
      }
      const fpsText = displayFps != null ? formatAggregateDecodeFps(displayFps) : "estimating";
      return `Sensor decode rate: ${fpsText} across all sensor types (${sampleCount.toLocaleString()} lifetime frames). See tooltip.`;
    }
    if (!hasEnabledFreshnessSignal) {
      return sampleCount > 0
        ? "Sensor decode freshness: no enabled sensor with a recent timestamp; see tooltip"
        : "Sensor decode freshness: waiting for first decoded sensor sample; see tooltip";
    }
    const age = worstSampleAgeMs ?? 0;
    const pinned = stickyWorstDisplay?.hint ?? "sensor";
    return `Sensor decode freshness: slowest enabled sensor (${pinned}) last decode ${formatWallClockAgeAgo(age)} (${label}). Color uses worst age across all enabled sensors (emerald ≤2× interval, amber ≤4×). See tooltip.`;
  }, [
    displayFps,
    hasEnabledFreshnessSignal,
    isAggregateFpsChip,
    label,
    sampleCount,
    stickyWorstDisplay?.hint,
    visible,
    worstSampleAgeMs,
    simulatorMode,
  ]);

  const tooltip = isAggregateFpsChip ? (
    <div className="min-w-0 max-w-[280px] whitespace-pre-line text-left">
      <div className="font-semibold text-zinc-100">Sensor decode rate</div>
      <div className="text-zinc-300">
        Rolling average frames per second for <span className="font-semibold text-zinc-200">all</span> decoded sensor
        samples in this webview (every source type combined).
      </div>
      <div className="mt-1 font-mono text-[11px] text-zinc-300">
        Current: {displayFps != null ? formatAggregateDecodeFps(displayFps) : "estimating…"}
        {"\n"}
        Lifetime frames: {sampleCount.toLocaleString()}
      </div>
      <div className="mt-1 text-zinc-400">
        Last frame (any sensor):{" "}
        {newestSampleAtMs != null ? formatTime(newestSampleAtMs) : "none yet"}
        {pipelineAgeMs != null ? ` · ${formatWallClockAgeAgo(pipelineAgeMs)}` : null}
      </div>
      <div className="mt-2 text-zinc-500">
        Rate is derived from the global decode counter, not per-sensor spacing. Per-sensor freshness remains in
        Telemetry link diagnostics.
      </div>
      {onReconnectTelemetry != null && pipelineAgeMs != null && pipelineAgeMs >= 3000 ? (
        <div className="mt-2 text-amber-200/90">
          Click the chip to <span className="font-semibold">reconnect telemetry</span> (reset HostSession). Auto-recover
          should also run when enabled in Telemetry settings.
        </div>
      ) : null}
    </div>
  ) : (
    <div className="min-w-0 max-w-[280px] whitespace-pre-line text-left">
      <div className="font-semibold text-zinc-100">Sensor samples (this UI)</div>
      <div className="text-zinc-300">
        Chip: time since <span className="font-semibold text-zinc-200">last decode</span> for the slowest enabled
        sensor (wall clock, not inter-arrival gap). The value climbs until that sensor publishes, then may switch to
        another sensor.
      </div>
      <div className="mt-1 text-zinc-300">
        Newest decoded frame (any sensor):{" "}
        {newestSampleAtMs != null ? formatTime(newestSampleAtMs) : "none yet"}
      </div>
      <div className="text-zinc-400">Lifetime sample events: {sampleCount.toLocaleString()}</div>
      <div className="mt-1 text-zinc-400">Per sensor (wall clock age, own interval thresholds):</div>
      <div className="font-mono text-[11px] text-zinc-400">{perHintLines}</div>
      <div className="mt-2 text-zinc-500">
        The chip reflects the <span className="font-semibold text-zinc-400">worst</span> wall age among{" "}
        <span className="font-semibold text-zinc-400">enabled</span> sensors. Each row is compared to its verified{" "}
        <span className="font-mono">samplingIntervalMs</span>: emerald if age ≤ 2×, amber if ≤ 4×, rose beyond. Disabled
        sensors are excluded from the chip aggregate.
      </div>
      {onReconnectTelemetry != null && worstSampleAgeMs != null && worstSampleAgeMs >= 3000 ? (
        <div className="mt-2 text-amber-200/90">
          Click the chip to <span className="font-semibold">reconnect telemetry</span> (reset HostSession). Auto-recover
          should also run when enabled in Telemetry settings.
        </div>
      ) : null}
    </div>
  );

  const staleReconnectEnabled =
    visible &&
    onReconnectTelemetry != null &&
    (isAggregateFpsChip
      ? pipelineAgeMs != null && pipelineAgeMs >= 3000
      : worstSampleAgeMs != null && worstSampleAgeMs >= 3000);

  if (variant === "chip" && !visible && !isToolbarFpsSlot) {
    return null;
  }

  const sensorDecodeRow = (
    <div
      role={variant === "panel" ? "region" : "button"}
      tabIndex={variant === "panel" ? -1 : 0}
      aria-label={
        variant === "panel"
          ? undefined
          : visible
            ? triggerAriaLabel
            : "Sensor decode: serial is open but the Bitstream handshake is not passed yet."
      }
      className={twMerge(
        "flex w-full min-w-0 items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-left outline-none transition-colors",
        variant === "panel"
          ? "cursor-default"
          : "cursor-default focus-visible:ring-1 focus-visible:ring-amber-300/60",
        borderClass,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Radio size={16} aria-hidden className={`shrink-0 ${toneClass}`} />
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Sensor decode</div>
          <div className="truncate text-[10px] text-zinc-500">bitstreamLive · worst enabled age</div>
        </div>
      </div>
      <div
        className={twMerge(
          "shrink-0 text-xs text-zinc-100",
          variant === "panel"
            ? "inline-block min-w-30 text-end"
            : "",
          toneClass,
        )}
      >
        {sensorRowValueLabel}
      </div>
    </div>
  );

  const sensorDecodePanelSessionSummaryContent = (
    <>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Session summary</div>
      <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-[11px]">
        <span className="text-zinc-500">Newest decoded frame</span>
        <span className="min-w-30 text-end text-zinc-200 normal-nums">
          {newestSampleAtMs != null ? formatTime(newestSampleAtMs) : "—"}
        </span>
        <span className="text-zinc-500">Lifetime sample events</span>
        <span className="min-w-30 text-end text-zinc-200 normal-nums">
          {sampleCount.toLocaleString()}
        </span>
      </div>
    </>
  );

  const sensorDecodePanelDetails = (
    <div className="min-w-0 space-y-2 border-t border-zinc-800/70 bg-zinc-950/35 px-2 py-2">
      {sensorDecodePanelSessionSummaryContent}
      <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Per sensor</div>
      <TRNDataGrid
        columns={SENSOR_DECODE_DIAGNOSTICS_GRID_COLUMNS}
        rows={sensorDiagnosticsRows}
        getRowId={(r) => r.id}
        stickyHeader={false}
        className="border-zinc-700/60 text-[11px]"
      />
      <TRNHintText tone="muted" className="mb-0 text-[10px] leading-snug">
        Header chip shows the worst wall age among enabled sensors. Each row uses verified samplingIntervalMs: Good ≤
        2×, Marginal ≤ 4×, Stale beyond. Disabled sensors are excluded from the chip aggregate.
      </TRNHintText>
    </div>
  );

  const sensorDecodePerSensorRows = (
    <div className="space-y-1 p-1">
      {perSensorDecodeRowModels.map((row) => (
        <div
          key={row.hint}
          role="region"
          tabIndex={-1}
          aria-label={
            row.deltaLabel != null && row.ageLabel != null
              ? `Sensor decode ${row.title}: frame gap ${row.deltaLabel.trim()}, last decode ${row.ageLabel}`
              : `Sensor decode ${row.title}: ${row.valueLabel}`
          }
          className={twMerge(
            "flex w-full min-w-0 items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-left outline-none transition-colors cursor-default",
            row.borderClass,
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Radio size={16} aria-hidden className={`shrink-0 ${row.toneClass}`} />
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                Sensor decode · {row.title}
              </div>
              <div className="truncate text-[10px] text-zinc-500">{row.subtitle}</div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5 text-end">
            {row.deltaLabel != null && row.ageLabel != null ? (
              <>
                <span
                  className={twMerge(
                    "text-[10px] leading-none text-zinc-300",
                    row.toneClass,
                  )}
                  title="Device tMs gap between last two EVT_SENSOR frames"
                >
                  {row.deltaLabel.trim()}
                </span>
                <span
                  className={twMerge("text-xs leading-none text-zinc-100", row.toneClass)}
                  title="Wall-clock age since last decode in this webview"
                >
                  {row.ageLabel}
                </span>
              </>
            ) : (
              <span className={twMerge("text-xs text-zinc-100", row.toneClass)}>{row.valueLabel}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  if (variant === "panel") {
    const cardsBody =
      panelSensorRows === "perSensor" ? (
        sensorDecodePerSensorRows
      ) : (
        <>
          {sensorDecodeRow}
          {sensorDecodePanelDetails}
        </>
      );
    if (panelEmbed) {
      return cardsBody;
    }
    return (
      <div className="overflow-hidden rounded-lg border border-zinc-700/60 bg-zinc-950/50 ring-1 ring-black/15">
        {cardsBody}
      </div>
    );
  }

  if (variant === "cardRow") {
    return (
      <TRNTooltip
        placement="bottom-start"
        openDelayMs={450}
        disableHoverFx
        triggerClassName={twMerge("!p-0 block w-full")}
        triggerAriaLabel={
          visible
            ? triggerAriaLabel
            : "Sensor decode: serial is open but the Bitstream handshake is not passed yet."
        }
        content={tooltip}
        trigger={sensorDecodeRow}
      />
    );
  }

  const chipFrameClass = isToolbarFpsSlot
    ? BITSTREAM_SHELL_TOOLBAR_DECODE_FPS_CHIP_CLASS
    : BITSTREAM_SHELL_STATUS_CHIP_FRAME_CLASS;
  const chipTextClass = isToolbarFpsSlot
    ? BITSTREAM_SHELL_TOOLBAR_TELEMETRY_CHIP_TEXT_CLASS
    : "min-w-0 truncate";
  const chipSurfaceClass = `${chipFrameClass} ${BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS} ${borderClass} text-zinc-200/95`;

  const chipTrigger = staleReconnectEnabled ? (
    <button
      type="button"
      className={`${chipSurfaceClass} cursor-pointer transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-300/60`}
      aria-label={`${triggerAriaLabel} Click to reconnect telemetry.`}
      onClick={(e) => {
        e.stopPropagation();
        onReconnectTelemetry?.();
      }}
    >
      <Radio size={12} aria-hidden="true" className={`${BITSTREAM_SHELL_STATUS_CHIP_ICON_CLASS} ${toneClass}`} />
      <span className={`${chipTextClass} ${toneClass}`}>{label}</span>
    </button>
  ) : (
    <span className={`${chipSurfaceClass} select-none`}>
      <Radio size={12} aria-hidden="true" className={`${BITSTREAM_SHELL_STATUS_CHIP_ICON_CLASS} ${toneClass}`} />
      <span className={`${chipTextClass} ${toneClass}`}>{label}</span>
    </span>
  );

  return (
    <TRNTooltip
      placement="bottom-end"
      openDelayMs={650}
      disableHoverFx
      triggerWrapper="span"
      triggerClassName={isToolbarFpsSlot ? "!p-0 shrink-0" : "!p-0 max-w-full"}
      triggerAriaLabel={staleReconnectEnabled ? undefined : triggerAriaLabel}
      content={tooltip}
      trigger={chipTrigger}
    />
  );
}
