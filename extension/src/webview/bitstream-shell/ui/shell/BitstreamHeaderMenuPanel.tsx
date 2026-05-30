import {
  FolderOpen,
  Gauge,
  KeyRound,
  LayoutGrid,
  LayoutTemplate,
  MessageSquareText,
  Radio,
  ShieldCheck,
  Usb,
  Wifi,
  Workflow,
} from "lucide-react";
import { useCallback } from "react";
import { useSensorStudioAssistantUiStore } from "../../../sensor-studio/state/sensorStudioAssistantUi.store";
import { useBitstreamWorkspaceModeStore } from "../../../bitstream-app/state/bitstreamWorkspaceMode.store";
import { useTelemetryWorkbenchUiStore } from "../../../sensor-telemetry/store/telemetryWorkbenchUi.store.js";
import { useAdminWebsocketActivityStore } from "../../../bitstream-app/system-tools/admin-websocket-activity.store";
import { usePostMessageTraceStore } from "../../../post-message-trace/post-message-trace.store.js";
import { useOpenAssetManager } from "../../../assets-manager/hooks/useOpenAssetManager.js";
import { usePortAdminStore } from "../../../serialport/port-admin.store.js";
import {
  GlassModalHamburgerMenuPanel,
  useGlassModalHamburgerMenu,
} from "../../../ui/components/common/index.js";
import {
  TRNMenuItemButton,
  TRNMenuPanel,
  TRNMenuSectionTitle,
} from "../../../ui/TRN/TRNMenu.js";

export type BitstreamHeaderMenuState = ReturnType<typeof useGlassModalHamburgerMenu>;

export function BitstreamHeaderMenuPanel(props: {
  menu: BitstreamHeaderMenuState;
  glassModalPanelId: string;
  triggerSelector: string;
  onOpenWifiPanel: () => void;
  onOpenFirmwareLogLevel: () => void;
  onOpenCommandConfirmation: () => void;
  onOpenAiDevTrace: () => void;
  onOpenAiBridgeSettings: () => void;
  onOpenAnthropicApiKeySettings: () => void;
  onOpenTelemetryPerformanceSettings: () => void;
  onOpenTelemetryLinkDiagnostics: () => void;
  onOpenSystemDiagnostics: () => void;
}) {
  const {
    menu,
    glassModalPanelId,
    triggerSelector,
    onOpenWifiPanel,
    onOpenFirmwareLogLevel,
    onOpenCommandConfirmation,
    onOpenAiDevTrace,
    onOpenAiBridgeSettings,
    onOpenAnthropicApiKeySettings,
    onOpenTelemetryPerformanceSettings,
    onOpenTelemetryLinkDiagnostics,
    onOpenSystemDiagnostics,
  } = props;

  const workspace = useBitstreamWorkspaceModeStore((s) => s.workspace);
  const setWorkspace = useBitstreamWorkspaceModeStore((s) => s.setWorkspace);
  const invokeResetTelemetryLayout = useTelemetryWorkbenchUiStore((s) => s.invokeResetLayout);

  const assistantOpen = useSensorStudioAssistantUiStore((s) => s.assistantOpen);
  const toggleAssistant = useSensorStudioAssistantUiStore((s) => s.toggleAssistant);

  const { openAssetManager } = useOpenAssetManager();
  const openPortAdmin = usePortAdminStore((s) => s.open);
  const openAdminWebsocketActivity = useAdminWebsocketActivityStore((s) => s.open);
  const openPostMessageTrace = usePostMessageTraceStore((s) => s.open);

  const handleOpenWifiPanel = useCallback(() => {
    onOpenWifiPanel();
    menu.closeMenu();
  }, [menu, onOpenWifiPanel]);

  const handleOpenFirmwareLogLevel = useCallback(() => {
    onOpenFirmwareLogLevel();
    menu.closeMenu();
  }, [menu, onOpenFirmwareLogLevel]);

  const handleOpenCommandConfirmation = useCallback(() => {
    onOpenCommandConfirmation();
    menu.closeMenu();
  }, [menu, onOpenCommandConfirmation]);

  const handleOpenPortAdmin = useCallback(() => {
    openPortAdmin();
    menu.closeMenu();
  }, [menu, openPortAdmin]);

  const handleOpenWebsocketActivity = useCallback(() => {
    openAdminWebsocketActivity();
    menu.closeMenu();
  }, [menu, openAdminWebsocketActivity]);

  const handleOpenPostMessageTrace = useCallback(() => {
    openPostMessageTrace();
    menu.closeMenu();
  }, [menu, openPostMessageTrace]);

  const handleOpenTelemetryPerformanceSettings = useCallback(() => {
    onOpenTelemetryPerformanceSettings();
    menu.closeMenu();
  }, [menu, onOpenTelemetryPerformanceSettings]);

  const handleOpenTelemetryLinkDiagnostics = useCallback(() => {
    onOpenTelemetryLinkDiagnostics();
    menu.closeMenu();
  }, [menu, onOpenTelemetryLinkDiagnostics]);

  const handleOpenAiDevTrace = useCallback(() => {
    onOpenAiDevTrace();
    menu.closeMenu();
  }, [menu, onOpenAiDevTrace]);

  const handleOpenAiBridgeSettings = useCallback(() => {
    onOpenAiBridgeSettings();
    menu.closeMenu();
  }, [menu, onOpenAiBridgeSettings]);

  const handleOpenAnthropicApiKeySettings = useCallback(() => {
    onOpenAnthropicApiKeySettings();
    menu.closeMenu();
  }, [menu, onOpenAnthropicApiKeySettings]);

  const handleOpenSystemDiagnostics = useCallback(() => {
    onOpenSystemDiagnostics();
    menu.closeMenu();
  }, [menu, onOpenSystemDiagnostics]);

  const handleToggleBitstreamAssistant = useCallback(() => {
    toggleAssistant();
    menu.closeMenu();
  }, [menu, toggleAssistant]);

  const handleWorkspaceTelemetry = useCallback(() => {
    setWorkspace("sensor-telemetry");
    menu.closeMenu();
  }, [menu, setWorkspace]);

  const handleWorkspaceSensorStudio = useCallback(() => {
    setWorkspace("sensor-studio");
    menu.closeMenu();
  }, [menu, setWorkspace]);

  const handleResetTelemetryLayout = useCallback(() => {
    invokeResetTelemetryLayout();
    menu.closeMenu();
  }, [invokeResetTelemetryLayout, menu]);

  const handleOpenAssetManager = useCallback(() => {
    openAssetManager();
    menu.closeMenu();
  }, [menu, openAssetManager]);

  return (
    <GlassModalHamburgerMenuPanel
      menu={menu}
      glassModalPanelId={glassModalPanelId}
      placement="end"
      triggerSelector={triggerSelector}
      menuAriaLabel="Bitstream app menu"
      shellClassName="w-full border-0 bg-transparent p-0 shadow-none backdrop-blur-none ring-0"
    >
      <TRNMenuPanel tone="glass-dropdown">
        <div className="flex flex-col gap-1">
          <div className="px-2 pb-0.5 pt-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Workspace
          </div>
          <TRNMenuItemButton
            role="menuitem"
            disabled={workspace === "sensor-telemetry"}
            onClick={handleWorkspaceTelemetry}
            icon={<LayoutGrid className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />}
            label="Sensor Telemetry"
          />
          <TRNMenuItemButton
            role="menuitem"
            disabled={workspace === "sensor-studio"}
            onClick={handleWorkspaceSensorStudio}
            icon={<Workflow className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />}
            label="Sensor Studio workspace"
          />
          <TRNMenuItemButton
            role="menuitem"
            disabled={workspace !== "sensor-telemetry"}
            onClick={handleResetTelemetryLayout}
            icon={<LayoutTemplate className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />}
            label="Reset telemetry layout"
            title="Restore default config · main · live · activity pane split"
          />
          <TRNMenuSectionTitle spacing="menuNext">Assets</TRNMenuSectionTitle>
          <TRNMenuItemButton
            role="menuitem"
            onClick={handleOpenAssetManager}
            icon={<FolderOpen className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />}
            label="Asset Manager"
            title="Open Asset Manager (Alt+M)"
            rightSlot={
              <span className="font-mono text-[10px] tabular-nums text-zinc-500" aria-hidden>
                Alt+M
              </span>
            }
          />
          <TRNMenuItemButton
            role="menuitem"
            onClick={handleToggleBitstreamAssistant}
            icon={<MessageSquareText className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />}
            label={assistantOpen ? "Hide Bitstream Assistant" : "Bitstream Assistant"}
          />
          <TRNMenuItemButton
            role="menuitem"
            onClick={handleOpenTelemetryPerformanceSettings}
            icon={<Gauge className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />}
            label="Telemetry Performance"
          />
          <TRNMenuItemButton
            role="menuitem"
            onClick={handleOpenTelemetryLinkDiagnostics}
            icon={<Radio className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />}
            label="Telemetry diagnostics"
          />
          <TRNMenuItemButton
            role="menuitem"
            onClick={handleOpenCommandConfirmation}
            icon={<ShieldCheck className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />}
            label="Command Confirmation"
          />
          <TRNMenuItemButton
            role="menuitem"
            onClick={handleOpenAiDevTrace}
            icon={<Gauge className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />}
            label="AI Dev Trace"
          />
          <TRNMenuItemButton
            role="menuitem"
            onClick={handleOpenAiBridgeSettings}
            icon={<Gauge className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />}
            label="AI Bridge Settings"
          />
          <TRNMenuItemButton
            role="menuitem"
            onClick={handleOpenAnthropicApiKeySettings}
            icon={<KeyRound className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />}
            label="Assistant AI settings"
          />
          <TRNMenuItemButton
            role="menuitem"
            onClick={handleOpenSystemDiagnostics}
            icon={<Gauge className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />}
            label="Diagnostics & runtime services"
          />
          <TRNMenuItemButton
            role="menuitem"
            onClick={handleOpenWifiPanel}
            icon={<Wifi className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />}
            label="Wi-Fi Control"
          />
          <TRNMenuItemButton
            role="menuitem"
            onClick={handleOpenFirmwareLogLevel}
            icon={<Gauge className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />}
            label="Firmware Log Level"
          />
          <TRNMenuItemButton
            role="menuitem"
            onClick={handleOpenPortAdmin}
            icon={<Usb className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />}
            label="Port Admin"
          />
          <TRNMenuItemButton
            role="menuitem"
            onClick={handleOpenWebsocketActivity}
            icon={<Gauge className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />}
            label="WebSocket Activity"
          />
          <TRNMenuItemButton
            role="menuitem"
            onClick={handleOpenPostMessageTrace}
            icon={<Gauge className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />}
            label="PostMessage Trace"
          />
        </div>
      </TRNMenuPanel>
    </GlassModalHamburgerMenuPanel>
  );
}

