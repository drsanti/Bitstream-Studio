import type { T3D } from "@ternion/t3d";
import { useQuickSceneStore } from "@ternion/t3d";
import type { Group } from "three";
import { useCallback, useState } from "react";
import { Cable, Menu, Settings, X } from "lucide-react";
import { useSerialPortStore } from "../../../serialport/serial-port-store";
import { SerialPortManagerModal } from "../../../serialport/serial-port-manager";
import { usePortAdminStore } from "../../../serialport/port-admin.store";
import { DraggableGlassModal } from "../../../ui/components/draggable-glass-modal";
import {
  GlassModalHamburgerMenuPanel,
  useGlassModalHamburgerMenu,
} from "../../../ui/components/common";
import { TRNMenuItemButton, TRNMenuPanel } from "../../../ui/TRN/TRNMenu";
import { QS_SERIAL_MONITOR_SUBSCRIBER_ID } from "../hooks/useSerialMonitor";
import { useSerialMonitorStore } from "../store";
import { SerialMonitorPanel } from "./SerialMonitorPanel";

/**
 * Quick scene shell: draggable / resizable glass modal (portal) over the 3D view.
 * Body: `SerialMonitorPanel` (toolbar · log · send).
 * Hamburger toggles a **dropdown menu**; choosing **Settings** opens the Serial Port Manager.
 */
export function AppQsSerialMonitor(_props: { engine: T3D; model: Group }) {
  const setCurrentApplicationComponent = useQuickSceneStore(
    (s) => s.setCurrentApplicationComponent,
  );
  const headerMenu = useGlassModalHamburgerMenu();
  const [managerOpen, setManagerOpen] = useState(false);
  const openPortAdmin = usePortAdminStore((s) => s.open);

  const openManagerFromMenu = useCallback(() => {
    setManagerOpen(true);
    headerMenu.closeMenu();
  }, [headerMenu.closeMenu]);

  const openPortAdminFromMenu = useCallback(() => {
    openPortAdmin();
    headerMenu.closeMenu();
  }, [headerMenu.closeMenu, openPortAdmin]);

  const handleCloseSerialMonitor = useCallback(() => {
    setManagerOpen(false);
    headerMenu.closeMenu();
    useSerialPortStore
      .getState()
      .unsubscribe(QS_SERIAL_MONITOR_SUBSCRIBER_ID);
    const sm = useSerialMonitorStore.getState();
    sm.setReceivingEnabled(false);
    sm.clearLines();
    setCurrentApplicationComponent(null);
  }, [
    setCurrentApplicationComponent,
    headerMenu.closeMenu,
  ]);

  return (
    <DraggableGlassModal
      panelId="qs-serial-monitor"
      title="Serial Monitor"
      bodyDensity="compact"
      icon={Cable}
      menuIcon={Menu}
      closeIcon={X}
      onMenuClick={headerMenu.onMenuClick}
      onClose={handleCloseSerialMonitor}
      initialWidth={600}
      initialHeight={420}
      minWidth={320}
      minHeight={120}
    >
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <GlassModalHamburgerMenuPanel
          menu={headerMenu}
          glassModalPanelId="qs-serial-monitor"
          placement="end"
          menuAriaLabel="Serial monitor menu"
          shellClassName="w-full border-0 bg-transparent p-0 shadow-none backdrop-blur-none ring-0"
        >
          <TRNMenuPanel tone="card">
            <div className="flex flex-col gap-1">
              <TRNMenuItemButton
                tone="card"
                role="menuitem"
                onClick={openManagerFromMenu}
                icon={
                  <Settings
                    className="h-3.5 w-3.5 shrink-0 opacity-85"
                    aria-hidden
                  />
                }
                label="Settings"
              />
              <TRNMenuItemButton
                tone="card"
                role="menuitem"
                onClick={openPortAdminFromMenu}
                icon={<Settings className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />}
                label="Port Admin"
              />
            </div>
          </TRNMenuPanel>
        </GlassModalHamburgerMenuPanel>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <SerialMonitorPanel />
        </div>
      </div>
      <SerialPortManagerModal
        open={managerOpen}
        onOpenChange={setManagerOpen}
        panelId="qs-serial-monitor-manager"
        title="Serial Port Manager"
      />
    </DraggableGlassModal>
  );
}
