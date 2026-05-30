import { Activity, Copy } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getDefaultAiBridgeWsUrl } from "../../../ai-bridge/ai-bridge-webview-config";
import { postAiBridgeGetStatusFromExtension } from "../../../ai-bridge/ai-bridge-extension-messages";
import { useAiBridgeExtensionHostStatus } from "../../../ai-bridge/useAiBridgeExtensionHostStatus";
import { isVsCodeExtensionWebview } from "../../../isVsCodeExtensionWebview";
import { getModelLoaderWsClientUrl } from "../../../runtimeWsUrls";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";
import { useBitstreamConnectionStore } from "../../state/bitstreamConnection.store.js";
import { useBitstreamLiveStore } from "../../state/bitstreamLive.store.js";
import type { SerialRxWireWindowStats } from "../../../../serialport-bridge/protocol";

type HealthTier = "ok" | "warn" | "bad" | "neutral";

type WsProbeState = "idle" | "checking" | "up" | "down";

function useOneShotWsReachability(wsUrl: string, active: boolean): WsProbeState {
  const [state, setState] = useState<WsProbeState>("idle");

  useEffect(() => {
    if (!active || !wsUrl.startsWith("ws")) {
      setState("idle");
      return;
    }

    let cancelled = false;
    setState("checking");
    const ws = new WebSocket(wsUrl);
    const timer = window.setTimeout(() => {
      if (cancelled) {
        return;
      }
      if (ws.readyState !== WebSocket.OPEN) {
        try {
          ws.close();
        } catch {
          /* ignore */
        }
        setState("down");
      }
    }, 2200);

    ws.onopen = () => {
      if (cancelled) {
        return;
      }
      window.clearTimeout(timer);
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      setState("up");
    };

    ws.onerror = () => {
      if (cancelled) {
        return;
      }
      window.clearTimeout(timer);
      setState("down");
    };

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    };
  }, [active, wsUrl]);

  return state;
}

function tierClasses(tier: HealthTier): string {
  switch (tier) {
    case "ok":
      return "border-emerald-500/35 bg-emerald-950/25 text-emerald-200";
    case "warn":
      return "border-amber-500/35 bg-amber-950/20 text-amber-100";
    case "bad":
      return "border-rose-500/35 bg-rose-950/25 text-rose-100";
    default:
      return "border-zinc-600/60 bg-zinc-900/40 text-zinc-400";
  }
}

function backendWsTier(
  state: string,
): { tier: HealthTier; label: string } {
  if (state === "connected") {
    return { tier: "ok", label: "Connected" };
  }
  if (state === "connecting" || state === "reconnecting") {
    return { tier: "warn", label: state === "connecting" ? "Connecting" : "Reconnecting" };
  }
  if (state === "error") {
    return { tier: "bad", label: "Error" };
  }
  return { tier: "neutral", label: "Disconnected" };
}

function transportTier(
  transportState: string,
  sessionAttached: boolean,
): { tier: HealthTier; label: string } {
  if (transportState === "connected" && sessionAttached) {
    return { tier: "ok", label: "Session ready" };
  }
  if (transportState === "connected") {
    return { tier: "warn", label: "Transport up (session pending)" };
  }
  if (transportState === "connecting" || transportState === "reconnecting") {
    return { tier: "warn", label: "Connecting" };
  }
  if (transportState === "error") {
    return { tier: "bad", label: "Transport error" };
  }
  return { tier: "neutral", label: "Disconnected" };
}

function serialTier(
  detecting: boolean,
  connecting: boolean,
  serial: { isOpen?: boolean; error?: string } | null,
): { tier: HealthTier; label: string; detail?: string } {
  if (detecting || connecting) {
    return { tier: "warn", label: detecting ? "Detecting ports" : "Opening…" };
  }
  if (serial?.isOpen === true) {
    return { tier: "ok", label: "Serial open" };
  }
  const err = typeof serial?.error === "string" ? serial.error.trim() : "";
  if (err.length > 0) {
    return { tier: "bad", label: "Serial error", detail: err };
  }
  return { tier: "neutral", label: "Serial closed" };
}

function firmwareTier(
  handshakeState: string,
  firmwareLiveness: string,
  handshakeLastError: string | null,
): { tier: HealthTier; label: string; detail?: string } {
  const err = handshakeLastError?.trim() ?? "";
  if (handshakeState === "failed" || firmwareLiveness === "dead") {
    return {
      tier: "bad",
      label: handshakeState === "failed" ? "Handshake failed" : "No firmware data",
      detail: err.length > 0 ? err : undefined,
    };
  }
  if (handshakeState === "running" || firmwareLiveness === "stale") {
    return {
      tier: "warn",
      label: handshakeState === "running" ? "Handshake running" : "Data stale",
      detail: err.length > 0 ? err : undefined,
    };
  }
  if (handshakeState === "passed") {
    return { tier: "ok", label: "Handshake OK", detail: err.length > 0 ? err : undefined };
  }
  return { tier: "neutral", label: "Handshake idle", detail: err.length > 0 ? err : undefined };
}

function modelProbeTier(probe: WsProbeState): { tier: HealthTier; label: string } {
  if (probe === "checking" || probe === "idle") {
    return { tier: "warn", label: probe === "checking" ? "Checking…" : "—" };
  }
  if (probe === "up") {
    return { tier: "ok", label: "Reachable" };
  }
  if (probe === "down") {
    return { tier: "bad", label: "Unreachable" };
  }
  return { tier: "neutral", label: "—" };
}

function formatKiBPerSec(bytesPerSec: number): string {
  if (!Number.isFinite(bytesPerSec) || bytesPerSec < 0) {
    return "—";
  }
  const kib = bytesPerSec / 1024;
  if (kib >= 1000) {
    return `${(kib / 1024).toFixed(2)} MiB/s`;
  }
  if (kib >= 100) {
    return `${kib.toFixed(0)} KiB/s`;
  }
  if (kib >= 10) {
    return `${kib.toFixed(1)} KiB/s`;
  }
  return `${kib.toFixed(2)} KiB/s`;
}

function wireRxTier(
  transportState: string,
  sessionAttached: boolean,
  wire: SerialRxWireWindowStats | null,
): { tier: HealthTier; label: string; subtitle?: string } {
  if (transportState !== "connected" || !sessionAttached) {
    return { tier: "neutral", label: "Idle", subtitle: "Open a Bitstream session to sample broker RX." };
  }
  if (wire == null) {
    return { tier: "warn", label: "Warming up", subtitle: "First 1s window after connect…" };
  }
  const subtitle = `Bulk QoS ${wire.bulkDataBinaryQos} · main ${wire.chunksMainPerSec} pkt/s, ${formatKiBPerSec(
    wire.bytesMainPerSec,
  )} · priority ${wire.chunksPriorityPerSec} pkt/s, ${formatKiBPerSec(wire.bytesPriorityPerSec)}`;
  if (wire.chunksMainPerSec === 0 && wire.bytesMainPerSec === 0 && wire.chunksPriorityPerSec === 0) {
    return { tier: "warn", label: "No chunks", subtitle: `${subtitle} (UART may be idle or data path blocked.)` };
  }
  return { tier: "ok", label: "Receiving", subtitle };
}

function aiHostTier(
  ext: boolean,
  host: { running: boolean; port: number | null; managedByExtension: boolean } | null,
): { tier: HealthTier; label: string; detail?: string } {
  if (!ext) {
    return { tier: "neutral", label: "N/A (browser)", detail: "Host-managed bridge status is VS Code only." };
  }
  if (host == null) {
    return { tier: "warn", label: "Unknown", detail: "No status message yet." };
  }
  if (host.running) {
    return {
      tier: "ok",
      label: "Running",
      detail: `Port ${host.port ?? "—"}${host.managedByExtension ? " · extension" : ""}`,
    };
  }
  return { tier: "bad", label: "Stopped", detail: `Last port ${host.port ?? "—"}` };
}

export type RuntimeServicesHealthPanelProps = {
  /** When false, WebSocket probes pause and extension status refresh is skipped. */
  active: boolean;
};

function HealthRow(props: {
  title: string;
  subtitle?: string;
  tier: HealthTier;
  badge: string;
  url?: string;
}) {
  const { title, subtitle, tier, badge, url } = props;
  return (
    <div className={`flex min-w-0 flex-col gap-0.5 rounded-md border px-2 py-1.5 ${tierClasses(tier)}`}>
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold text-zinc-100">{title}</div>
          {subtitle != null && subtitle.length > 0 ? (
            <div className="mt-0.5 line-clamp-3 text-[9px] leading-snug text-zinc-400">{subtitle}</div>
          ) : null}
          {url != null && url.length > 0 ? (
            <div className="mt-0.5 truncate font-mono text-[8px] text-zinc-500" title={url}>
              {url}
            </div>
          ) : null}
        </div>
        <span className="shrink-0 rounded border border-white/10 bg-black/25 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-zinc-200">
          {badge}
        </span>
      </div>
    </div>
  );
}

/**
 * Read-only summary of Bitstream transport, firmware handshake, AI bridge host, and optional broker reachability.
 * Uses existing Zustand slices and extension `ai-bridge-status` — does not open a duplicate AI assistant WebSocket.
 */
export function RuntimeServicesHealthPanel(props: RuntimeServicesHealthPanelProps) {
  const { active } = props;
  const ext = isVsCodeExtensionWebview();
  const bitstreamWsUrl = useBitstreamConfigStore((s) => s.wsUrl);
  const serialPath = useBitstreamConfigStore((s) => s.serialPath);
  const backendWsState = useBitstreamConnectionStore((s) => s.backendWsState);
  const transportState = useBitstreamConnectionStore((s) => s.transportState);
  const sessionAttached = useBitstreamConnectionStore((s) => s.sessionAttached);
  const connecting = useBitstreamConnectionStore((s) => s.connecting);
  const detectingPorts = useBitstreamConnectionStore((s) => s.detectingPorts);
  const serialBridgeStatus = useBitstreamConnectionStore((s) => s.serialBridgeStatus);
  const serialRxWireStats = useBitstreamConnectionStore((s) => s.serialRxWireStats);
  const handshakeState = useBitstreamLiveStore((s) => s.handshakeState);
  const handshakeLastError = useBitstreamLiveStore((s) => s.handshakeLastError);
  const firmwareLiveness = useBitstreamLiveStore((s) => s.firmwareLiveness);

  const aiBridgeWsUrl = useMemo(() => getDefaultAiBridgeWsUrl(), []);
  const modelBrokerUrl = useMemo(() => getModelLoaderWsClientUrl(), []);
  const modelProbe = useOneShotWsReachability(modelBrokerUrl, active);

  const extensionHostStatus = useAiBridgeExtensionHostStatus(ext && active);

  useEffect(() => {
    if (active && ext) {
      postAiBridgeGetStatusFromExtension();
    }
  }, [active, ext]);

  const broker = useMemo(() => backendWsTier(backendWsState), [backendWsState]);
  const transport = useMemo(
    () => transportTier(transportState, sessionAttached),
    [transportState, sessionAttached],
  );
  const serial = useMemo(
    () => serialTier(detectingPorts, connecting, serialBridgeStatus),
    [detectingPorts, connecting, serialBridgeStatus],
  );
  const wireRx = useMemo(
    () => wireRxTier(transportState, sessionAttached, serialRxWireStats),
    [serialRxWireStats, sessionAttached, transportState],
  );
  const firmware = useMemo(
    () => firmwareTier(handshakeState, firmwareLiveness, handshakeLastError),
    [firmwareLiveness, handshakeLastError, handshakeState],
  );
  const model = useMemo(() => modelProbeTier(modelProbe), [modelProbe]);
  const aiHost = useMemo(() => aiHostTier(ext, extensionHostStatus), [ext, extensionHostStatus]);

  const [copyHint, setCopyHint] = useState<"idle" | "ok" | "err">("idle");

  const buildDiagnosticsDoc = useCallback(() => {
    return JSON.stringify(
      {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        bitstream: {
          wsUrl: bitstreamWsUrl,
          backendWsState,
          transportState,
          sessionAttached,
          serialPath,
          serialBridgeStatus,
          serialRxWireStats,
          connecting,
          detectingPorts,
        },
        firmware: {
          handshakeState,
          handshakeLastError,
          firmwareLiveness,
        },
        aiBridge: {
          clientWsUrl: aiBridgeWsUrl,
          extensionHost: ext ? extensionHostStatus : null,
        },
        modelBroker: {
          wsUrl: modelBrokerUrl,
          reachabilityProbe: modelProbe,
        },
      },
      null,
      2,
    );
  }, [
    aiBridgeWsUrl,
    backendWsState,
    bitstreamWsUrl,
    connecting,
    detectingPorts,
    ext,
    extensionHostStatus,
    firmwareLiveness,
    handshakeLastError,
    handshakeState,
    modelBrokerUrl,
    modelProbe,
    serialBridgeStatus,
    serialPath,
    serialRxWireStats,
    sessionAttached,
    transportState,
  ]);

  const copyDiagnostics = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildDiagnosticsDoc());
      setCopyHint("ok");
      window.setTimeout(() => setCopyHint("idle"), 1600);
    } catch {
      setCopyHint("err");
      window.setTimeout(() => setCopyHint("idle"), 2200);
    }
  }, [buildDiagnosticsDoc]);

  return (
    <div className="mb-3 space-y-2 rounded-lg border border-zinc-700/70 bg-black/25 p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Activity className="size-3.5 shrink-0 text-cyan-400/90" aria-hidden />
          <h3 className="truncate text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Runtime services
          </h3>
        </div>
        <button
          type="button"
          onClick={() => void copyDiagnostics()}
          className="inline-flex shrink-0 items-center gap-1 rounded border border-zinc-600/80 bg-zinc-900/60 px-2 py-0.5 text-[10px] font-medium text-zinc-200 hover:bg-zinc-800/80"
        >
          <Copy className="size-3" aria-hidden />
          Copy diagnostics
        </button>
      </div>
      {copyHint === "ok" ? <div className="text-[10px] text-emerald-400">Copied JSON to clipboard.</div> : null}
      {copyHint === "err" ? <div className="text-[10px] text-amber-400">Clipboard blocked.</div> : null}

      <div className="space-y-1.5">
        <HealthRow title="Serial broker (Bitstream WS)" badge={broker.label} tier={broker.tier} url={bitstreamWsUrl} />
        <HealthRow title="Bitstream transport" badge={transport.label} tier={transport.tier} />
        <HealthRow
          title="Broker serial RX (1s window)"
          badge={wireRx.label}
          tier={wireRx.tier}
          subtitle={wireRx.subtitle}
        />
        <HealthRow
          title="Serial port"
          badge={serial.label}
          tier={serial.tier}
          subtitle={serial.detail}
          url={serialPath.length > 0 ? serialPath : undefined}
        />
        <HealthRow
          title="Firmware path"
          badge={firmware.label}
          tier={firmware.tier}
          subtitle={firmware.detail}
        />
        <HealthRow
          title="AI bridge (extension host)"
          badge={aiHost.label}
          tier={aiHost.tier}
          subtitle={aiHost.detail}
        />
        <HealthRow
          title="AI bridge (client URL)"
          badge="Config"
          tier="neutral"
          url={aiBridgeWsUrl}
          subtitle="WebSocket opens when Assistant or AI Dev Trace runs."
        />
        <HealthRow
          title="Model / catalog broker"
          badge={model.label}
          tier={model.tier}
          url={modelBrokerUrl}
          subtitle="One-shot reachability when this panel is open."
        />
      </div>
    </div>
  );
}
