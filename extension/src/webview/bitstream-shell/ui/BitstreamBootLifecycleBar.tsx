import { Cable, Loader2, Radio, ShieldCheck, Usb, Wifi } from "lucide-react";
import type { ReactNode } from "react";
import type { HandshakeLifecycleState } from "../../bitstream-app/state/bitstreamLive.store.js";
import type { TransportState } from "../../bitstream-app/state/bitstreamConnection.store.js";
import { TRNTooltip } from "../../ui/TRN/TRNTooltip.js";
import { useLinkHandshakeSatisfied } from "../../bitstream-app/hooks/useLinkHandshakeSatisfied.js";
import { useBitstreamWifiStore } from "../../bitstream-app/state/bitstreamWifi.store";
import {
  useBitstreamTelemetrySourceStore,
} from "../../bitstream-app/state/bitstreamTelemetrySource.store";

export interface BitstreamBootLifecycleBarProps {
  connected: boolean;
  connecting: boolean;
  transportState: TransportState;
  runtimeSyncState: "idle" | "syncing_snapshot" | "ready";
  handshakeState: HandshakeLifecycleState;
  firmwareSensorTruthReady: boolean;
  /** Opens the Connection step-by-step panel (optional step focus). */
  onOpenConnection?: (stepId?: string) => void;
  /** Optional trailing region (e.g. collaborator sync summary). */
  trailingSlot?: ReactNode;
}

type StepTone = "muted" | "active" | "ok" | "warn";

function StepPill(props: {
  icon: ReactNode;
  label: string;
  tone: StepTone;
  onClick?: () => void;
})
{
  const { icon, label, tone, onClick } = props;
  const ring =
    tone === "ok"
      ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-100/95"
      : tone === "active"
        ? "border-sky-400/40 bg-sky-500/15 text-sky-100/95"
        : tone === "warn"
          ? "border-amber-400/35 bg-amber-500/12 text-amber-100/90"
          : "border-white/12 bg-white/[0.06] text-white/55";
  return (
    <button
      type="button"
      disabled={onClick == null}
      onClick={onClick}
      className={`flex min-w-0 items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] leading-none ${ring} ${
        onClick != null ? "cursor-pointer hover:brightness-110" : "cursor-default"
      }`}
    >
      <span className="shrink-0 opacity-90">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function transportTone(
  connected: boolean,
  connecting: boolean,
  transportState: TransportState,
): { label: string; tone: StepTone }
{
  if (connecting || transportState === "connecting" || transportState === "reconnecting")
  {
    return { label: "UART connecting", tone: "active" };
  }
  if (transportState === "error")
  {
    return { label: "UART error", tone: "warn" };
  }
  if (connected && transportState === "connected")
  {
    return { label: "UART open", tone: "ok" };
  }
  return { label: "UART idle", tone: "muted" };
}

function brokerTone(
  runtimeSyncState: BitstreamBootLifecycleBarProps["runtimeSyncState"],
): { label: string; tone: StepTone }
{
  if (runtimeSyncState === "syncing_snapshot")
  {
    return { label: "Broker snapshot", tone: "active" };
  }
  if (runtimeSyncState === "ready")
  {
    return { label: "Broker snapshot", tone: "ok" };
  }
  return { label: "Broker snapshot", tone: "muted" };
}

function handshakeTone(
  handshakeState: HandshakeLifecycleState,
): { label: string; tone: StepTone }
{
  if (handshakeState === "running")
  {
    return { label: "Handshake", tone: "active" };
  }
  if (handshakeState === "passed")
  {
    return { label: "Handshake", tone: "ok" };
  }
  if (handshakeState === "failed")
  {
    return { label: "Handshake", tone: "warn" };
  }
  return { label: "Handshake", tone: "muted" };
}

function formatTime(ts: number | null): string
{
  if (ts == null)
  {
    return "—";
  }
  try
  {
    return new Date(ts).toLocaleTimeString();
  }
  catch
  {
    return String(ts);
  }
}

function wifiSyncTone(
  state: "idle" | "syncing" | "ok" | "error",
): { label: string; tone: StepTone }
{
  if (state === "syncing") return { label: "Wi‑Fi sync", tone: "active" };
  if (state === "ok") return { label: "Wi‑Fi sync", tone: "ok" };
  if (state === "error") return { label: "Wi‑Fi sync", tone: "warn" };
  return { label: "Wi‑Fi sync", tone: "muted" };
}

/**
 * Compact boot / lifecycle strip: transport, broker snapshot sync, firmware handshake, and
 * cold sensor-truth sync. Shown under the main toolbar for safe-operation awareness.
 */
export function BitstreamBootLifecycleBar(props: BitstreamBootLifecycleBarProps)
{
  const {
    connected,
    connecting,
    transportState,
    runtimeSyncState,
    handshakeState,
    firmwareSensorTruthReady,
    trailingSlot,
    onOpenConnection,
  } = props;

  const wifiSync = useBitstreamWifiStore((s) => s.wifiSync);
  const telemetryBackend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const telemetryEffective = telemetryBackend;
  const handshakeOk = useLinkHandshakeSatisfied();

  const t = transportTone(connected, connecting, transportState);
  const b = brokerTone(runtimeSyncState);
  const h = handshakeTone(handshakeOk ? "passed" : handshakeState);
  const w = wifiSyncTone(wifiSync.state);

  const headerStatus = (() => {
    if (!connected || transportState !== "connected") {
      if (telemetryEffective === "simulator") {
        return "Connect (simulator) to start — pick Source: Simulator above, then Connect. Settings are locked.";
      }
      return "Connect to start — pick Source: Bitstream, then Connect. Settings are locked.";
    }
    if (runtimeSyncState !== "ready") {
      return "Syncing broker snapshot… Settings are locked.";
    }
    if (!handshakeOk && handshakeState === "running") {
      return "Handshake running… Settings are locked.";
    }
    if (!handshakeOk) {
      return "Waiting for firmware handshake… Settings are locked.";
    }
    if (!firmwareSensorTruthReady) {
      return "Syncing sensor config… Settings are locked.";
    }
    return "Ready.";
  })();

  let sensorLabel = "Sensor cfg sync";
  let sensorTone: StepTone = "muted";
  if (handshakeOk) {
    if (firmwareSensorTruthReady) {
      sensorLabel = "Sensor cfg sync";
      sensorTone = "ok";
    } else {
      sensorLabel = "Sensor cfg sync";
      sensorTone = "active";
    }
  }

  return (
    <div className="z-20 flex min-h-8 shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-white/10 bg-black/70 px-2 py-1 backdrop-blur-md">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        <StepPill
          icon={<Usb className="h-3 w-3" aria-hidden />}
          label={t.label}
          tone={t.tone}
          onClick={onOpenConnection != null ? () => onOpenConnection("transport") : undefined}
        />
        <StepPill
          icon={<Cable className="h-3 w-3" aria-hidden />}
          label={b.label}
          tone={b.tone}
          onClick={onOpenConnection != null ? () => onOpenConnection("websocket") : undefined}
        />
        <StepPill
          icon={
            h.tone === "active" ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            ) : (
              <ShieldCheck className="h-3 w-3" aria-hidden />
            )
          }
          label={h.label}
          tone={h.tone}
          onClick={onOpenConnection != null ? () => onOpenConnection("handshake") : undefined}
        />
        <StepPill
          icon={<Radio className="h-3 w-3" aria-hidden />}
          label={sensorLabel}
          tone={sensorTone}
        />
        <TRNTooltip
          placement="bottom-start"
          openDelayMs={650}
          disableHoverFx
          content={
            <div className="min-w-0 whitespace-pre-line text-left">
              <div className="font-semibold text-zinc-100">Wi‑Fi sync</div>
              <div className="text-zinc-300">State: {wifiSync.state}</div>
              <div className="text-zinc-400">Last attempt: {formatTime(wifiSync.lastAttemptAtMs)}</div>
              <div className="text-zinc-400">Last ok: {formatTime(wifiSync.lastOkAtMs)}</div>
              {wifiSync.lastError ? (
                <div className="mt-1 text-zinc-300">Last error: {wifiSync.lastError}</div>
              ) : null}
              <div className="mt-1 text-zinc-400">
                This runs alongside runtime and sensor configuration synchronization.
              </div>
            </div>
          }
          trigger={
            <div>
              <StepPill
                icon={
                  w.tone === "active" ? (
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                  ) : (
                    <Wifi className="h-3 w-3" aria-hidden />
                  )
                }
                label={w.label}
                tone={w.tone}
              />
            </div>
          }
        />
        <span className="ml-1 min-w-0 truncate text-[10px] text-white/50">
          {headerStatus}
        </span>
      </div>
      <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
        {onOpenConnection != null ? (
          <button
            type="button"
            className="rounded border border-zinc-600/70 bg-zinc-900/60 px-2 py-0.5 text-[10px] font-medium text-zinc-200 hover:bg-zinc-800/80"
            onClick={() => onOpenConnection()}
          >
            Connection…
          </button>
        ) : null}
        {trailingSlot != null ? (
          <div className="flex shrink-0 items-center justify-end">{trailingSlot}</div>
        ) : null}
      </div>
    </div>
  );
}

