import { CircleHelp } from "lucide-react";
import { useCallback, useState } from "react";
import { TRNWindow } from "../../../ui/TRN/TRNWindow.js";
import { TRNMarkdownZoomControls } from "../../../ui/TRN/TRNMarkdownRenderer.js";
import { BitstreamSystemLogsWindow } from "../system-logs/BitstreamSystemLogsWindow";
import { BitstreamWifiPanel } from "../../../bitstream-app/components/wifi/BitstreamWifiPanel.js";
import { FirmwareLogLevelPanel } from "../../../bitstream-app/components/system/FirmwareLogLevelPanel.js";
import { CommandConfirmationModePanel } from "../../../bitstream-app/components/system/CommandConfirmationModePanel.js";
import { RealtimeUiSettingsForm } from "../../../bitstream-app/components/telemetry/RealtimeUiSettingsForm.js";
import { AiDevTracePanel } from "../../../bitstream-app/components/ai-dev/AiDevTracePanel.js";
import { AiBridgeHelpMarkdown } from "../../../bitstream-app/components/ai-dev/AiBridgeHelpMarkdown.js";
import { AiBridgeSettingsPanel } from "../../../bitstream-app/components/ai-dev/AiBridgeSettingsPanel.js";
import { DiagCardsDeck } from "../../../bitstream-app/components/diag/DiagCardsDeck.js";
import { RuntimeServicesHealthPanel } from "../../../bitstream-app/components/diag/RuntimeServicesHealthPanel.js";
import { ConnectionPanel } from "../../../bitstream-app/connection/ConnectionPanel.js";
import { useConnectionPanelStore } from "../../../bitstream-app/connection/connectionPanel.store.js";
import { AnthropicApiKeySettingsPanel } from "../../../ai-bridge/AnthropicApiKeySettingsPanel";
import { BitstreamTelemetryLinkDiagnosticsPanel } from "../BitstreamTelemetryLinkDiagnosticsPanel";

export type BitstreamShellWindowsState = {
  systemLogsOpen: boolean;
  wifiPanelOpen: boolean;
  firmwareLogLevelOpen: boolean;
  commandConfirmationOpen: boolean;
  telemetryPerformanceSettingsOpen: boolean;
  telemetryLinkDiagnosticsOpen: boolean;
  aiDevTraceOpen: boolean;
  aiBridgeSettingsOpen: boolean;
  anthropicApiKeySettingsOpen: boolean;
  systemDiagnosticsOpen: boolean;
};

export type BitstreamShellWindowsActions = {
  openSystemLogs: () => void;
  openWifiPanel: () => void;
  openFirmwareLogLevel: () => void;
  openCommandConfirmation: () => void;
  openTelemetryPerformanceSettings: () => void;
  openTelemetryLinkDiagnostics: () => void;
  openAiDevTrace: () => void;
  openAiBridgeSettings: () => void;
  openAnthropicApiKeySettings: () => void;
  openSystemDiagnostics: () => void;
  closeSystemLogs: () => void;
  closeWifiPanel: () => void;
  closeFirmwareLogLevel: () => void;
  closeCommandConfirmation: () => void;
  closeTelemetryPerformanceSettings: () => void;
  closeTelemetryLinkDiagnostics: () => void;
  closeAiDevTrace: () => void;
  closeAiBridgeSettings: () => void;
  closeAnthropicApiKeySettings: () => void;
  closeSystemDiagnostics: () => void;
};

export function useBitstreamShellWindowsState(): {
  state: BitstreamShellWindowsState;
  actions: BitstreamShellWindowsActions;
}
{
  const [systemLogsOpen, setSystemLogsOpen] = useState(false);
  const [wifiPanelOpen, setWifiPanelOpen] = useState(false);
  const [firmwareLogLevelOpen, setFirmwareLogLevelOpen] = useState(false);
  const [commandConfirmationOpen, setCommandConfirmationOpen] = useState(false);
  const [aiDevTraceOpen, setAiDevTraceOpen] = useState(false);
  const [aiBridgeSettingsOpen, setAiBridgeSettingsOpen] = useState(false);
  const [anthropicApiKeySettingsOpen, setAnthropicApiKeySettingsOpen] = useState(false);
  const [telemetryPerformanceSettingsOpen, setTelemetryPerformanceSettingsOpen] =
    useState(false);
  const [telemetryLinkDiagnosticsOpen, setTelemetryLinkDiagnosticsOpen] = useState(false);
  const [systemDiagnosticsOpen, setSystemDiagnosticsOpen] = useState(false);

  const openSystemLogs = useCallback(() => setSystemLogsOpen(true), []);
  const openWifiPanel = useCallback(() => setWifiPanelOpen(true), []);
  const openFirmwareLogLevel = useCallback(() => setFirmwareLogLevelOpen(true), []);
  const openCommandConfirmation = useCallback(() => setCommandConfirmationOpen(true), []);
  const openAiDevTrace = useCallback(() => setAiDevTraceOpen(true), []);
  const openAiBridgeSettings = useCallback(() => setAiBridgeSettingsOpen(true), []);
  const openAnthropicApiKeySettings = useCallback(() => setAnthropicApiKeySettingsOpen(true), []);
  const openTelemetryPerformanceSettings = useCallback(
    () => setTelemetryPerformanceSettingsOpen(true),
    [],
  );
  const openTelemetryLinkDiagnostics = useCallback(() => setTelemetryLinkDiagnosticsOpen(true), []);
  const openSystemDiagnostics = useCallback(() => setSystemDiagnosticsOpen(true), []);

  const closeSystemLogs = useCallback(() => setSystemLogsOpen(false), []);
  const closeWifiPanel = useCallback(() => setWifiPanelOpen(false), []);
  const closeFirmwareLogLevel = useCallback(() => setFirmwareLogLevelOpen(false), []);
  const closeCommandConfirmation = useCallback(() => setCommandConfirmationOpen(false), []);
  const closeAiDevTrace = useCallback(() => setAiDevTraceOpen(false), []);
  const closeAiBridgeSettings = useCallback(() => setAiBridgeSettingsOpen(false), []);
  const closeAnthropicApiKeySettings = useCallback(() => setAnthropicApiKeySettingsOpen(false), []);
  const closeTelemetryPerformanceSettings = useCallback(
    () => setTelemetryPerformanceSettingsOpen(false),
    [],
  );
  const closeTelemetryLinkDiagnostics = useCallback(() => setTelemetryLinkDiagnosticsOpen(false), []);
  const closeSystemDiagnostics = useCallback(() => setSystemDiagnosticsOpen(false), []);

  return {
    state: {
      systemLogsOpen,
      wifiPanelOpen,
      firmwareLogLevelOpen,
      commandConfirmationOpen,
      telemetryPerformanceSettingsOpen,
      telemetryLinkDiagnosticsOpen,
      aiDevTraceOpen,
      aiBridgeSettingsOpen,
      anthropicApiKeySettingsOpen,
      systemDiagnosticsOpen,
    },
    actions: {
      openSystemLogs,
      openWifiPanel,
      openFirmwareLogLevel,
      openCommandConfirmation,
      openTelemetryPerformanceSettings,
      openTelemetryLinkDiagnostics,
      openAiDevTrace,
      openAiBridgeSettings,
      openAnthropicApiKeySettings,
      openSystemDiagnostics,
      closeSystemLogs,
      closeWifiPanel,
      closeFirmwareLogLevel,
      closeCommandConfirmation,
      closeTelemetryPerformanceSettings,
      closeTelemetryLinkDiagnostics,
      closeAiDevTrace,
      closeAiBridgeSettings,
      closeAnthropicApiKeySettings,
      closeSystemDiagnostics,
    },
  };
}

export function BitstreamShellWindowsHost(props: {
  windows: BitstreamShellWindowsState;
  actions: BitstreamShellWindowsActions;
  /** Reconnect simulator WebSocket session (serial bridge path removed). */
  onReconnectTelemetry: () => void;
})
{
  const { windows, actions } = props;
  const [aiDevHelpOpen, setAiDevHelpOpen] = useState(false);
  const connectionPanelOpen = useConnectionPanelStore((s) => s.open);
  const closeConnectionPanel = useConnectionPanelStore((s) => s.closePanel);

  return (
    <>
      <BitstreamSystemLogsWindow open={windows.systemLogsOpen} onClose={actions.closeSystemLogs} />

      <TRNWindow
        open={windows.wifiPanelOpen}
        onClose={actions.closeWifiPanel}
        title="Wi‑Fi (Bitstream)"
        initialRect={{ x: 40, y: 96, width: 360, height: 620 }}
        minWidth={320}
        minHeight={280}
        heightMode="auto"
        autoHeightMaxViewportFraction={0.92}
        modal={false}
        zIndex={334}
        contentClassName="min-h-0 overflow-y-auto bg-black/30 p-2"
        persistRectStorageKey="bitstream-app:wifi-control-window"
      >
        <BitstreamWifiPanel className="min-h-0" />
      </TRNWindow>

      <TRNWindow
        open={windows.firmwareLogLevelOpen}
        onClose={actions.closeFirmwareLogLevel}
        title="Firmware Log Control"
        initialRect={{ x: 120, y: 108, width: 460, height: 300 }}
        minWidth={380}
        minHeight={240}
        heightMode="auto"
        autoHeightMaxViewportFraction={0.72}
        modal={false}
        zIndex={335}
        contentClassName="min-h-0 overflow-y-auto bg-black/30 p-2"
        persistRectStorageKey="bitstream-app:firmware-log-level-window"
      >
        <FirmwareLogLevelPanel />
      </TRNWindow>

      <TRNWindow
        open={windows.commandConfirmationOpen}
        onClose={actions.closeCommandConfirmation}
        title="Command confirmation"
        initialRect={{ x: 96, y: 120, width: 420, height: 280 }}
        minWidth={360}
        minHeight={220}
        heightMode="auto"
        autoHeightMaxViewportFraction={0.72}
        modal={false}
        zIndex={336}
        contentClassName="min-h-0 overflow-y-auto bg-black/30 p-2"
        persistRectStorageKey="bitstream-app:command-confirmation-window"
      >
        <CommandConfirmationModePanel />
      </TRNWindow>

      <TRNWindow
        open={windows.telemetryPerformanceSettingsOpen}
        onClose={actions.closeTelemetryPerformanceSettings}
        title="Telemetry performance"
        initialRect={{ x: 72, y: 88, width: 480, height: 520 }}
        minWidth={400}
        minHeight={320}
        heightMode="auto"
        autoHeightMaxViewportFraction={0.88}
        modal={false}
        zIndex={337}
        contentClassName="min-h-0 overflow-y-auto bg-black/30 p-2"
        persistRectStorageKey="bitstream-app:telemetry-performance-window"
      >
        <RealtimeUiSettingsForm onReconnectTelemetry={props.onReconnectTelemetry} />
      </TRNWindow>

      <TRNWindow
        open={windows.telemetryLinkDiagnosticsOpen}
        onClose={actions.closeTelemetryLinkDiagnostics}
        title="Telemetry link diagnostics"
        initialRect={{ x: 88, y: 72, width: 520, height: 560 }}
        minWidth={420}
        minHeight={360}
        heightMode="auto"
        autoHeightMaxViewportFraction={0.9}
        modal={false}
        zIndex={338}
        contentClassName="min-h-0 overflow-y-auto bg-black/30 p-2"
        persistRectStorageKey="bitstream-app:telemetry-link-diagnostics-window"
      >
        <BitstreamTelemetryLinkDiagnosticsPanel />
      </TRNWindow>

      <TRNWindow
        open={windows.aiDevTraceOpen}
        onClose={actions.closeAiDevTrace}
        title="AI dev trace"
        initialRect={{ x: 140, y: 64, width: 640, height: 480 }}
        minWidth={480}
        minHeight={320}
        modal={false}
        zIndex={339}
        contentClassName="min-h-0 overflow-hidden bg-black/30"
        persistRectStorageKey="bitstream-app:ai-dev-trace-window"
        headerActions={
          <button
            type="button"
            className="inline-flex h-7 items-center gap-1 rounded border border-white/15 bg-white/8 px-2 text-[11px] text-zinc-200 hover:bg-white/12"
            onClick={() => setAiDevHelpOpen(true)}
            aria-label="AI bridge help"
          >
            <CircleHelp className="h-3.5 w-3.5" aria-hidden />
            Help
          </button>
        }
      >
        <AiDevTracePanel />
      </TRNWindow>

      <TRNWindow
        open={aiDevHelpOpen}
        onClose={() => setAiDevHelpOpen(false)}
        title="AI bridge help"
        initialRect={{ x: 180, y: 96, width: 560, height: 420 }}
        minWidth={420}
        minHeight={280}
        heightMode="auto"
        autoHeightMaxViewportFraction={0.85}
        modal={false}
        zIndex={340}
        contentClassName="min-h-0 overflow-y-auto bg-black/30 p-3"
        persistRectStorageKey="bitstream-app:ai-bridge-help-window"
        headerActions={<TRNMarkdownZoomControls />}
      >
        <AiBridgeHelpMarkdown />
      </TRNWindow>

      <TRNWindow
        open={windows.aiBridgeSettingsOpen}
        onClose={actions.closeAiBridgeSettings}
        title="AI Bridge Settings"
        initialRect={{ x: 160, y: 80, width: 480, height: 400 }}
        minWidth={400}
        minHeight={280}
        heightMode="auto"
        autoHeightMaxViewportFraction={0.8}
        modal={false}
        zIndex={341}
        contentClassName="min-h-0 overflow-y-auto bg-black/30 p-2"
        persistRectStorageKey="bitstream-app:ai-bridge-settings-window"
      >
        <AiBridgeSettingsPanel />
      </TRNWindow>

      <TRNWindow
        open={windows.anthropicApiKeySettingsOpen}
        onClose={actions.closeAnthropicApiKeySettings}
        title="Assistant AI settings"
        initialRect={{ x: 200, y: 100, width: 440, height: 320 }}
        minWidth={380}
        minHeight={240}
        heightMode="auto"
        autoHeightMaxViewportFraction={0.75}
        modal={false}
        zIndex={342}
        contentClassName="min-h-0 overflow-y-auto bg-black/30 p-2"
        persistRectStorageKey="bitstream-app:anthropic-api-key-window"
      >
        <AnthropicApiKeySettingsPanel />
      </TRNWindow>

      <TRNWindow
        open={windows.systemDiagnosticsOpen}
        onClose={actions.closeSystemDiagnostics}
        title="Diagnostics & runtime services"
        initialRect={{ x: 48, y: 56, width: 720, height: 640 }}
        minWidth={560}
        minHeight={400}
        modal={false}
        zIndex={343}
        contentClassName="flex min-h-0 flex-col gap-3 overflow-y-auto bg-black/30 p-2"
        persistRectStorageKey="bitstream-app:system-diagnostics-window"
      >
        <RuntimeServicesHealthPanel active={windows.systemDiagnosticsOpen} />
        <DiagCardsDeck />
      </TRNWindow>

      <TRNWindow
        open={connectionPanelOpen}
        onClose={closeConnectionPanel}
        title="Connection"
        initialRect={{ x: Math.max(24, (typeof window !== "undefined" ? window.innerWidth : 1200) - 400), y: 56, width: 380, height: 680 }}
        minWidth={320}
        minHeight={420}
        modal={false}
        zIndex={344}
        contentClassName="flex min-h-0 flex-col overflow-hidden bg-black/30 p-2"
        persistRectStorageKey="bitstream-app:connection-panel-window"
      >
        <ConnectionPanel />
      </TRNWindow>
    </>
  );
}
