import { Cable, Loader2, Radio, ShieldCheck, Usb, Wifi } from "lucide-react";
import type { ReactNode } from "react";
import { TRNTooltip } from "../../ui/TRN/TRNTooltip.js";
import { ConnectionSetupButton } from "./ConnectionSetupButton";
import { useLinkHandshakeSatisfied } from "../../bitstream-app/hooks/useLinkHandshakeSatisfied.js";
import { useBitstreamWifiStore } from "../../bitstream-app/state/bitstreamWifi.store";
import { useBitstreamTelemetrySourceStore } from "../../bitstream-app/state/bitstreamTelemetrySource.store";
import type { BitstreamBootLifecycleBarProps } from "./BitstreamBootLifecycleBar.js";
import {
  brokerTone,
  computeLinkLifecycleHeaderStatus,
  handshakeTone,
  sensorCfgTone,
  transportTone,
  wifiSyncTone,
} from "./link-lifecycle-model.js";

export type LinkLifecycleStripProps = BitstreamBootLifecycleBarProps & {
  /** Show the prose status line after pills (default true). */
  showStatusText?: boolean;
  /** Show the Connection… button on the right (default true). */
  showConnectionButton?: boolean;
  /** When false, keep pills on one line (workspace chrome header). */
  wrapPills?: boolean;
  className?: string;
};

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

function StepPill(props: {
  icon: ReactNode;
  label: string;
  tone: "muted" | "active" | "ok" | "warn";
  onClick?: () => void;
}) {
  const { icon, label, tone, onClick } = props;
  const ring =
    tone === "ok"
      ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-100/95"
      : tone === "active"
        ? "border-sky-400/40 bg-sky-500/15 text-sky-100/95"
        : tone === "warn"
          ? "border-amber-400/35 bg-amber-500/12 text-amber-100/90"
          : "border-white/12 bg-white/[0.06] text-white/55";
  const className = `flex min-w-0 items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] leading-none ${ring}`;
  if (onClick == null) {
    return (
      <span className={className}>
        <span className="shrink-0 opacity-90">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${className} cursor-pointer hover:brightness-110`}
    >
      <span className="shrink-0 opacity-90">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

/** Boot / link lifecycle pills + status (shared by shell bar and Sensor Studio chrome). */
export function LinkLifecycleStrip(props: LinkLifecycleStripProps) {
  const {
    connected,
    connecting,
    transportState,
    runtimeSyncState,
    handshakeState,
    firmwareSensorTruthReady,
    trailingSlot,
    onOpenConnection,
    showStatusText = true,
    showConnectionButton = true,
    wrapPills = true,
    className,
  } = props;

  const wifiSync = useBitstreamWifiStore((s) => s.wifiSync);
  const telemetryBackend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const handshakeOk = useLinkHandshakeSatisfied();

  const t = transportTone(connected, connecting, transportState);
  const b = brokerTone(runtimeSyncState);
  const h = handshakeTone(handshakeOk ? "passed" : handshakeState);
  const w = wifiSyncTone(wifiSync.state);
  const sensor = sensorCfgTone(handshakeOk, firmwareSensorTruthReady);

  const headerStatus = computeLinkLifecycleHeaderStatus({
    connected,
    connecting,
    transportState,
    runtimeSyncState,
    handshakeState,
    handshakeOk,
    firmwareSensorTruthReady,
    telemetryBackend,
  });

  return (
    <div
      className={
        className ??
        "flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1"
      }
    >
      <div
        className={
          wrapPills
            ? "flex min-w-0 flex-1 flex-wrap items-center gap-1.5 overflow-x-auto scrollbar-hide"
            : "flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto scrollbar-hide"
        }
      >
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
          label={sensor.label}
          tone={sensor.tone}
        />
        <TRNTooltip
          placement="bottom-start"
          openDelayMs={650}
          disableHoverFx
          triggerWrapper="span"
          triggerAriaLabel="Wi‑Fi sync status. Show details."
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
          }
        />
        {showStatusText ? (
          <span className="ml-1 min-w-0 truncate text-[10px] text-white/50">{headerStatus}</span>
        ) : null}
      </div>
      <div className="ml-auto flex shrink-0 flex-nowrap items-center justify-end gap-1.5">
        {showConnectionButton && onOpenConnection != null ? (
          <ConnectionSetupButton onClick={() => onOpenConnection()} />
        ) : null}
        {trailingSlot != null ? (
          <div className="flex shrink-0 items-center justify-end">{trailingSlot}</div>
        ) : null}
      </div>
    </div>
  );
}

export function useLinkLifecycleHeaderStatus(
  props: BitstreamBootLifecycleBarProps,
): string {
  const telemetryBackend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const handshakeOk = useLinkHandshakeSatisfied();
  return computeLinkLifecycleHeaderStatus({
    connected: props.connected,
    connecting: props.connecting,
    transportState: props.transportState,
    runtimeSyncState: props.runtimeSyncState,
    handshakeState: props.handshakeState,
    handshakeOk,
    firmwareSensorTruthReady: props.firmwareSensorTruthReady,
    telemetryBackend,
  });
}
