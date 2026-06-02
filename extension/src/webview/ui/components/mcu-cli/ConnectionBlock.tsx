import { useEffect, useMemo } from "react";
import { Link2, List, Unlink2, Unplug, Usb } from "lucide-react";
import { twMerge } from "tailwind-merge";
import type {
  PortInfo,
  SerialPortStatusPayload,
} from "../../../../serialport-bridge/protocol";
import { useLocalNetworkIps } from "../../../useLocalNetworkIps";
import { TRNGlassButton } from "../../TRN/TRNGlassButton";
import { DropdownList, type DropdownListOption } from "../common/DropdownList";
import { InputText } from "../common/InputText";
import { CollapsibleCard } from "../CollapsibleCard";
import { PortStatusText } from "./PortStatusText";
import { WsStatusText } from "./WsStatusText";

const settingsPanelClass =
  "space-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]";

/** Align Connect/Disconnect widths so the row does not jump when toggling. */
const wsActionMinClass = "min-w-[7.25rem] justify-center gap-1.5";

/** Brighter glass primary (connect / open port). */
const glassPrimaryActionClass =
  "border-emerald-400/35 bg-emerald-500/[0.18] text-emerald-50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] hover:bg-emerald-500/[0.26] hover:border-emerald-300/45 active:bg-emerald-500/30";

/** Clear destructive tone without heavy maroon fill. */
const glassDangerActionClass =
  "border-rose-400/35 bg-rose-500/[0.14] text-rose-50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:bg-rose-500/[0.22] hover:border-rose-300/45 active:bg-rose-500/28";

const iconSm =
  "[&_svg]:!h-3.5 [&_svg]:!w-3.5 [&_svg]:shrink-0 [&_svg]:opacity-90";

const portActionsRowClass = "flex shrink-0 items-center gap-2";

const portActionBtnClass = "min-w-[4.75rem] justify-center";

/** Standard rates for the serial port manager baud dropdown (Bitstream default: 921600). */
export const SERIAL_BAUD_RATE_OPTIONS: readonly number[] = [
  9600, 14400, 19200, 28800, 38400, 57600, 115200, 128000, 230400, 256000,
  460800, 921600,
];

export interface ConnectionBlockProps {
  wsUrl: string;
  onWsUrlChange: (url: string) => void;
  connectionState: string;
  status: SerialPortStatusPayload | null;
  ports: PortInfo[];
  /** Used to show a card for a saved path that is not in the last list result. */
  selectedPath: string;
  baudRate: string;
  onBaudChange: (baud: string) => void;
  onListPorts: () => void;
  /** Open the given serial port using current baud / mode (parent sets selection + calls bridge). */
  onOpenPort: (path: string) => void;
  onClose: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnected: boolean;
  /** When true (default), WebSocket and Port cards start expanded. */
  cardsDefaultOpen?: boolean;
  /** WebSocket bytes received (for header RX display). */
  wsBytesReceived?: number;
  /** WebSocket bytes sent (for header TX display). */
  wsBytesSent?: number;
}

export function ConnectionBlock({
  wsUrl,
  onWsUrlChange,
  connectionState,
  status,
  ports,
  selectedPath,
  baudRate,
  onBaudChange,
  onListPorts,
  onOpenPort,
  onClose,
  onConnect,
  onDisconnect,
  isConnected,
  cardsDefaultOpen = true,
  wsBytesReceived = 0,
  wsBytesSent = 0,
}: ConnectionBlockProps) {
  const wsStatus: "success" | "error" | "neutral" =
    connectionState === "connected"
      ? "success"
      : connectionState === "error" || connectionState === "disconnected"
        ? "error"
        : "neutral";
  const { primaryIp, fetchIps, isAvailable } = useLocalNetworkIps();

  // Refetch local IPs when connected to localhost and we don't have one yet
  useEffect(() => {
    if (
      !isAvailable ||
      connectionState !== "connected" ||
      primaryIp != null ||
      !wsUrl
    )
      return;
    try {
      const u = new URL(wsUrl);
      if (u.hostname === "localhost") fetchIps();
    } catch {
      // ignore
    }
  }, [isAvailable, connectionState, primaryIp, wsUrl, fetchIps]);

  const wsTitleSupplement =
    connectionState === "connected" && wsUrl
      ? (() => {
          try {
            const u = new URL(wsUrl);
            const hostname =
              u.hostname === "localhost"
                ? (primaryIp ?? "127.0.0.1")
                : u.hostname;
            const port = u.port ? `:${u.port}` : "";
            const hostPort = hostname ? `${hostname}${port}` : "";
            if (!hostPort) return undefined;
            return (
              <WsStatusText
                hostPort={hostPort}
                bytesReceived={wsBytesReceived}
                bytesSent={wsBytesSent}
              />
            );
          } catch {
            return undefined;
          }
        })()
      : undefined;

  const baudDropdownOptions = useMemo((): DropdownListOption[] => {
    const base = SERIAL_BAUD_RATE_OPTIONS.map((rate) => ({
      value: String(rate),
      label: String(rate),
    }));
    const current = Number.parseInt(baudRate, 10);
    if (
      Number.isFinite(current) &&
      !SERIAL_BAUD_RATE_OPTIONS.includes(current)
    ) {
      return [{ value: String(current), label: String(current) }, ...base];
    }
    return base;
  }, [baudRate]);

  const portCards = useMemo((): PortInfo[] => {
    const byPath = new Set(ports.map((p) => p.path));
    const list = ports.slice();
    if (selectedPath !== "" && !byPath.has(selectedPath)) {
      list.push({ path: selectedPath });
    }
    return list;
  }, [ports, selectedPath]);

  const portCardStatus = (path: string): "success" | "error" | "neutral" => {
    if (status?.isOpen && status.path === path) return "success";
    if (status && !status.isOpen && status.path === path && status.error) {
      return "error";
    }
    return "neutral";
  };

  return (
    <div className="space-y-4">
      <CollapsibleCard
        title="WebSocket"
        titleSupplement={wsTitleSupplement}
        defaultOpen={cardsDefaultOpen}
        status={wsStatus}
        statusIconVariant="websocket"
      >
        <div className={settingsPanelClass}>
          <div className="flex flex-wrap items-center gap-2">
            <InputText
              id="serial-connection-ws-url"
              aria-label="WebSocket URL"
              placeholder="WebSocket URL"
              value={wsUrl}
              onChange={(e) => onWsUrlChange(e.target.value)}
              disabled={isConnected}
              className="min-w-48 flex-1"
            />
            {!isConnected ? (
              <TRNGlassButton
                tone="success"
                trnSize="control"
                onClick={onConnect}
                icon={<Link2 aria-hidden />}
                className={twMerge(wsActionMinClass, glassPrimaryActionClass, iconSm)}
              >
                Connect
              </TRNGlassButton>
            ) : (
              <TRNGlassButton
                tone="danger"
                trnSize="control"
                onClick={onDisconnect}
                icon={<Unlink2 aria-hidden />}
                className={twMerge(wsActionMinClass, glassDangerActionClass, iconSm)}
              >
                Disconnect
              </TRNGlassButton>
            )}
          </div>
        </div>
      </CollapsibleCard>

      <div className="flex flex-wrap items-center gap-2.5">
        <TRNGlassButton
          tone="neutral"
          trnSize="control"
          onClick={onListPorts}
          disabled={!isConnected}
          icon={<List aria-hidden />}
          className={twMerge(
            "shrink-0 border-white/14 bg-white/8 hover:bg-white/12",
            iconSm,
          )}
        >
          List ports
        </TRNGlassButton>
        {portCards.length > 0 ? (
          <span className="text-xs text-zinc-400/90">
            {portCards.length} port
            {portCards.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      {portCards.length === 0 ? (
        <p className="text-sm text-white/45 px-0.5">
          No ports in list. Connect the bridge and click List ports.
        </p>
      ) : (
        portCards.map((port) => {
          const path = port.path;
          const openForThis =
            status?.isOpen && status.path === path ? status : null;
          const headerStatus = portCardStatus(path);

          return (
            <CollapsibleCard
              key={path}
              title="Port"
              titleSupplement={
                openForThis ? (
                  <PortStatusText
                    path={openForThis.path}
                    baudRate={openForThis.baudRate}
                    bytesRead={openForThis.bytesRead}
                    bytesWritten={openForThis.bytesWritten}
                  />
                ) : (
                  <span className="text-xs font-normal text-gray-400 truncate">
                    {path}
                  </span>
                )
              }
              defaultOpen={cardsDefaultOpen}
              status={headerStatus}
              statusIconVariant="serial"
            >
              <div className={settingsPanelClass}>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <DropdownList
                    id={`serial-connection-baud-${path.replace(/[^\w-]/g, "_")}`}
                    ariaLabel={`Baud rate for ${path}`}
                    placeholder="Baud"
                    value={baudRate}
                    options={baudDropdownOptions}
                    onChange={onBaudChange}
                    disabled={!isConnected}
                    className="w-24 shrink-0 sm:w-28"
                  />
                  <div className={portActionsRowClass}>
                    <TRNGlassButton
                      tone="success"
                      trnSize="control"
                      onClick={() => onOpenPort(path)}
                      disabled={!isConnected || !!openForThis}
                      icon={<Usb aria-hidden />}
                      className={twMerge(
                        portActionBtnClass,
                        glassPrimaryActionClass,
                        iconSm,
                      )}
                    >
                      Open
                    </TRNGlassButton>
                    <TRNGlassButton
                      tone="danger"
                      trnSize="control"
                      onClick={onClose}
                      disabled={!isConnected || !openForThis}
                      icon={<Unplug aria-hidden />}
                      className={twMerge(
                        portActionBtnClass,
                        glassDangerActionClass,
                        iconSm,
                      )}
                    >
                      Close
                    </TRNGlassButton>
                  </div>
                </div>
              </div>
            </CollapsibleCard>
          );
        })
      )}
    </div>
  );
}
