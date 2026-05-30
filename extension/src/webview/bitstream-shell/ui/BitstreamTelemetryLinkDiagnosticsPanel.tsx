import { Antenna, AlertTriangle, Cpu, RefreshCw, Unplug } from "lucide-react";
import { useMemo } from "react";
import {
  TRNButton,
  TRNDataGrid,
  TRNHintText,
  TRNInteractiveCard,
  type TRNDataGridColumn,
} from "../../ui/TRN";
import { useTelemetrySessionWedgeBanner } from "../../bitstream-app/components/telemetry/useTelemetrySessionWedgeBanner.js";
import { useBitstreamConfigStore } from "../../bitstream-app/state/bitstreamConfig.store.js";
import { useBitstreamConnectionStore } from "../../bitstream-app/state/bitstreamConnection.store.js";
import { useBitstreamLiveStore } from "../../bitstream-app/state/bitstreamLive.store.js";
import {
  BitstreamSensorSampleRxBadge,
  formatThroughputBps,
} from "./BitstreamTelemetryRxBadges";
import { HostSerialRxDiagnosticsCard } from "../../bitstream-app/components/diagnostics/HostSerialRxDiagnosticsCard";

type TransportMetricRow = { id: string; metric: string; value: string };

const TRANSPORT_COLUMNS: TRNDataGridColumn<TransportMetricRow>[] = [
  {
    id: "metric",
    label: "Metric",
    width: 172,
    sortable: false,
    align: "start",
    getValue: (r) => r.metric,
  },
  {
    id: "value",
    label: "Value",
    width: 204,
    sortable: false,
    align: "end",
    getValue: (r) => r.value,
    cell: (r) => (
      <span className="inline-block min-w-32 normal-nums">{r.value}</span>
    ),
  },
];

type DecodeChannelRow = { id: string; channelHex: string; channelDec: string; frames: string };

const DECODE_CHANNEL_COLUMNS: TRNDataGridColumn<DecodeChannelRow>[] = [
  {
    id: "hex",
    label: "Channel",
    width: 100,
    sortable: false,
    align: "start",
    getValue: (r) => r.channelHex,
  },
  {
    id: "dec",
    label: "Dec",
    width: 72,
    sortable: false,
    align: "end",
    getValue: (r) => r.channelDec,
    cell: (r) => (
      <span className="inline-block min-w-12 normal-nums">{r.channelDec}</span>
    ),
  },
  {
    id: "frames",
    label: "Frames",
    width: 120,
    sortable: false,
    align: "end",
    getValue: (r) => r.frames,
    cell: (r) => (
      <span className="inline-block min-w-22 normal-nums">{r.frames}</span>
    ),
  },
];

/**
 * Body of the floating **Telemetry diagnostics** window: transport snapshot, decode health,
 * host RX, and optional interpretive notes (same metrics as before, clearer hierarchy).
 */
export function BitstreamTelemetryLinkDiagnosticsPanel(props: {
  onReconnectTelemetry: () => void;
})
{
  const { onReconnectTelemetry } = props;
  const showWedgeBanner = useTelemetrySessionWedgeBanner();
  const serialPath = useBitstreamConfigStore((s) => s.serialPath);
  const serialOpen = useBitstreamConnectionStore((s) => s.serialBridgeStatus?.isOpen === true);
  const connecting = useBitstreamConnectionStore((s) => s.connecting);
  const transportState = useBitstreamConnectionStore((s) => s.transportState);
  const busyAction = useBitstreamConnectionStore((s) => s.busyAction);
  const wire = useBitstreamConnectionStore((s) => s.serialRxWireStats);
  const sensorDecodeRejects = useBitstreamLiveStore((s) => s.sensorChannelDecodeRejectCount);
  const autoRecoverOn = useBitstreamConfigStore((s) => s.autoRecoverStaleSensorDecodeEnabled);
  const staleMultiplier = useBitstreamConfigStore((s) => s.sensorDecodeStaleIntervalMultiplier);
  const wedgeLogOn = useBitstreamConfigStore((s) => s.telemetryWedgeDiagnosticLogEnabled);
  const decodeDebugOn = useBitstreamConfigStore((s) => s.telemetryDecodeDebugEnabled);
  const framesByChannel = useBitstreamLiveStore((s) => s.telemetryDebugInboundFramesByChannel);
  const lastTransportReason = useBitstreamLiveStore(
    (s) => s.telemetryDebugLastTransportDisconnectReason,
  );
  const bs2EvtSensorRxCount = useBitstreamLiveStore((s) => s.bs2EvtSensorRxCount);
  const bs2EvtSensorLastRxAtMs = useBitstreamLiveStore((s) => s.bs2EvtSensorLastRxAtMs);
  const uiFlushCount = useBitstreamLiveStore((s) => s.uiFlushCount);
  const uiFlushLastAtMs = useBitstreamLiveStore((s) => s.uiFlushLastAtMs);

  const reconnectBusy = busyAction === "Reconnect telemetry";
  const reconnectDisabled =
    !serialPath.trim() ||
    connecting ||
    transportState === "connecting" ||
    transportState === "reconnecting" ||
    reconnectBusy;

  const transportRows = useMemo((): TransportMetricRow[] => {
    if (wire == null) {
      return [];
    }
    return [
      { id: "qos", metric: "Bulk binary QoS", value: String(wire.bulkDataBinaryQos) },
      { id: "mainc", metric: "Main chunks/s", value: String(wire.chunksMainPerSec) },
      { id: "mainb", metric: "Main throughput", value: formatThroughputBps(wire.bytesMainPerSec) },
      { id: "pri", metric: "Priority chunks/s", value: String(wire.chunksPriorityPerSec) },
    ];
  }, [wire]);

  const decodeChannelRows = useMemo((): DecodeChannelRow[] => {
    if (framesByChannel == null) {
      return [];
    }
    return Object.keys(framesByChannel)
      .map((k) => Number(k))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b)
      .map((ch) => ({
        id: String(ch),
        channelHex: `0x${ch.toString(16).padStart(2, "0")}`,
        channelDec: String(ch),
        frames: (framesByChannel[ch] ?? 0).toLocaleString(),
      }));
  }, [framesByChannel]);

  if (!serialOpen) {
    return (
      <div className="flex flex-col gap-3 px-3 py-4">
        <TRNInteractiveCard
          collapsible={false}
          title="Serial not open"
          titleLeadingSlot={<Unplug className="size-4 text-zinc-500" aria-hidden />}
          contentClassName="space-y-2 pt-0"
        >
          <TRNHintText tone="muted" className="mb-0">
            Connect the bridge and open a COM port to see transport snapshot, host BRx, sensor decode freshness, and
            the sensor-channel decode reject counter.
          </TRNHintText>
        </TRNInteractiveCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      {showWedgeBanner ? (
        <div
          className="flex items-start gap-2.5 rounded-md border border-amber-500/45 bg-amber-950/50 px-3 py-2.5"
          role="status"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" strokeWidth={2.25} aria-hidden />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-semibold text-amber-100">Sensor decode stale</p>
            <TRNHintText tone="warn" className="mb-0 text-[11px] leading-snug">
              At least one enabled sensor has not decoded within{" "}
              <span className="font-mono text-amber-50/95">{staleMultiplier}×</span> its configured sampling interval.
              Try <span className="font-medium text-amber-50">Reconnect telemetry</span> below to reset HostSession
              (no full page reload).
              {autoRecoverOn ? " Auto-recover is on and should run shortly if the gap persists." : null}
            </TRNHintText>
          </div>
        </div>
      ) : null}

      <div
        className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-800/80 bg-zinc-950/30 px-3 py-2"
        aria-label="Telemetry automation settings status"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-[10px] text-zinc-400">
          <span className="font-semibold uppercase tracking-widest text-zinc-500">Automation</span>
          <span
            className={[
              "inline-flex min-w-34 justify-center rounded border px-2 py-0.5 text-center normal-nums",
              autoRecoverOn ? "border-cyan-700/45 text-cyan-200/90" : "border-zinc-700/60 text-zinc-500",
            ].join(" ")}
          >
            Auto-recover {autoRecoverOn ? "on" : "off"} ({staleMultiplier}×)
          </span>
          <span
            className={[
              "inline-flex min-w-34 justify-center rounded border px-2 py-0.5 text-center normal-nums",
              wedgeLogOn ? "border-amber-700/45 text-amber-100/90" : "border-zinc-700/60 text-zinc-500",
            ].join(" ")}
          >
            Wedge log {wedgeLogOn ? "on" : "off"}
          </span>
          <span
            className={[
              "inline-flex min-w-34 justify-center rounded border px-2 py-0.5 text-center normal-nums",
              decodeDebugOn ? "border-violet-700/45 text-violet-100/90" : "border-zinc-700/60 text-zinc-500",
            ].join(" ")}
          >
            Decode debug {decodeDebugOn ? "on" : "off"}
          </span>
          <span className="text-zinc-600">Telemetry performance</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-800/80 bg-zinc-950/20 px-3 py-2">
        <TRNHintText tone="muted" className="mb-0 min-w-0 max-w-[min(100%,22rem)] flex-1">
          Stale decode with BRx still moving? Reset the webview session (same COM) without reloading the page.
        </TRNHintText>
        <TRNButton
          size="compact"
          className="shrink-0 gap-1"
          disabled={reconnectDisabled}
          aria-busy={reconnectBusy}
          title={
            !serialPath.trim()
              ? "Select a serial port first"
              : "Close HostSession and connect again on the current port"
          }
          type="button"
          onClick={onReconnectTelemetry}
        >
          <RefreshCw
            className={["size-3.5 shrink-0", reconnectBusy ? "animate-spin" : ""].join(" ")}
            aria-hidden
          />
          Reconnect telemetry
        </TRNButton>
      </div>

      <TRNInteractiveCard
        collapsible={false}
        title="Transport snapshot"
        contentClassName="space-y-2 pt-0"
      >
        <div className="rounded border border-zinc-800/70 bg-zinc-950/20 px-2 py-1">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-400">
            <span className="font-semibold uppercase tracking-widest text-zinc-500">Flow meters</span>
            <span className="inline-flex items-center gap-2 normal-nums">
              <span className="text-zinc-500">EVT_SENSOR</span>
              <span className="text-zinc-200/90">{bs2EvtSensorRxCount.toLocaleString()}</span>
              <span className="text-zinc-600">last</span>
              <span className="text-zinc-200/90">{bs2EvtSensorLastRxAtMs ?? "—"}</span>
            </span>
            <span className="inline-flex items-center gap-2 normal-nums">
              <span className="text-zinc-500">UI flush</span>
              <span className="text-zinc-200/90">{uiFlushCount.toLocaleString()}</span>
              <span className="text-zinc-600">last</span>
              <span className="text-zinc-200/90">{uiFlushLastAtMs ?? "—"}</span>
            </span>
          </div>
        </div>
        {wire != null && transportRows.length > 0 ? (
          <TRNDataGrid
            columns={TRANSPORT_COLUMNS}
            rows={transportRows}
            getRowId={(r) => r.id}
            stickyHeader={false}
            className="border-zinc-700/60"
          />
        ) : (
          <TRNHintText tone="info" className="mb-0">
            Wire window stats are not available yet (waiting for the next broker snapshot).
          </TRNHintText>
        )}
        <TRNHintText tone="muted" className="mb-0 text-[10px]">
          Broker publishes a ~1s window: main vs priority chunk rates and main-lane throughput.
        </TRNHintText>
      </TRNInteractiveCard>

      <TRNInteractiveCard
        collapsible={false}
        title="Sensor decode"
        titleLeadingSlot={<Cpu className="size-3.5 text-zinc-500" aria-hidden />}
        contentClassName="space-y-2 pt-0"
      >
        <BitstreamSensorSampleRxBadge variant="panel" panelEmbed />
      </TRNInteractiveCard>

      {decodeDebugOn ? (
        <TRNInteractiveCard
          collapsible={false}
          title="Inbound frames by channel (debug)"
          contentClassName="space-y-2 pt-0"
        >
          {lastTransportReason != null && lastTransportReason.length > 0 ? (
            <TRNHintText tone="warn" className="mb-0 text-[10px] leading-snug">
              Last transport disconnect:{" "}
              <span className="wrap-break-word text-amber-50">{lastTransportReason}</span>
            </TRNHintText>
          ) : (
            <TRNHintText tone="muted" className="mb-0 text-[10px] leading-snug">
              Last transport disconnect: <span className="text-zinc-300">—</span> (shown after the bridge closes the
              transport)
            </TRNHintText>
          )}
          {decodeChannelRows.length > 0 ? (
            <div className="max-h-44 min-h-0 overflow-y-auto rounded-md">
              <TRNDataGrid
                columns={DECODE_CHANNEL_COLUMNS}
                rows={decodeChannelRows}
                getRowId={(r) => r.id}
                stickyHeader
                className="border-zinc-700/60"
              />
            </div>
          ) : (
            <TRNHintText tone="info" className="mb-0">
              No frames counted yet for this session, or counts were reset after disconnect. Open Telemetry performance
              → enable Telemetry decode debug before connecting.
            </TRNHintText>
          )}
          <TRNHintText tone="muted" className="mb-0 text-[10px]">
            Counters reset when serial telemetry resets or on reconnect. Channel is the Bitstream wire channel byte.
          </TRNHintText>
        </TRNInteractiveCard>
      ) : null}

      <TRNInteractiveCard
        collapsible={false}
        title="Sensor ch. 0x01 · decode rejects"
        contentClassName="space-y-2 pt-0"
      >
        <div
          className={[
            "flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-[11px]",
            sensorDecodeRejects > 0
              ? "border-amber-500/40 bg-amber-500/[0.07] text-amber-50/95"
              : "border-zinc-700/55 bg-zinc-950/40 text-zinc-300",
          ].join(" ")}
        >
          <TRNHintText
            tone={sensorDecodeRejects > 0 ? "warn" : "muted"}
            className="mb-0 min-w-0 max-w-[min(100%,18rem)] flex-1 text-[11px]"
          >
            Lifetime count of 0x01 frames that did not decode to a sensor sample.
          </TRNHintText>
          <span className="inline-block min-w-26 shrink-0 text-end text-base font-semibold leading-none normal-nums">
            {sensorDecodeRejects.toLocaleString()}
          </span>
        </div>
      </TRNInteractiveCard>

      <HostSerialRxDiagnosticsCard />

      <TRNInteractiveCard
        collapsible
        defaultCollapsed
        title="Interpreting this panel"
        contentClassName="space-y-2 pt-0"
      >
        <TRNHintText tone="muted" className="mb-0">
          Decode freshness uses each sensor&apos;s verified samplingIntervalMs: Good if age ≤ 2×, Marginal if ≤ 4×,
          Stale beyond. A large age is expected when samples stop — it is not fixed by shortening the firmware interval
          alone.
        </TRNHintText>
        <TRNHintText tone="muted" className="mb-0">
          If BRx stays non-zero while decode goes stale, bytes reach this PC but bitstreamLive timestamps are not
          advancing (session, parser, or non-sensor UART traffic).
        </TRNHintText>
        <TRNHintText tone="muted" className="mb-0">
          If decode rejects climb with BRx, sensor-channel frames are present but the host decoder rejected the payload
          (version / layout mismatch or corruption).
        </TRNHintText>
        <TRNHintText tone="muted" className="mb-0">
          If several browsers or tabs go stale at the same time, the bridge is fanning one UART stream to every
          subscriber — look for a shared cause (MCU publish pause, non-sensor bytes, firmware policy), not a single-tab
          UI bug alone.
        </TRNHintText>
        <TRNHintText tone="muted" className="mb-0">
          Use Reconnect telemetry above to tear down and reopen the webview HostSession on the current port (no full
          page reload).
        </TRNHintText>
      </TRNInteractiveCard>
    </div>
  );
}

