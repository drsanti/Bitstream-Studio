import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useBitstreamShellQuickCommands } from "./hooks/useBitstreamShellQuickCommands.js";
import {
  useGlassModalHamburgerMenu,
} from "../ui/components/common/index.js";
import { useBitstreamConfig } from "../bitstream-app/hooks/useBitstreamConfig.js";
import { useBitstreamConnection } from "../bitstream-app/hooks/useBitstreamConnection.js";
import { useBitstreamConnectionStore } from "../bitstream-app/state/bitstreamConnection.store.js";
import { useBitstreamHandshake } from "../bitstream-app/hooks/useBitstreamHandshake.js";
import { useBitstreamSession } from "../bitstream-app/hooks/useBitstreamSession.js";
import { useBitstream2TelemetryBridge } from "../bitstream-app/hooks/useBitstream2TelemetryBridge.js";
import { useUartFirmwareHotplugRecovery } from "../bitstream-app/hooks/useUartFirmwareHotplugRecovery.js";
import { useSyncBrokerWsToConnectionStore } from "../bitstream-app/hooks/useSyncBrokerWsToConnectionStore.js";
import { useTelemetryActivityMirror } from "../sensor-telemetry/hooks/useTelemetryActivityMirror.js";
import { appendTelemetryActivity } from "../sensor-telemetry/store/telemetryActivity.store.js";
import { useWsClientStore } from "../ws-client-store";
import { CY_WCM_SECURITY_WPA2_AES_PSK } from "../../bitstream/wifi/wifi-wcm-security.js";
import {
  BITSTREAM_CAPS_FLAG_WIFI_CHANNEL,
} from "../../bitstream/wifi/bitstream-wifi-channel.js";
import type { HandshakeLifecycleState } from "../bitstream-app/state/bitstreamLive.store.js";
import { useBitstreamLiveStore } from "../bitstream-app/state/bitstreamLive.store.js";
import { usePreviewMeshMissingUiStore } from "../bitstream-app/state/previewMeshMissingUi.store.js";
import { useBitstreamWifiStore } from "../bitstream-app/state/bitstreamWifi.store.js";
import { TRNAlertOverlay } from "../ui/TRN/TRNAlertOverlay.js";
import { TRNContainer } from "../ui/TRN/TRNContainer.js";
import { TRNScrollableEdgeHints } from "../ui/TRN/TRNScrollableEdgeHints.js";
import { BitstreamMainToolbar } from "./ui/BitstreamMainToolbar";
import { AssetManagerMain, openAssetManagerBrowseModels, useAssetManagerAltMShortcut } from "../assets-manager";
import { SensorStudioAssistantShell } from "./ui/SensorStudioAssistantShell";
import { BitstreamHeaderMenuPanel } from "./ui/shell/BitstreamHeaderMenuPanel";
import {
  BitstreamShellWindowsHost,
  useBitstreamShellWindowsState,
} from "./ui/shell/BitstreamShellWindowsHost";
import {
  type BitstreamHostMirrorStatus,
  installBitstreamHostConfigSync,
  isBitstreamMirrorDebugEnabled,
} from "../bitstream-app/installBitstreamHostConfigSync.js";
import {
  getSensorSourceDisplayLabel,
} from "../bitstream-app/constants/sensorSourceIds.js";
import { useBitstreamConfigStore } from "../bitstream-app/state/bitstreamConfig.store.js";
import { isTelemetryTransportReady } from "../bitstream-app/utils/bitstreamTelemetryTransport.js";
import { BitstreamTransportActionsProvider } from "../bitstream-app/context/bitstreamTransportActions.context.js";
import { RemoteSyncNotice } from "./ui/RemoteSyncNotice";
import { SensorConfigAckErrorOverlay } from "./ui/SensorConfigAckErrorOverlay";
import { SimulatorNotRunningNotice } from "./ui/SimulatorNotRunningNotice";
import { UartFirmwareNotConnectedNotice } from "./ui/UartFirmwareNotConnectedNotice";
import { useSimulatorTelemetryMissingAlert } from "./hooks/useSimulatorTelemetryMissingAlert.js";
import { useUartHandshakeMissingAlert } from "./hooks/useUartHandshakeMissingAlert.js";
import { userFacingHandshakeFailureCopy } from "../bitstream-app/utils/bitstreamHandshakeFailureCopy.js";
import { useLinkHandshakeSatisfied } from "../bitstream-app/hooks/useLinkHandshakeSatisfied.js";
import { useBitstreamTelemetrySourceStore } from "../bitstream-app/state/bitstreamTelemetrySource.store";
import {
  BitstreamAppControlContext,
  useBitstreamAppControl,
} from "../bitstream-app/control/bitstreamAppControl.context.js";
import {
  type SensorCfgUiPatch,
  useSensorConfigController,
} from "../bitstream-app/control/useSensorConfigController.js";
import { useDiagnosticsController } from "../bitstream-app/control/useDiagnosticsController.js";
import { SensorCfgColdSyncEffect } from "../bitstream-app/sync-effects/SensorCfgColdSyncEffect.js";
import { useSensorCfgBrokerSync } from "../bitstream-app/sync-effects/useSensorCfgBrokerSync.js";
import { useBmi270StreamModeBrokerSync } from "../bitstream-app/sync-effects/useBmi270StreamModeBrokerSync.js";
import { useSerialPortStore } from "../serialport/serial-port-store";
import { BitstreamBootLifecycleBar } from "./ui/BitstreamBootLifecycleBar.js";
import { ConnectionPanelActionsProvider } from "../bitstream-app/connection/connectionPanelActions.context.js";
import {
  type ConnectionStepId,
  useConnectionPanelStore,
} from "../bitstream-app/connection/connectionPanel.store.js";
import { runConnectAllSession } from "../bitstream-app/connection/runConnectAllSession.js";
import { runDisconnectAllSession } from "../bitstream-app/connection/runDisconnectAllSession.js";

/** Mount broker sync hooks without adding render output. */
function SensorCfgBrokerSyncMount(props: { instanceToken: string })
{
  useSensorCfgBrokerSync(props.instanceToken);
  useBmi270StreamModeBrokerSync(props.instanceToken);
  return null;
}

const BITSTREAM_HEADER_MENU_TRIGGER =
  'button[data-bitstream-header-menu="true"]';
const BITSTREAM_MAIN_SHELL_PANEL_ID = "bitstream-shell-root";

// (menu panel moved to `bitstream-shell/ui/shell/BitstreamHeaderMenuPanel.tsx`)

function BitstreamHandshakeFailureOverlay(props: {
  handshakeState: HandshakeLifecycleState;
  handshakeLastError: string | null;
}) {
  const { handshakeState, handshakeLastError } = props;

  const [userDismissed, setUserDismissed] = useState(false);

  useEffect(() => {
    if (handshakeState === "passed" || handshakeState === "running" || handshakeState === "unknown") {
      setUserDismissed(false);
    }
  }, [handshakeState]);

  const open =
    handshakeState === "failed" &&
    Boolean(handshakeLastError) &&
    !userDismissed;
  const copy =
    handshakeLastError != null && handshakeLastError.trim().length > 0
      ? userFacingHandshakeFailureCopy(handshakeLastError)
      : null;
  return (
    <TRNAlertOverlay
      open={open}
      variant="error"
      zIndex={95}
      onRequestClose={() => setUserDismissed(true)}
    >
      {copy ? (
        <>
          <p className="text-base font-semibold leading-snug text-rose-50">
            {copy.headline}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-rose-100/85">
            {copy.hint}
          </p>
          {copy.technicalLine ? (
            <p
              className="mt-3 font-mono text-[10px] leading-relaxed text-zinc-500 wrap-break-word"
              title={handshakeLastError ?? undefined}
            >
              {copy.technicalLine}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-zinc-100 hover:bg-white/15"
              onClick={() => setUserDismissed(true)}
            >
              Dismiss
            </button>
          </div>
        </>
      ) : null}
    </TRNAlertOverlay>
  );
}

function BitstreamHostMirrorDebugStrip() {
  const [hostMirrorStatus, setHostMirrorStatus] =
    useState<BitstreamHostMirrorStatus>({
      kind: "off",
    });

  useEffect(() => {
    return installBitstreamHostConfigSync({ onStatus: setHostMirrorStatus });
  }, []);

  if (!isBitstreamMirrorDebugEnabled() || hostMirrorStatus.kind === "off") {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed bottom-2 left-2 z-320 max-w-[min(90vw,28rem)] rounded border border-violet-400/35 bg-violet-950/82 px-2 py-1 font-mono text-[10px] leading-snug text-violet-100/95 shadow-md backdrop-blur-sm"
      role="status"
      title={
        hostMirrorStatus.kind === "synced" && hostMirrorStatus.note
          ? hostMirrorStatus.note
          : undefined
      }
    >
      Mirror:{" "}
      {hostMirrorStatus.kind === "pulling"
        ? "pulling…"
        : hostMirrorStatus.kind === "synced"
          ? "synced"
          : hostMirrorStatus.kind === "no_mirror_file"
            ? "no host file (first push pending)"
            : hostMirrorStatus.kind === "error"
              ? `error — ${hostMirrorStatus.message}`
              : "off"}
    </div>
  );
}

export { useBitstreamAppControl };
export { BitstreamShellRoot as BitstreamAppWrapper };

/**
 * Bitstream shell root: simulator transport, handshake, multi-sensor live pipeline,
 * and `sensor.cfg.*` helpers via `useBitstreamAppControl`. BMI270-only setup such as
 * stream-mode sync effects live in dedicated child components (e.g.
 * `Bmi270StreamModeSyncEffect`), not on this shell root’s props.
 */
export function BitstreamShellRoot(props: { children?: ReactNode }) {
  const { children } = props;
  const { state: windows, actions: windowActions } = useBitstreamShellWindowsState();
  const sensorStudioWorkspaceBoundsRef = useRef<HTMLDivElement>(null);

  const openModelLoaderFromAssetManager = useCallback(() => {
    usePreviewMeshMissingUiStore.getState().setModelLoaderOpen(true);
  }, []);
  const openFreeLoaderFromAssetManager = useCallback(() => {
    usePreviewMeshMissingUiStore.getState().setFreeAssetsLoaderOpen(true);
  }, []);
  const openModelCatalogFromAssetManager = useCallback(() => {
    openAssetManagerBrowseModels();
  }, []);

  useAssetManagerAltMShortcut();

  const headerMenu = useGlassModalHamburgerMenu({
    triggerSelector: BITSTREAM_HEADER_MENU_TRIGGER,
  });

  const openWifiPanelFromMenu = windowActions.openWifiPanel;
  const openFirmwareLogLevelFromMenu = windowActions.openFirmwareLogLevel;
  const openCommandConfirmationFromMenu = windowActions.openCommandConfirmation;
  const openAiDevTraceFromMenu = windowActions.openAiDevTrace;
  const openAiBridgeSettingsFromMenu = windowActions.openAiBridgeSettings;
  const openAnthropicApiKeySettingsFromMenu = windowActions.openAnthropicApiKeySettings;
  const openSystemDiagnosticsFromMenu = windowActions.openSystemDiagnostics;
  const openTelemetryPerformanceSettingsFromMenu = windowActions.openTelemetryPerformanceSettings;
  const openTelemetryLinkDiagnosticsFromMenu = windowActions.openTelemetryLinkDiagnostics;
  const openConnectionPanel = useConnectionPanelStore((s) => s.openPanel);

  const openConnectionFromMenu = useCallback(() => {
    openConnectionPanel();
  }, [openConnectionPanel]);

  const openConnectionWithStep = useCallback(
    (stepId?: string) => {
      openConnectionPanel(stepId as ConnectionStepId | undefined);
    },
    [openConnectionPanel],
  );

  const { uiFlushIntervalMs } = useBitstreamConfig();
  const {
    connecting,
    connected,
    transportState,
    busyAction,
    setConnecting,
    setConnected,
    setTransportState,
    setBusyAction,
    setBackendWsState,
    runtimeSyncState,
    setRuntimeSyncState,
    pushLog,
  } = useBitstreamConnection();
  const applyMetricsSnapshot = useBitstreamLiveStore((s) => s.applyMetricsSnapshot);
  const resetLiveData = useBitstreamLiveStore((s) => s.resetLiveData);

  const serialBridgeStatus = useBitstreamConnectionStore((s) => s.serialBridgeStatus);

  const isTransportReady = isTelemetryTransportReady({
    connected,
    transportState,
    serialBridgeStatus,
  });

  const {
    requireConnectedSession,
    runAction,
    disconnectSession,
    connectSession,
    ingestSensorSample,
    publishBmi270StreamModeUpdated,
    publishBmi270FusionFeedUpdated,
    publishRuntimeHandshakeReport,
    publishSensorCfgUpdated,
    actorToken,
  } = useBitstreamSession({
    uiFlushIntervalMs,
    connecting,
    connected,
    setConnecting,
    setConnected,
    setTransportState,
    setBusyAction,
    setBackendWsState,
    setRuntimeSyncState,
    pushLog,
    applyMetricsSnapshot,
    resetLiveData,
    autoOrchestrate: true,
  });

  const connectionPanelActions = useMemo(
    () => ({
      connectAll: async () => {
        appendTelemetryActivity({ text: "Connection starting (Connect all)…", tone: "info" });
        await runAction("Connect all", async () => {
          await runConnectAllSession(connectSession);
        });
      },
      disconnectAll: async () => {
        appendTelemetryActivity({ text: "Connection teardown (Disconnect all)…", tone: "info" });
        await runAction("Disconnect all", async () => {
          await runDisconnectAllSession(disconnectSession);
        });
      },
      runAction,
    }),
    [connectSession, disconnectSession, runAction],
  );

  const handleReconnectTelemetry = useCallback(() => {
    appendTelemetryActivity({ text: "Reconnecting session…", tone: "info" });
    void runAction("Reconnect telemetry", async () => {
      await disconnectSession({ preserveLiveTelemetry: true });
      await connectSession(undefined, { userInitiated: true, preserveLiveTelemetry: true });
    });
  }, [connectSession, disconnectSession, runAction]);

  const setHandshake = useBitstreamLiveStore((s) => s.setHandshake);
  const setHandshakeState = useBitstreamLiveStore((s) => s.setHandshakeState);

  useBitstream2TelemetryBridge({
    onBs2Sample: ingestSensorSample,
    setHandshakeFromBs2: setHandshake,
    setHandshakeState,
  });

  const telemetryBackend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const uartBringUpPending = useBitstreamTelemetrySourceStore((s) => s.uartBringUpPending);
  const uartAwaitingReplug = useBitstreamTelemetrySourceStore((s) => s.uartAwaitingReplug);
  const serialPortStatus = useSerialPortStore((s) => s.status);
  const wsConnected = useWsClientStore((s) => s.isConnected);
  const wsConnectionState = useWsClientStore((s) => s.connectionState);
  const brokerWsConnecting =
    wsConnectionState === "connecting" || wsConnectionState === "reconnecting";

  const simulatorMissingAlert = useSimulatorTelemetryMissingAlert();
  const uartHandshakeMissingAlert = useUartHandshakeMissingAlert();

  useSyncBrokerWsToConnectionStore();
  useTelemetryActivityMirror();

  const autoUartOpenAttemptedRef = useRef(false);
  const serialOpen = serialPortStatus?.isOpen === true;

  useUartFirmwareHotplugRecovery({
    telemetryBackend,
    wsConnected,
    serialOpen,
    autoUartOpenAttemptedRef,
  });

  useBitstreamShellQuickCommands({
    connected,
    connecting,
    handleReconnectTelemetry,
    connectSession,
    disconnectSession,
    windowActions: {
      openWifiPanel: openWifiPanelFromMenu,
      openSystemLogs: windowActions.openSystemLogs,
      openSystemDiagnostics: openSystemDiagnosticsFromMenu,
      openFirmwareLogLevel: openFirmwareLogLevelFromMenu,
      openTelemetryLinkDiagnostics: openTelemetryLinkDiagnosticsFromMenu,
    },
    openModelLoader: openModelLoaderFromAssetManager,
    openFreeAssetsLoader: openFreeLoaderFromAssetManager,
    openModelCatalog: openModelCatalogFromAssetManager,
  });

  const {
    sensorConfigAck,
    getLastAttemptPatch,
    getSensorConfig,
    setSensorConfig,
    getBmi270SensorConfig,
    setBmi270SensorConfig,
    setBmi270SamplingIntervalMs,
    applyAllSensorsAtHz,
    declareBmi270OutputModePending,
    completeBmi270OutputModeApply,
    clearSensorConfigAck,
    retrySensorConfigAck,
    refreshAllSensorCfgFromDevice,
    applyDirtySensorConfigs,
    applyDirtySensorConfigForSource,
    revertSensorCfgDraft,
    listDirtySensorSourceIds,
    isSensorCfgDirty,
  } = useSensorConfigController({
    isTransportReady,
    requireConnectedSession,
    pushLog,
    runAction,
    publishSensorCfgUpdated,
  });

  const linkHandshakeOk = useLinkHandshakeSatisfied();

  const { handshakeState, handshakeLastError } = useBitstreamHandshake({
    publishHandshakeRuntimeReport: publishRuntimeHandshakeReport,
  });

  const userPausedLink = useBitstreamConnectionStore((s) => s.userPausedLink);

  useEffect(() => {
    if (telemetryBackend !== "uart") {
      autoUartOpenAttemptedRef.current = false;
      return;
    }
    if (!wsConnected) {
      return;
    }
    if (userPausedLink) {
      return;
    }

    const linkHealthy = handshakeState === "passed" && serialOpen;
    /* Unplugged: hotplug poller sets uartBringUpPending when listPorts finds a COM. */
    const mustRunBringUp =
      uartBringUpPending || (!linkHealthy && !uartAwaitingReplug);

    if (!mustRunBringUp) {
      return;
    }
    if (autoUartOpenAttemptedRef.current && !uartBringUpPending) {
      return;
    }

    autoUartOpenAttemptedRef.current = true;

    void (async () => {
      try {
        await runAction("Connect UART (auto)", async () => {
          await connectSession(undefined, {
            userInitiated: true,
            preserveLiveTelemetry: true,
            forceUartFullBringUp: uartBringUpPending,
          });
        });
      }
      finally {
        const passed =
          useBitstreamLiveStore.getState().handshakeState === "passed";
        const open = useSerialPortStore.getState().status?.isOpen === true;
        if (!passed || !open) {
          autoUartOpenAttemptedRef.current = false;
        }
      }
    })();
  }, [
    connectSession,
    runAction,
    telemetryBackend,
    uartBringUpPending,
    uartAwaitingReplug,
    userPausedLink,
    wsConnected,
    handshakeState,
    serialOpen,
  ]);

  const {
    getDiagSnapshot,
    setDiagTaskPriority,
    setDiagTaskStreamConfig,
    diagTaskStreamResyncNow,
    startDiagStream,
    stopDiagStream,
  } = useDiagnosticsController({
    handshakeState,
    isTransportReady,
    systemDiagnosticsOpen: windows.systemDiagnosticsOpen,
  });

  const [firmwareSensorTruthReady, setFirmwareSensorTruthReady] = useState(false);

  const handleSensorCfgTruthReady = useCallback((ready: boolean) => {
    setFirmwareSensorTruthReady(ready);
  }, []);

  // Cold sync sets firmwareSensorTruthReady via SensorCfgColdSyncEffect.

  // (sensor config pipeline moved to `control/useSensorConfigController.ts`)

  // (diagnostics controller moved to `control/useDiagnosticsController.ts`)

  const wifiScanAll = useCallback(async (): Promise<boolean> => {
    pushLog("Wi‑Fi: v1 HostSession channel removed (BS2 Wi‑Fi TBD)");
    return false;
  }, [pushLog]);

  const wifiScanSsid = useCallback(async (_ssidSubstring: string): Promise<boolean> => false, []);

  const wifiConnect = useCallback(
    async (_ssid: string, _password: string, _security = CY_WCM_SECURITY_WPA2_AES_PSK): Promise<boolean> => false,
    [],
  );

  const wifiDisconnect = useCallback(async (): Promise<boolean> => false, []);

  const wifiStatusPoll = useCallback(async (): Promise<boolean> => false, []);

  const capsFlags = useBitstreamLiveStore((s) => s.handshake?.capsFlags ?? 0);
  const wifiCapabilityAdvertised = (capsFlags & BITSTREAM_CAPS_FLAG_WIFI_CHANNEL) !== 0;

  const wifiPolicyGet = useCallback(async (): Promise<boolean> => false, []);

  const wifiPolicySet = useCallback(async (_autoConnectEnabled: boolean): Promise<boolean> => false, []);

  const wifiSyncNow = useCallback(async (_reason: string): Promise<void> => {}, []);

  const getFirmwareLogLevel = useCallback(async (): Promise<{
    ok: boolean;
    unsupported: boolean;
    level: number | null;
    errorCode: number | null;
    errorMessage: string | null;
  }> => {
    const mode = useBitstreamConfigStore.getState().commandConfirmationMode;
    if (mode === "fast") {
      const level = useBitstreamConfigStore.getState().firmwareLogLevelUi ?? null;
      return {
        ok: level != null,
        unsupported: true,
        level,
        errorCode: null,
        errorMessage: "Fast mode: firmware log level GET requires ACK-confirmed transport",
      };
    }
    return {
      ok: false,
      unsupported: true,
      level: null,
      errorCode: null,
      errorMessage: "Firmware log level: v1 HostSession removed (BS2 control TBD)",
    };
  }, []);

  const setFirmwareLogLevel = useCallback(
    async (level: number): Promise<{
      ok: boolean;
      unsupported: boolean;
      level: number | null;
      errorCode: number | null;
      errorMessage: string | null;
    }> => {
      void level;
      return {
        ok: false,
        unsupported: true,
        level: null,
        errorCode: null,
        errorMessage: "Firmware log level: v1 HostSession removed (BS2 control TBD)",
      };
    },
    [],
  );

  const firmwareLogAutoAppliedRef = useRef(false);
  useEffect(() => {
    if (!isTransportReady || !linkHandshakeOk) {
      firmwareLogAutoAppliedRef.current = false;
    }
  }, [linkHandshakeOk, isTransportReady]);

  const sensorConfigAckOverlayOpen = sensorConfigAck.state === "error";
  const sensorAckRetryDisabled =
    !sensorConfigAckOverlayOpen ||
    (sensorConfigAck.pendingReason !== "bmi270_output_mode" &&
      (sensorConfigAck.sourceId == null ||
        (() => {
          const sid = sensorConfigAck.sourceId;
          const p = getLastAttemptPatch(sid);
          return p == null || Object.keys(p).length === 0;
        })()));

  const describeSensorCfgPatch = useCallback((patch: SensorCfgUiPatch | undefined): string => {
    if (!patch) {
      return "Change settings";
    }
    const keys = Object.keys(patch);
    if (keys.length === 0) {
      return "Change settings";
    }
    if (keys.length === 1) {
      const k = keys[0];
      if (k === "samplingIntervalMs") return "Change sample rate";
      if (k === "publishMode") return "Change telemetry mode";
      if (k === "enabled") return (patch.enabled ? "Enable sensor" : "Disable sensor") ?? "Toggle sensor";
      if (k === "deltaX100") return "Change delta";
      if (k === "minPublishIntervalMs") return "Change minimum publish interval";
    }
    if (keys.includes("samplingIntervalMs")) return "Change sample rate (and other settings)";
    if (keys.includes("publishMode")) return "Change telemetry mode (and other settings)";
    if (keys.includes("enabled")) return "Change sensor enabled (and other settings)";
    return "Change multiple settings";
  }, []);

  const formatSensorCfgErrorForOverlay = useCallback(() => {
    const raw = sensorConfigAck.message ?? "Unknown error";
    const sourceId = sensorConfigAck.sourceId ?? null;
    const lastPatch = sourceId != null ? getLastAttemptPatch(sourceId) : undefined;

    const technicalLines: string[] = [];
    let reasonLine = raw;

    const timeoutMatch = raw.match(
      /^Request timed out after\s+(\d+)\s+attempts?\s+\(requestId=(.+?)\)\s*$/i,
    );
    if (timeoutMatch) {
      const attempts = timeoutMatch[1] ?? "";
      const requestId = timeoutMatch[2] ?? "";
      reasonLine = "No response from firmware";
      technicalLines.push(`Attempts: ${attempts}`);
      technicalLines.push(`Request ID: ${requestId}`);
    } else if (/verify mismatch/i.test(raw) || /^S\d+:\s*verify mismatch/i.test(raw)) {
      reasonLine = "Device replied, but the settings did not match after applying";
      technicalLines.push(raw);
    } else if (/timed out/i.test(raw)) {
      reasonLine = "No response from firmware";
      technicalLines.push(raw);
    } else if (/Cannot read properties of undefined\s*\\(reading ['"]state['"]\\)/i.test(raw)) {
      reasonLine = "Internal runtime error (details below)";
      technicalLines.push(raw);
      technicalLines.push("Hint: open DevTools console for stack trace.");
    } else {
      technicalLines.push(raw);
    }

    const sensorLabel =
      sourceId != null ? getSensorSourceDisplayLabel(sourceId) : "Sensor";
    const whatYouDid = describeSensorCfgPatch(lastPatch);

    const summary = (
      <div className="flex min-w-0 flex-col gap-2">
        <div>We tried to talk to the device, but it didn’t respond in time.</div>
        <div className="grid min-w-0 grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px] text-zinc-300">
          <div className="text-zinc-400">Sensor:</div>
          <div className="min-w-0 truncate">{sensorLabel}</div>
          <div className="text-zinc-400">What you did:</div>
          <div className="min-w-0 truncate">{whatYouDid}</div>
          <div className="text-zinc-400">Status:</div>
          <div className="min-w-0 truncate">{reasonLine}</div>
        </div>
        <div className="pt-1">
          <div className="text-[12px] font-semibold text-zinc-200/90">What you can do</div>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[12px] text-zinc-300">
            <li>Wait a moment and try again</li>
            <li>If you pressed RESET, reconnect and retry</li>
            <li>Lower firmware log level (WARN/ERROR) to reduce serial traffic</li>
          </ul>
        </div>
      </div>
    );

    const details =
      technicalLines.length > 0 ? (
        <div className="whitespace-pre-wrap wrap-break-word font-mono text-[12px] text-zinc-200">
          {technicalLines.join("\n")}
        </div>
      ) : null;

    return { summary, details };
  }, [describeSensorCfgPatch, sensorConfigAck.message, sensorConfigAck.sourceId]);

  return (
    <div
      className="t3d-shell-overlay fixed inset-0 m-0 overflow-hidden bg-black/80 p-0 text-white/90"
      data-glass-modal-root
      data-panel-id={BITSTREAM_MAIN_SHELL_PANEL_ID}
    >
      <BitstreamTransportActionsProvider
        value={{
          requireConnectedSession,
          runAction,
          publishBmi270StreamModeUpdated,
          publishBmi270FusionFeedUpdated,
          firmwareSensorTruthReady,
          declareBmi270OutputModePending,
          completeBmi270OutputModeApply,
          reconnectTelemetry: handleReconnectTelemetry,
        }}
      >
        <ConnectionPanelActionsProvider value={connectionPanelActions}>
        <BitstreamAppControlContext.Provider
          value={{
            getSensorConfig,
            setSensorConfig,
            getBmi270SensorConfig,
            setBmi270SensorConfig,
            setBmi270SamplingIntervalMs,
            applyAllSensorsAtHz,
            sensorConfigAck,
            clearSensorConfigAck,
            retrySensorConfigAck,
            refreshAllSensorCfgFromDevice,
            applyDirtySensorConfigs,
            applyDirtySensorConfigForSource,
            revertSensorCfgDraft,
            listDirtySensorSourceIds,
            isSensorCfgDirty,
            getDiagSnapshot,
            setDiagTaskPriority,
            setDiagTaskStreamConfig,
            diagTaskStreamResyncNow,
            startDiagStream,
            stopDiagStream,
            wifiScanAll,
            wifiScanSsid,
            wifiConnect,
            wifiDisconnect,
            wifiStatusPoll,
            wifiPolicyGet,
            wifiPolicySet,
            getFirmwareLogLevel,
            setFirmwareLogLevel,
          }}
        >
        <SensorCfgColdSyncEffect onTruthReady={handleSensorCfgTruthReady} />
        <SensorCfgBrokerSyncMount instanceToken={actorToken} />
      <TRNContainer mode="fill-parent" layout="stack" gap="0">
        <BitstreamMainToolbar
          menuOpen={headerMenu.open}
          onMenuClick={headerMenu.onMenuClick}
          connected={connected}
          connecting={connecting}
          brokerWsConnected={wsConnected}
          brokerWsConnecting={brokerWsConnecting}
          onConnect={() => {
            appendTelemetryActivity({ text: "Connection starting (Connect)…", tone: "info" });
            void runAction("Connect", async () => {
              await runConnectAllSession(connectSession);
            });
          }}
          onDisconnect={() => void disconnectSession({ userInitiated: true })}
          onOpenSystemLogs={windowActions.openSystemLogs}
          onOpenFirmwareLogLevel={openFirmwareLogLevelFromMenu}
          onOpenWifiPanel={openWifiPanelFromMenu}
          onOpenSystemDiagnostics={openSystemDiagnosticsFromMenu}
        />
        <BitstreamBootLifecycleBar
          connected={connected}
          connecting={connecting}
          transportState={transportState}
          runtimeSyncState={runtimeSyncState}
          handshakeState={handshakeState}
          firmwareSensorTruthReady={firmwareSensorTruthReady}
          onOpenConnection={openConnectionWithStep}
        />
        <main className="flex min-h-0 w-full flex-1 flex-col">
          <TRNScrollableEdgeHints
            className="relative box-border flex min-h-0 min-w-0 flex-1 flex-col border-0 p-0"
            scrollClassName="flex min-h-0 min-w-0 flex-1 flex-col"
          >
            <div className="shrink-0">
              <BitstreamHeaderMenuPanel
                menu={headerMenu}
                glassModalPanelId={BITSTREAM_MAIN_SHELL_PANEL_ID}
                triggerSelector={BITSTREAM_HEADER_MENU_TRIGGER}
                onOpenWifiPanel={openWifiPanelFromMenu}
                onOpenFirmwareLogLevel={openFirmwareLogLevelFromMenu}
                onOpenCommandConfirmation={openCommandConfirmationFromMenu}
                onOpenAiDevTrace={openAiDevTraceFromMenu}
                onOpenAiBridgeSettings={openAiBridgeSettingsFromMenu}
                onOpenAnthropicApiKeySettings={openAnthropicApiKeySettingsFromMenu}
                onOpenTelemetryPerformanceSettings={
                  openTelemetryPerformanceSettingsFromMenu
                }
                onOpenTelemetryLinkDiagnostics={openTelemetryLinkDiagnosticsFromMenu}
                onOpenSystemDiagnostics={openSystemDiagnosticsFromMenu}
                onOpenConnection={openConnectionFromMenu}
              />

            </div>
            <div
              ref={sensorStudioWorkspaceBoundsRef}
              className="relative box-border flex min-h-0 min-w-0 w-full flex-1 flex-col"
            >
              {children}
              <SensorStudioAssistantShell
                workspaceBoundsRef={sensorStudioWorkspaceBoundsRef}
                onOpenSystemDiagnostics={openSystemDiagnosticsFromMenu}
              />
              <AssetManagerMain
                workspaceBoundsRef={sensorStudioWorkspaceBoundsRef}
                onOpenModelLoader={openModelLoaderFromAssetManager}
                onOpenFreeAssetsLoader={openFreeLoaderFromAssetManager}
                onOpenModelCatalog={openModelCatalogFromAssetManager}
              />
            </div>
          </TRNScrollableEdgeHints>
        </main>
      </TRNContainer>
      <SensorConfigAckErrorOverlay
        open={sensorConfigAckOverlayOpen}
        title={
          sensorConfigAck.sourceId != null
            ? `${getSensorSourceDisplayLabel(sensorConfigAck.sourceId)} configuration failed`
            : "Sensor configuration failed"
        }
        summary={formatSensorCfgErrorForOverlay().summary}
        detailsTitle="Details"
        details={formatSensorCfgErrorForOverlay().details}
        retryDisabled={sensorAckRetryDisabled}
        onDismiss={clearSensorConfigAck}
        onRetry={retrySensorConfigAck}
      />
      <BitstreamHandshakeFailureOverlay
        handshakeState={handshakeState}
        handshakeLastError={handshakeLastError}
      />
      <SimulatorNotRunningNotice
        key={`simulator-missing-notice-${simulatorMissingAlert.noticeKey}`}
        open={simulatorMissingAlert.open}
        wsConnected={simulatorMissingAlert.wsConnected}
        onOpenChange={simulatorMissingAlert.onOpenChange}
      />
      <UartFirmwareNotConnectedNotice
        key={`uart-handshake-notice-${uartHandshakeMissingAlert.noticeKey}`}
        open={uartHandshakeMissingAlert.open}
        message={uartHandshakeMissingAlert.message}
        onOpenChange={uartHandshakeMissingAlert.onOpenChange}
      />
      <BitstreamHostMirrorDebugStrip />
      <BitstreamShellWindowsHost
        windows={windows}
        actions={windowActions}
        onReconnectTelemetry={handleReconnectTelemetry}
      />
        </BitstreamAppControlContext.Provider>
        </ConnectionPanelActionsProvider>
      </BitstreamTransportActionsProvider>
    </div>
  );
}
