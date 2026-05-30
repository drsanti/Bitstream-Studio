import { useMemo } from "react";
import { Cable, FileJson, GripVertical, List, Star } from "lucide-react";
import {
  classifySerialPortConnection,
  serialPortConnectionLabel,
} from "../../../serialport-bridge/classifySerialPort";
import { useBitstreamConnectionStore } from "../state/bitstreamConnection.store.js";
import { useBitstreamLiveStore } from "../state/bitstreamLive.store.js";
import {
  TRNDragHandle,
  TRNHintText,
  TRNSectionContainer,
  TRNSortableContainer,
  TRNSortableItem,
  TRNToggleSwitch,
  TRNWindow,
} from "../../ui/TRN";
import { usePortAdminController } from "../../serialport/usePortAdminController";
import { PortAdminPortDetails } from "./PortAdminPortDetails";
import { PortAdminDetailsViewToggle } from "./PortAdminDetailsViewToggle";
import { PortAdminStatusStrip } from "./PortAdminStatusStrip.js";

const PORT_ROW_GRID =
  "grid grid-cols-[auto_auto_minmax(4.5rem,1fr)_4.5rem_minmax(0,1.4fr)_auto] items-center gap-x-2";

function autoConnectPortSummary(
  ports: ReadonlyArray<{ path: string; manufacturer?: string }>,
  pick: string | null,
): string | null
{
  if (pick == null)
  {
    return null;
  }
  const port = ports.find((p) => p.path === pick);
  if (port == null)
  {
    return null;
  }
  const kind = serialPortConnectionLabel(classifySerialPortConnection(port));
  const mfg = port.manufacturer?.trim();
  if (mfg != null && mfg.length > 0)
  {
    return `${kind} · ${mfg}`;
  }
  return kind;
}

export function SystemSerialportInfo()
{
  const {
    isOpen,
    isWsConnected,
    selectedPath,
    serialPath,
    autoConnectPick,
    whitelistedSerialPaths,
    selectedPort,
    orderedPorts,
    loading,
    error,
    lastUpdatedAt,
    close,
    setSelectedPath,
    refreshPorts,
    toggleWhitelistedSerialPath,
    reorderPorts,
    useThisPort,
    isWhitelisted,
    detailsViewMode,
    setDetailsViewMode,
  } = usePortAdminController();

  const serialBridgeStatus = useBitstreamConnectionStore((s) => s.serialBridgeStatus);
  const handshakeState = useBitstreamLiveStore((s) => s.handshakeState);

  const orderedPaths = useMemo(
    () => orderedPorts.map((port) => port.path),
    [orderedPorts],
  );

  const whitelistCount = whitelistedSerialPaths.length;
  const comOpen = serialBridgeStatus?.isOpen === true;
  const openComPath = comOpen ? (serialBridgeStatus?.path ?? serialPath) : null;

  const autoConnectSummary = useMemo(
    () => autoConnectPortSummary(orderedPorts, autoConnectPick),
    [orderedPorts, autoConnectPick],
  );

  const detailsTitle =
    selectedPath != null ? `Port details — ${selectedPath}` : "Port details";

  return (
    <TRNWindow
      open={isOpen}
      title="Serial Port Admin"
      onClose={close}
      initialRect={{ x: 120, y: 90, width: 880, height: 420 }}
      minWidth={640}
      minHeight={200}
      heightMode="auto"
      autoHeightMaxViewportFraction={0.88}
      modal={false}
      reopenStrategy="normalize"
      zIndex={200}
      glass={true}
      glassPreset="strong"
      showFooter={false}
      resizable={true}
    >
      <div className="flex flex-col gap-2">
        {error ? (
          <div className="rounded border border-rose-500/40 bg-rose-950/30 px-2 py-1.5 text-xs text-rose-300">
            {error}
          </div>
        ) : null}

        <PortAdminStatusStrip
          isWsConnected={isWsConnected}
          comOpen={comOpen}
          openComPath={openComPath}
          handshakeState={handshakeState}
          autoConnectPick={autoConnectPick}
          autoConnectSummary={autoConnectSummary}
          whitelistCount={whitelistCount}
          portCount={orderedPorts.length}
          lastUpdatedAt={lastUpdatedAt}
          loading={loading}
          onRefresh={() => void refreshPorts()}
        />

        <div className="flex w-full flex-col gap-2">
          <TRNSectionContainer
            title="Port list"
            titleLeadingSlot={
              <List className="h-3.5 w-3.5 shrink-0 text-cyan-300/85" aria-hidden />
            }
            headerTitleClassName="normal-case tracking-normal text-zinc-100"
            titleTrailingSlot={
              <span className="tabular-nums text-xs font-semibold text-zinc-400">
                {orderedPorts.length} found
              </span>
            }
            glass={true}
            glassPreset="strong"
            className="h-auto"
          >
            <div className="flex flex-col -mx-2 -mb-2 px-2 pb-2">
              <div
                className={
                  PORT_ROW_GRID +
                  " sticky top-0 z-1 border-b border-zinc-600/65 bg-zinc-900/65 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 backdrop-blur-sm"
                }
              >
                <span aria-hidden />
                <span title="Include in UART auto-connect pick">Auto</span>
                <span>Path</span>
                <span>Type</span>
                <span>Manufacturer</span>
                <span aria-hidden />
              </div>

              <div className="max-h-[min(16rem,40vh)] overflow-auto">
                {orderedPorts.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-zinc-400">
                    {loading ? "Loading ports…" : "No serial ports found."}
                  </div>
                ) : (
                  <TRNSortableContainer
                    itemIds={orderedPaths}
                    onReorder={reorderPorts}
                    className="flex flex-col"
                  >
                    {orderedPorts.map((port) =>
                    {
                      const isInspecting = selectedPath === port.path;
                      const isTarget = serialPath === port.path;
                      const whitelisted = isWhitelisted(port.path);
                      const connectionKind = classifySerialPortConnection(port);
                      const connectionLabel = serialPortConnectionLabel(connectionKind);
                      return (
                        <TRNSortableItem
                          key={port.path}
                          id={port.path}
                          dragFx="lift"
                          className={
                            "border-b border-zinc-700/40 " +
                            (isInspecting ? "bg-zinc-800/45" : "hover:bg-zinc-800/30") +
                            (isTarget ? " border-l-2 border-l-amber-400/70" : "")
                          }
                        >
                          <div
                            className={PORT_ROW_GRID + " px-2 py-1.5 text-xs"}
                            onClick={() => setSelectedPath(port.path)}
                            onKeyDown={(event) =>
                            {
                              if (event.key === "Enter" || event.key === " ")
                              {
                                event.preventDefault();
                                setSelectedPath(port.path);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            <TRNDragHandle
                              className="h-6 w-6 shrink-0 border-0 bg-transparent p-0 text-zinc-400 hover:bg-transparent! hover:text-zinc-200"
                              aria-label={`Reorder ${port.path}`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <GripVertical className="h-3.5 w-3.5" aria-hidden />
                            </TRNDragHandle>

                            <div
                              className="flex items-center"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <TRNToggleSwitch
                                checked={whitelisted}
                                onCheckedChange={() =>
                                  toggleWhitelistedSerialPath(port.path)
                                }
                                ariaLabel={
                                  whitelisted
                                    ? `Remove ${port.path} from auto-connect list`
                                    : `Add ${port.path} to auto-connect list`
                                }
                              />
                            </div>

                            <div className="flex min-w-0 items-center gap-1 font-mono">
                              <span className="truncate">{port.path}</span>
                              {isTarget ? (
                                <Star
                                  className="h-3 w-3 shrink-0 fill-amber-300/90 text-amber-300/90"
                                  aria-label="Active UART target"
                                  title="Active UART target"
                                />
                              ) : null}
                            </div>

                            <span
                              className={
                                "truncate text-[10px] font-medium " +
                                (connectionKind === "bluetooth"
                                  ? "text-sky-300/90"
                                  : connectionKind === "usb"
                                    ? "text-emerald-300/90"
                                    : "text-zinc-500")
                              }
                              title={
                                connectionKind === "bluetooth"
                                  ? "Likely Bluetooth serial (SPP / RFCOMM)"
                                  : connectionKind === "usb"
                                    ? "USB virtual COM"
                                    : "Connection type unknown"
                              }
                            >
                              {connectionLabel}
                            </span>

                            <span className="truncate text-zinc-300">
                              {port.manufacturer ?? "-"}
                            </span>

                            <button
                              type="button"
                              className={
                                "inline-flex shrink-0 items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium transition-colors " +
                                (isTarget
                                  ? "border-cyan-500/60 bg-cyan-900/45 text-cyan-50 hover:bg-cyan-800/55"
                                  : "border-zinc-600/55 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800/55 hover:text-zinc-100")
                              }
                              onClick={(event) =>
                              {
                                event.stopPropagation();
                                void useThisPort(port.path);
                              }}
                              title={
                                isTarget
                                  ? `Connect using ${port.path} (active target)`
                                  : `Set ${port.path} as UART target and connect`
                              }
                            >
                              <Cable className="h-3 w-3" aria-hidden />
                              {isTarget ? "Connect" : "Set target"}
                            </button>
                          </div>
                        </TRNSortableItem>
                      );
                    })}
                  </TRNSortableContainer>
                )}
              </div>

              <TRNHintText tone="muted" className="mt-2 px-1">
                ★ Active UART target · Row click = inspect · Drag ≡ = auto-connect
                priority (top first)
              </TRNHintText>
            </div>
          </TRNSectionContainer>

          <TRNSectionContainer
            title={detailsTitle}
            titleLeadingSlot={
              <FileJson className="h-3.5 w-3.5 shrink-0 text-cyan-300/85" aria-hidden />
            }
            titleTrailingSlot={
              <PortAdminDetailsViewToggle
                viewMode={detailsViewMode}
                onViewModeChange={setDetailsViewMode}
              />
            }
            headerTitleClassName="normal-case tracking-normal text-zinc-100"
            glass={true}
            glassPreset="strong"
            className="h-auto"
          >
            <PortAdminPortDetails
              selectedPort={selectedPort}
              viewMode={detailsViewMode}
              inspectPath={selectedPath}
              targetPath={serialPath}
            />
          </TRNSectionContainer>
        </div>
      </div>
    </TRNWindow>
  );
}
