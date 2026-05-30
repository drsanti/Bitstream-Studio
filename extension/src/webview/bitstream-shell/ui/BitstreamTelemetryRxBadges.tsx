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

export type TelemetryRxBadgeVariant = "chip" | "cardRow" | "panel";

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
  let worst = 0;
  let any = false;
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
    any = true;
    worst = Math.max(worst, Math.max(0, nowMs - t));
  }
  return any ? worst : null;
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
    return `${Math.round(ageMs)}ms`;
  }
  if (ageMs < 60_000) {
    return `${(ageMs / 1000).toFixed(1)}s`;
  }
  return `${Math.floor(ageMs / 60_000)}m`;
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
            : "font-mono tabular-nums",
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
          className={`inline-flex min-w-0 max-w-full select-none items-center justify-end gap-1 truncate rounded-md border px-1.5 py-0.5 font-mono text-[10px] leading-none tabular-nums ${borderClass} text-zinc-200/95`}
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
  /** When decode Δ is stale (≥3s), click triggers reconnect (Sensor Studio toolbar). */
  onReconnectTelemetry?: () => void;
}) {
  const variant = props.variant ?? "chip";
  const panelEmbed = props.panelEmbed ?? false;
  const onReconnectTelemetry = props.onReconnectTelemetry;
  const handshakeState = useBitstreamLiveStore((s) => s.handshakeState);
  const lastAtByHint = useBitstreamLiveStore((s) => s.lastAtByHint);
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

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 350);
    return () => window.clearInterval(id);
  }, []);

  const newestSampleAtMs = useMemo(() => maxSensorSampleAtMs(lastAtByHint, nowMs), [lastAtByHint, nowMs]);

  const worstSampleAgeMs = useMemo(
    () => computeWorstSampleAgeMs(lastAtByHint, nowMs, bySourceId),
    [bySourceId, lastAtByHint, nowMs],
  );

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

  const visible = isTelemetryDecodePipelineActive(
    { connected, transportState, serialBridgeStatus },
    handshakeState,
  );

  const decodeAgeMs = worstSampleAgeMs;
  const toneClass = !visible
    ? "text-zinc-500"
    : !hasEnabledFreshnessSignal
      ? "text-zinc-500"
      : freshnessTier === 0
        ? "text-emerald-400"
        : freshnessTier === 1
          ? "text-amber-400"
          : "text-rose-400";
  const borderClass = !visible
    ? "border-zinc-600/50 bg-white/4"
    : !hasEnabledFreshnessSignal
      ? "border-zinc-600/50 bg-white/4"
      : freshnessTier === 0
        ? "border-emerald-500/35 bg-emerald-500/10"
        : freshnessTier === 1
          ? "border-amber-500/35 bg-amber-500/10"
          : "border-rose-500/40 bg-rose-500/10";

  const label = !visible
    ? "RX —"
    : !hasEnabledFreshnessSignal
      ? sampleCount > 0
        ? "RX …"
        : "RX —"
      : worstSampleAgeMs != null
        ? `Δ ${formatSampleAge(worstSampleAgeMs)}`
        : "RX —";

  const cardValueLabel =
    !transportReady || !visible
      ? handshakeState === "running"
        ? "Handshake…"
        : handshakeState === "failed"
          ? "Handshake failed"
          : "Await handshake"
      : label;

  const decodeDeltaLabel = decodeAgeMs != null ? `Δ ${formatSampleAge(decodeAgeMs)}` : null;
  const sensorRowValueLabel =
    (variant === "panel" || variant === "cardRow") && decodeDeltaLabel != null
      ? decodeDeltaLabel
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
    return `${hint}: ${formatSampleAge(a)} ago · ≤${2 * i}ms fresh · ${tierLabel}`;
  }).join("\n");

  const triggerAriaLabel = useMemo(() => {
    if (!visible) {
      return simulatorMode
        ? "Sensor decode freshness: hidden until Connect (simulator) and handshake pass."
        : "Sensor decode freshness: hidden until serial is open and handshake passes.";
    }
    if (!hasEnabledFreshnessSignal) {
      return sampleCount > 0
        ? "Sensor decode freshness: no enabled sensor with a recent timestamp; see tooltip"
        : "Sensor decode freshness: waiting for first decoded sensor sample; see tooltip";
    }
    const age = worstSampleAgeMs ?? 0;
    return `Sensor decode freshness: worst enabled-sensor wall age ${formatSampleAge(age)} (${label}). Each sensor uses its own sampling interval (emerald ≤2×, amber ≤4×). See tooltip.`;
  }, [hasEnabledFreshnessSignal, label, sampleCount, visible, worstSampleAgeMs]);

  const tooltip = (
    <div className="min-w-0 max-w-[280px] whitespace-pre-line text-left">
      <div className="font-semibold text-zinc-100">Sensor samples (this UI)</div>
      <div className="text-zinc-300">
        Newest decoded frame: {newestSampleAtMs != null ? formatTime(newestSampleAtMs) : "none yet"}
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
    worstSampleAgeMs != null &&
    worstSampleAgeMs >= 3000;

  if (variant === "chip" && !visible) {
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
            : "font-mono tabular-nums",
          toneClass,
        )}
      >
        {sensorRowValueLabel}
      </div>
    </div>
  );

  const sensorDecodePanelDetails = (
    <div className="min-w-0 space-y-2 border-t border-zinc-800/70 bg-zinc-950/35 px-2 py-2">
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

  if (variant === "panel") {
    const cardsBody = (
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

  const chipTrigger = staleReconnectEnabled ? (
    <button
      type="button"
      className={`inline-flex min-w-0 max-w-full cursor-pointer items-center justify-end gap-1 truncate rounded-md border px-1.5 py-0.5 font-mono text-[10px] leading-none tabular-nums transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-300/60 ${borderClass} text-zinc-200/95`}
      aria-label={`${triggerAriaLabel} Click to reconnect telemetry.`}
      onClick={(e) => {
        e.stopPropagation();
        onReconnectTelemetry?.();
      }}
    >
      <Radio size={12} aria-hidden="true" className={`shrink-0 ${toneClass}`} />
      <span className={`min-w-0 truncate ${toneClass}`}>{label}</span>
    </button>
  ) : (
    <span
      className={`inline-flex min-w-0 max-w-full select-none items-center justify-end gap-1 truncate rounded-md border px-1.5 py-0.5 font-mono text-[10px] leading-none tabular-nums ${borderClass} text-zinc-200/95`}
    >
      <Radio size={12} aria-hidden="true" className={`shrink-0 ${toneClass}`} />
      <span className={`min-w-0 truncate ${toneClass}`}>{label}</span>
    </span>
  );

  return (
    <TRNTooltip
      placement="bottom-end"
      openDelayMs={650}
      disableHoverFx
      triggerClassName="!p-0 max-w-full"
      triggerAriaLabel={staleReconnectEnabled ? undefined : triggerAriaLabel}
      content={tooltip}
      trigger={chipTrigger}
    />
  );
}
