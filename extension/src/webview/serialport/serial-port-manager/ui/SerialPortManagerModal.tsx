import { useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { Cable, List, Menu, Settings2, X } from "lucide-react";
import { useWsClientStore } from "../../../ws-client-store";
import { useSerialPortStore } from "../../serial-port-store";
import { useSerialPort } from "../../useSerialPort";
import { usePortAdminStore } from "../../port-admin.store";
import { DraggableGlassModal } from "../../../ui/components/draggable-glass-modal";
import {
  GlassModalHamburgerMenuPanel,
  useGlassModalHamburgerMenu,
} from "../../../ui/components/common";
import { TRNMenuItemButton, TRNMenuPanel } from "../../../ui/TRN/TRNMenu";
import { ConnectionBlock } from "../../../ui/components/mcu-cli";
import { SERIAL_MANAGER_SUBSCRIBER_ID } from "../hook/subscriber-ids";
import { DEFAULT_SERIAL_PORT_MANAGER_PANEL_ID } from "../store/defaults";

export type SerialPortManagerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Passed to glass modal for persisted position/size. */
  panelId?: string;
  title?: string;
};

/**
 * Full serial session controls (WS URL, list/open port, baud) in a draggable glass
 * modal. Uses the global serial stack; subscriber id is separate from feature consumers
 * so stream handling stays on their hooks.
 */
export function SerialPortManagerModal({
  open,
  onOpenChange,
  panelId = DEFAULT_SERIAL_PORT_MANAGER_PANEL_ID,
  title = "Serial Port Manager",
}: SerialPortManagerModalProps) {
  const noop = useCallback(() => {}, []);
  const {
    connectionState,
    status,
    listPorts,
    openPort,
    closePort,
    connect,
    isConnected,
    ports,
    wsUrl,
    selectedPath,
    baudRate,
    setWsUrl,
    setSelectedPath,
    setBaudRate,
  } = useSerialPort(SERIAL_MANAGER_SUBSCRIBER_ID, noop);

  const wsBytesReceived = useWsClientStore((s) => s.wsBytesReceived);
  const wsBytesSent = useWsClientStore((s) => s.wsBytesSent);

  const handleListPorts = useCallback(async () => {
    try {
      const list = await listPorts();
      if (list.length > 0 && !selectedPath) {
        setSelectedPath(list[0]!.path);
      }
    } catch (e) {
      console.error("[SerialPortManager] listPorts:", e);
    }
  }, [listPorts, selectedPath, setSelectedPath]);

  const handleConnect = useCallback(async () => {
    try {
      await connect();
      await handleListPorts();
    } catch (e) {
      console.error("[SerialPortManager] connect:", e);
    }
  }, [connect, handleListPorts]);

  const handleOpenPort = useCallback(
    async (path: string) => {
      setSelectedPath(path);
      try {
        await openPort({
          path,
          baudRate,
          mode: "line",
          readlineDelimiter: "\n",
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[SerialPortManager] openPort:", e);
        toast.error(`Open port failed: ${msg}`);
      }
    },
    [openPort, baudRate, setSelectedPath],
  );

  const handleClose = useCallback(async () => {
    try {
      await closePort();
    } catch (e) {
      console.error("[SerialPortManager] closePort:", e);
    }
  }, [closePort]);

  const handleDisconnect = useCallback(async () => {
    try {
      await useSerialPortStore.getState().disconnect();
      await useWsClientStore.getState().disconnect();
    } catch (e) {
      console.error("[SerialPortManager] disconnect:", e);
    }
  }, []);

  const requestClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const headerMenu = useGlassModalHamburgerMenu();
  const openPortAdmin = usePortAdminStore((s) => s.open);

  useEffect(() => {
    if (!open) {
      headerMenu.closeMenu();
    }
  }, [open, headerMenu.closeMenu]);

  const listPortsFromMenu = useCallback(() => {
    void handleListPorts();
    headerMenu.closeMenu();
  }, [handleListPorts, headerMenu.closeMenu]);

  const openPortAdminFromMenu = useCallback(() => {
    openPortAdmin();
    headerMenu.closeMenu();
  }, [headerMenu.closeMenu, openPortAdmin]);

  if (!open) {
    return null;
  }

  return (
    <DraggableGlassModal
      panelId={panelId}
      title={title}
      description="WebSocket bridge and serial port"
      bodyDensity="default"
      icon={Cable}
      menuIcon={Menu}
      closeIcon={X}
      onMenuClick={headerMenu.onMenuClick}
      onClose={requestClose}
      initialWidth={520}
      initialHeight={420}
      minWidth={400}
      minHeight={360}
    >
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <GlassModalHamburgerMenuPanel
          menu={headerMenu}
          glassModalPanelId={panelId}
          placement="end"
          menuAriaLabel="Serial port manager menu"
          shellClassName="w-full border-0 bg-transparent p-0 shadow-none backdrop-blur-none ring-0"
        >
          <TRNMenuPanel tone="glass-dropdown">
            <div className="flex flex-col gap-1">
              <TRNMenuItemButton
                role="menuitem"
                disabled={!isConnected}
                onClick={listPortsFromMenu}
                icon={<List className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />}
                label="List ports"
                className="disabled:opacity-50"
              />
              <TRNMenuItemButton
                role="menuitem"
                onClick={openPortAdminFromMenu}
                icon={<Settings2 className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />}
                label="Port Admin"
              />
            </div>
          </TRNMenuPanel>
        </GlassModalHamburgerMenuPanel>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <ConnectionBlock
            wsUrl={wsUrl}
            onWsUrlChange={setWsUrl}
            connectionState={connectionState}
            status={status}
            ports={ports}
            selectedPath={selectedPath}
            baudRate={String(baudRate)}
            onBaudChange={(v) => setBaudRate(parseInt(v, 10) || 115200)}
            onListPorts={handleListPorts}
            onOpenPort={(path) => void handleOpenPort(path)}
            onClose={() => void handleClose()}
            onConnect={() => void handleConnect()}
            onDisconnect={() => void handleDisconnect()}
            isConnected={isConnected}
            cardsDefaultOpen={true}
            wsBytesReceived={wsBytesReceived}
            wsBytesSent={wsBytesSent}
          />
        </div>
      </div>
    </DraggableGlassModal>
  );
}
