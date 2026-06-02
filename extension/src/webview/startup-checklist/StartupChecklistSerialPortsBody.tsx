import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ternionFreeAssetPackCopy } from "../asset-bootstrap/ternionFreeAssetPackCopy.js";
import { openUartPortAndHandshake } from "../bitstream-app/bridge/openUartPortAndHandshake.js";
import { releaseOpenSerialPort } from "../bitstream-app/bridge/releaseOpenSerialPort.js";
import { ConnectionUartAllowStrip } from "../bitstream-app/connection/ConnectionUartAllowStrip.js";
import { pickPreferredSerialPortPath } from "../bitstream-app/utils/pickPreferredSerialPortPath.js";
import { useBitstreamConfigStore } from "../bitstream-app/state/bitstreamConfig.store.js";
import { useBitstreamConnectionStore } from "../bitstream-app/state/bitstreamConnection.store.js";
import { useSerialPortStore } from "../serialport/serial-port-store.js";
import { useWsClientStore } from "../ws-client-store.js";
import { TRNButton } from "../ui/TRN/TRNButton.js";
import { TRNHintText } from "../ui/TRN/TRNHintText.js";

const C = ternionFreeAssetPackCopy.checklist;

function isPathAllowed(
  path: string,
  whitelistedPaths: string[],
): boolean {
  return whitelistedPaths.length === 0 || whitelistedPaths.includes(path);
}

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

  const activeSelection = selectedPath || serialPath || null;

  const nextLinkPick = useMemo(
    () =>
      pickPreferredSerialPortPath({
        availablePaths: portOptions,
        preferredPath: activeSelection,
        whitelistedPaths: whitelistedSerialPaths,
        displayOrder: serialPortDisplayOrder,
      }),
    [activeSelection, portOptions, serialPortDisplayOrder, whitelistedSerialPaths],
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
        preferredPath: activeSelection,
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
    activeSelection,
    listPorts,
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

  const openPort = useCallback(
    async (path: string) => {
      if (!isPathAllowed(path, whitelistedSerialPaths)) {
        toast.info(C.serialNotOnAllowList);
        return;
      }
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
    [setSelectedPath, setSerialPath, whitelistedSerialPaths, wsConnect, wsConnected],
  );

  const handleOpenAllowed = useCallback(async () => {
    if (nextLinkPick == null) {
      toast.error("No allowed port — refresh the list or adjust Port Admin.");
      return;
    }
    await openPort(nextLinkPick);
  }, [nextLinkPick, openPort]);

  const handleOpenSelected = useCallback(async () => {
    if (activeSelection == null || activeSelection.length === 0) {
      toast.info(C.serialNoSelection);
      return;
    }
    await openPort(activeSelection);
  }, [activeSelection, openPort]);

  const handleClosePort = useCallback(async () => {
    try {
      await releaseOpenSerialPort();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(message);
    }
  }, []);

  const selectPort = useCallback(
    (path: string) => {
      setSelectedPath(path);
      setSerialPath(path);
    },
    [setSelectedPath, setSerialPath],
  );

  return (
    <div className="space-y-2">
      <TRNHintText className="text-[10px] text-zinc-500">{C.serialListHint}</TRNHintText>

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
          <ul className="max-h-40 space-y-0.5 overflow-y-auto scrollbar-hide" role="listbox">
            {portOptions.map((path) => {
              const isOpen = comOpen && openComPath === path;
              const isSelected = !isOpen && path === activeSelection;
              const allowed = isPathAllowed(path, whitelistedSerialPaths);
              const marker = isOpen ? "●" : isSelected ? "◉" : "○";
              const tone = isOpen
                ? "text-emerald-300"
                : isSelected
                  ? "text-cyan-200/90"
                  : allowed
                    ? "text-zinc-300"
                    : "text-zinc-500";
              const suffix = isOpen
                ? `open @ ${baud}`
                : isSelected
                  ? "selected"
                  : allowed
                    ? "available"
                    : C.serialNotOnAllowList;

              return (
                <li key={path} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected || isOpen}
                    className={`flex w-full gap-2 rounded px-1.5 py-1 text-left font-mono text-[10px] transition-colors hover:bg-white/[0.04] focus:outline-none focus-visible:ring-1 focus-visible:ring-white/25 ${tone} ${
                      isSelected ? "bg-sky-500/10" : ""
                    }`}
                    onClick={() => selectPort(path)}
                    onDoubleClick={() => void openPort(path)}
                  >
                    <span className="w-3 shrink-0 text-center">{marker}</span>
                    <span className="min-w-0 flex-1 truncate">{path}</span>
                    <span className="shrink-0 text-zinc-500">{suffix}</span>
                  </button>
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
          disabled={connecting || !wsConnected || activeSelection == null}
          selected
          onClick={() => void handleOpenSelected()}
          hint="Opens the highlighted port at 921600 baud and runs the device check."
        >
          {C.serialOpenSelected}
          {activeSelection != null ? ` (${activeSelection})` : ""}
        </TRNButton>
        <TRNButton
          size="compact"
          disabled={connecting || !wsConnected || nextLinkPick == null}
          onClick={() => void handleOpenAllowed()}
          hint="Opens the suggested Allow-list port (Next Link port)."
        >
          Open {nextLinkPick ?? "suggested"}
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
