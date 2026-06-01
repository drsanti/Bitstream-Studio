import { Cpu, Server, Usb, Wifi, WifiOff } from "lucide-react";
import { useMemo } from "react";
import { TRNTooltip } from "../../ui/TRN/TRNTooltip.js";
import { useBitstreamConnectionStore } from "../../bitstream-app/state/bitstreamConnection.store";
import { useBitstreamLiveStore } from "../../bitstream-app/state/bitstreamLive.store";
import { useBitstreamConfigStore } from "../../bitstream-app/state/bitstreamConfig.store.js";
import { useBitstreamWifiStore } from "../../bitstream-app/state/bitstreamWifi.store";
import { formatWifiLinkState, formatWifiRssi, rssiToneClass } from "../../bitstream-app/components/wifi/wifi-panel-utils";

type BackendStatus = "connected" | "connecting" | "disconnected" | "error";

function getStatusColorClass(status: BackendStatus): string
{
  if (status === "connected")
  {
    return "text-emerald-400";
  }
  if (status === "connecting")
  {
    return "text-amber-400";
  }
  return "text-slate-400";
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

export function BitstreamSystemStatusIndicators(props: {
  onOpenFirmwareLogLevel?: () => void;
  onOpenWifiPanel?: () => void;
  onOpenSystemDiagnostics?: () => void;
})
{
  const { onOpenFirmwareLogLevel, onOpenWifiPanel, onOpenSystemDiagnostics } = props;
  const backendWsState = useBitstreamConnectionStore((s) => s.backendWsState);
  const busyAction = useBitstreamConnectionStore((s) => s.busyAction);
  const detectingPorts = useBitstreamConnectionStore((s) => s.detectingPorts);
  const serialBridgeStatus = useBitstreamConnectionStore((s) => s.serialBridgeStatus);
  const runtimeSyncState = useBitstreamConnectionStore((s) => s.runtimeSyncState);
  const leaseOwner = useBitstreamConnectionStore((s) => s.leaseOwner);
  const handshake = useBitstreamLiveStore((s) => s.handshake);
  const handshakeState = useBitstreamLiveStore((s) => s.handshakeState);
  const handshakeAttempts = useBitstreamLiveStore((s) => s.handshakeAttempts);
  const handshakeLastError = useBitstreamLiveStore((s) => s.handshakeLastError);
  const firmwareLiveness = useBitstreamLiveStore((s) => s.firmwareLiveness);
  const firmwareLastRxAtMs = useBitstreamLiveStore((s) => s.firmwareLastRxAtMs);
  const wifiStatus = useBitstreamWifiStore((s) => s.lastStatus);
  const wifiUpdatedAt = useBitstreamWifiStore((s) => s.lastUpdatedAt);
  const firmwareLogLevelUi = useBitstreamConfigStore((s) => s.firmwareLogLevelUi);
  const firmwareLogLevelUserLocked = useBitstreamConfigStore((s) => s.firmwareLogLevelUserLocked);
  const firmwareLogLevelAutoEnabled = useBitstreamConfigStore((s) => s.firmwareLogLevelAutoEnabled);

  const wifiState = wifiStatus?.state ?? 0;
  const wifiRssi = wifiStatus?.rssi ?? -127;
  const wifiSsid = wifiStatus?.ssid ?? "";
  const wifiRssiText = wifiStatus ? formatWifiRssi(wifiRssi) : "—";

  const logLabel = useMemo(() => {
    switch (firmwareLogLevelUi) {
      case 0:
        return "OFF";
      case 1:
        return "ERROR";
      case 2:
        return "WARN";
      case 3:
        return "INFO";
      case 4:
        return "DEBUG";
      case 5:
      default:
        return "VERBOSE";
    }
  }, [firmwareLogLevelUi]);

  const websocketStatus = useMemo<BackendStatus>(() => {
    if (backendWsState === "connecting" || backendWsState === "reconnecting") {
      return "connecting";
    }
    if (backendWsState === "error") {
      return "error";
    }
    if (backendWsState === "connected") {
      return "connected";
    }
    return "disconnected";
  }, [backendWsState]);

  const serialStatus = useMemo<BackendStatus>(() => {
    const serialBusy =
      busyAction != null && /connect|uart|handshake|serial/i.test(busyAction);
    if (detectingPorts || serialBusy) {
      return "connecting";
    }
    if (serialBridgeStatus?.isOpen === true) {
      return "connected";
    }
    if (typeof serialBridgeStatus?.error === "string" && serialBridgeStatus.error.length > 0) {
      return "error";
    }
    return "disconnected";
  }, [busyAction, detectingPorts, serialBridgeStatus]);

  const serviceStatus = useMemo<BackendStatus>(() => {
    if (firmwareLiveness === "dead") {
      return "error";
    }
    if (firmwareLiveness === "stale") {
      return "connecting";
    }
    const sessionBusy =
      busyAction != null && /connect|uart|handshake/i.test(busyAction);
    if (
      runtimeSyncState === "syncing_snapshot" ||
      handshakeState === "running" ||
      handshakeState === "unknown" ||
      busyAction === "Handshake" ||
      sessionBusy
    ) {
      return "connecting";
    }
    if (handshakeState === "passed" || handshake) {
      return "connected";
    }
    if (handshakeState === "failed") {
      return "error";
    }
    return "disconnected";
  }, [busyAction, firmwareLiveness, handshake, handshakeState, runtimeSyncState]);

  return (
    <div
      className="inline-flex shrink-0 items-center gap-2"
      role="group"
      aria-label="System status"
    >
        <TRNTooltip
          placement="bottom-end"
          openDelayMs={650}
          disableHoverFx
          content={
            <div className="min-w-0 whitespace-pre-line text-left">
              <div className="font-semibold text-zinc-100">Bridge connection</div>
              <div className="text-zinc-300">
                Status:{" "}
                {websocketStatus === "connected"
                  ? "connected"
                  : websocketStatus === "connecting"
                    ? "connecting"
                    : websocketStatus === "error"
                      ? "error"
                      : "disconnected"}
              </div>
              <div className="mt-1 text-zinc-400">
                This is the link to the Serial Port Bridge (WebSocket).
              </div>
            </div>
          }
          trigger={
            <span className="inline-flex items-center gap-1">
              <Server
                size={14}
                aria-hidden="true"
                className={getStatusColorClass(websocketStatus)}
              />
            </span>
          }
        />
        <TRNTooltip
          placement="bottom-end"
          openDelayMs={650}
          disableHoverFx
          content={
            <div className="min-w-0 whitespace-pre-line text-left">
              <div className="font-semibold text-zinc-100">Serial port</div>
              <div className="text-zinc-300">
                Status:{" "}
                {serialStatus === "connected"
                  ? "open"
                  : serialStatus === "connecting"
                    ? "connecting"
                    : serialStatus === "error"
                      ? "error"
                      : "closed"}
              </div>
              <div className="mt-1 text-zinc-400">
                If this is closed, the firmware cannot receive settings updates.
              </div>
            </div>
          }
          trigger={
            <span className="inline-flex items-center gap-1">
              <Usb
                size={14}
                aria-hidden="true"
                className={getStatusColorClass(serialStatus)}
              />
            </span>
          }
        />
        <TRNTooltip
          placement="bottom-end"
          openDelayMs={650}
          disableHoverFx
          content={
            <div className="min-w-0 whitespace-pre-line text-left">
              <div className="font-semibold text-zinc-100">Firmware service</div>
              <div className="text-zinc-300">
                Handshake:{" "}
                {handshakeState === "passed"
                  ? "passed"
                  : handshakeState === "running"
                    ? "running"
                    : handshakeState === "failed"
                      ? "failed"
                      : "waiting"}
              </div>
              {leaseOwner ? (
                <div className="text-zinc-400">Control lease: {leaseOwner}</div>
              ) : (
                <div className="text-zinc-400">Control lease: available</div>
              )}
              {handshakeState === "running" || handshakeState === "failed" ? (
                <div className="text-zinc-400">Attempts: {handshakeAttempts}</div>
              ) : null}
              {handshakeLastError ? (
                <div className="mt-1 text-zinc-300">Last error: {handshakeLastError}</div>
              ) : null}
              <div className="text-zinc-300">
                Device activity:{" "}
                {firmwareLiveness === "alive"
                  ? "OK"
                  : firmwareLiveness === "stale"
                    ? "No data recently"
                    : firmwareLiveness === "dead"
                      ? "No data"
                      : "Not seen yet"}
              </div>
              <div className="text-zinc-400">
                Last RX: {formatTime(firmwareLastRxAtMs)}
              </div>
              {handshakeState !== "passed" ? (
                <div className="mt-1 text-zinc-400">
                  Settings are locked until handshake passes.
                </div>
              ) : null}
              {firmwareLiveness === "dead" ? (
                <div className="mt-1 text-zinc-400">
                  Tip: firmware may have been reset. Reconnect the serial session or re-run handshake.
                </div>
              ) : null}
            </div>
          }
          trigger={
            <span
              role="button"
              tabIndex={0}
              aria-label="Open system diagnostics"
              className="inline-flex cursor-pointer items-center gap-1 rounded-sm p-0.5 focus-visible:ring-1 focus-visible:ring-amber-400/40"
              onClick={() => onOpenSystemDiagnostics?.()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenSystemDiagnostics?.();
                }
              }}
            >
              <Cpu
                size={14}
                aria-hidden="true"
                className={getStatusColorClass(serviceStatus)}
              />
            </span>
          }
        />
        <TRNTooltip
          placement="bottom-end"
          openDelayMs={650}
          disableHoverFx
          content={
            <div className="min-w-0 whitespace-pre-line text-left">
              <div className="font-semibold text-zinc-100">Wi‑Fi</div>
              <div className="text-zinc-300">State: {formatWifiLinkState(wifiState)}</div>
              <div className="text-zinc-300">
                RSSI:{" "}
                <span className={rssiToneClass(wifiRssi)}>{wifiRssiText}</span>
              </div>
              <div className="text-zinc-300">SSID: {wifiSsid || "(empty)"}</div>
              <div className="text-zinc-400">Updated: {formatTime(wifiUpdatedAt)}</div>
              <div className="mt-1 text-zinc-400">Click to open Wi‑Fi panel.</div>
            </div>
          }
          trigger={
            <span
              role="button"
              tabIndex={0}
              aria-label="Open Wi‑Fi panel"
              className="inline-flex cursor-pointer select-none items-center gap-1 rounded-md p-0.5 focus-visible:ring-1 focus-visible:ring-amber-400/40"
              onClick={() => onOpenWifiPanel?.()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenWifiPanel?.();
                }
              }}
            >
              {wifiState === 2 ? (
                <Wifi size={16} aria-hidden="true" className="text-emerald-400" />
              ) : wifiState === 1 || wifiState === 3 ? (
                <Wifi size={16} aria-hidden="true" className="text-amber-400" />
              ) : (
                <WifiOff size={16} aria-hidden="true" className="text-slate-400" />
              )}
              <span
                className={`text-xs font-medium leading-none tracking-normal normal-case ${rssiToneClass(wifiRssi)}`}
              >
                {wifiRssiText}
              </span>
            </span>
          }
        />
    </div>
  );
}

