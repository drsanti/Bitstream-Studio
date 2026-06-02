import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { openUartPortAndHandshake } from "../bitstream-app/bridge/openUartPortAndHandshake.js";
import { releaseOpenSerialPort } from "../bitstream-app/bridge/releaseOpenSerialPort.js";
import { pickPreferredSerialPortPath } from "../bitstream-app/utils/pickPreferredSerialPortPath.js";
import { useBitstreamConfigStore } from "../bitstream-app/state/bitstreamConfig.store.js";
import { useBitstreamConnectionStore } from "../bitstream-app/state/bitstreamConnection.store.js";
import { useSerialPortStore } from "../serialport/serial-port-store.js";
import { useWsClientStore } from "../ws-client-store.js";
import { TRNButton } from "../ui/TRN/TRNButton.js";
import { ConnectionUartAllowStrip } from "../bitstream-app/connection/ConnectionUartAllowStrip.js";

export function StartupChecklistSerialPortsBody() {
  const wsConnected = useWsClientStore((s) => s.isConnected);
  const wsConnect = useWsClientStore((s) => s.connect);
  const serialPath = useBitstreamConfigStore((s) => s.serialPath);
  const setSerialPath = useBitstreamConfigStore((s) => s.setSerialPath);
  const whitelistedSerialPaths = useBitstreamConfigStore((s) => s.whitelistedSerialPaths);
  const serialPortDisplayOrder = useBitstreamConfigStore((s) => s.serialPortDisplayOrder);
  const selectedPath = useSerialPortStore((s) => s.selectedPath);
  const setSelectedPath = useSerialPortStore((s) => s.setSelectedPath);
  const serialStatus = useSerialPortStore((s) => s.status);
  const listPorts = useSerialPortStore((s) => s.listPorts);
  const connecting = useBitstreamConnectionStore((s) => s.connecting);

  const [portOptions, setPortOptions] = useState<string[]>([]);
  const [portsLoading, setPortsLoading] = useState(false);

  const comOpen = serialStatus?.isOpen === true;
  const openComPath = comOpen ? (serialStatus?.path ?? null) : null;
  const baud = serialStatus?.baudRate ?? 921600;

  const nextLinkPick = useMemo(
    () =>
      pickPreferredSerialPortPath({
        availablePaths: portOptions,
        preferredPath: serialPath || selectedPath,
        whitelistedPaths: whitelistedSerialPaths,
        displayOrder: serialPortDisplayOrder,
      }),
    [portOptions, selectedPath, serialPath, serialPortDisplayOrder, whitelistedSerialPaths],
  );

  const refreshPortList = useCallback(async () => {
    if (!wsConnected) {
      toast.info("Connect WebSocket before listing COM ports.");
      return;
    }
    setPortsLoading(true);
    try {
      const ports = await listPorts();
      const paths = ports.map((p) => p.path);
      setPortOptions(paths);
      const pick = pickPreferredSerialPortPath({
        availablePaths: paths,
        preferredPath: serialPath || selectedPath,
        whitelistedPaths: whitelistedSerialPaths,
        displayOrder: serialPortDisplayOrder,
      });
      if (pick != null) {
        setSelectedPath(pick);
        setSerialPath(pick);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(`Port list failed: ${message}`);
    } finally {
      setPortsLoading(false);
    }
  }, [
    listPorts,
    selectedPath,
    serialPath,
    serialPortDisplayOrder,
    setSelectedPath,
    setSerialPath,
    whitelistedSerialPaths,
    wsConnected,
  ]);

  useEffect(() => {
    if (wsConnected && portOptions.length === 0) {
      void refreshPortList();
    }
  }, [portOptions.length, refreshPortList, wsConnected]);

  const openAllowedPort = useCallback(
    async (path: string) => {
      try {
        if (!wsConnected) {
          await wsConnect();
        }
        setSelectedPath(path);
        setSerialPath(path);
        await openUartPortAndHandshake({ forceFullBringUp: true });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        toast.error(message);
      }
    },
    [setSelectedPath, setSerialPath, wsConnect, wsConnected],
  );

  const handleOpenAllowed = useCallback(async () => {
    if (nextLinkPick == null) {
      toast.error("No allowed port — refresh the list or adjust Port Admin.");
      return;
    }
    await openAllowedPort(nextLinkPick);
  }, [nextLinkPick, openAllowedPort]);

  const handleClosePort = useCallback(async () => {
    try {
      await releaseOpenSerialPort();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(message);
    }
  }, []);

  return (
    <div className="space-y-2">
      <ConnectionUartAllowStrip
        nextLinkPick={nextLinkPick}
        portCount={portOptions.length}
        comOpen={comOpen}
        openComPath={openComPath}
        onOpenAllowedPort={() => void handleOpenAllowed()}
        onSwitchToAllowedPort={
          nextLinkPick != null ? () => void handleOpenAllowed() : undefined
        }
      />

      <div className="rounded border border-zinc-800/90 bg-zinc-950/50 px-2 py-2">
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Serial ports ({portOptions.length} found)
        </p>
        {portOptions.length === 0 ? (
          <p className="text-[10px] text-zinc-500">
            {portsLoading ? "Listing ports…" : "Refresh to load COM devices."}
          </p>
        ) : (
          <ul className="max-h-36 space-y-1 overflow-y-auto font-mono text-[10px] scrollbar-hide">
            {portOptions.map((path) => {
              const isOpen = comOpen && openComPath === path;
              const isSelected =
                !isOpen &&
                (path === nextLinkPick || path === selectedPath || path === serialPath);
              const marker = isOpen ? "●" : isSelected ? "◉" : "○";
              const tone = isOpen
                ? "text-emerald-300"
                : isSelected
                  ? "text-cyan-200/90"
                  : "text-zinc-400";
              const suffix = isOpen
                ? `open @ ${baud}`
                : isSelected
                  ? "selected"
                  : "available";
              return (
                <li key={path} className={`flex gap-2 ${tone}`}>
                  <span className="w-3 shrink-0 text-center">{marker}</span>
                  <span className="min-w-0 flex-1 truncate">{path}</span>
                  <span className="shrink-0 text-zinc-500">{suffix}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <TRNButton
          size="compact"
          disabled={portsLoading || !wsConnected}
          onClick={() => void refreshPortList()}
        >
          {portsLoading ? "Listing…" : "Refresh list"}
        </TRNButton>
        <TRNButton
          size="compact"
          disabled={connecting || !wsConnected || nextLinkPick == null}
          onClick={() => void handleOpenAllowed()}
        >
          Open {nextLinkPick ?? "port"}
        </TRNButton>
        <TRNButton
          size="compact"
          disabled={!comOpen}
          onClick={() => void handleClosePort()}
        >
          Close port
        </TRNButton>
      </div>
    </div>
  );
}
