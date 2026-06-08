import { Copy, Play, Unplug } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ensureBitstreamSimulatorReady } from "../bridge/requestBitstreamSimulatorHost.js";
import {
  postSerialBridgeStartFromExtension,
  postSerialBridgeStopFromExtension,
} from "../bridge/serial-bridge-extension-messages.js";
import { openUartPortAndHandshake } from "../bridge/openUartPortAndHandshake.js";
import { pickPreferredSerialPortPath } from "../utils/pickPreferredSerialPortPath.js";
import { releaseOpenSerialPort } from "../bridge/releaseOpenSerialPort.js";
import { publishTelemetryRoute } from "../bridge/publishTelemetryRoute.js";
import { useBitstreamConfigStore } from "../state/bitstreamConfig.store.js";
import { useBitstreamTelemetrySourceStore } from "../state/bitstreamTelemetrySource.store.js";
import { useSerialPortStore } from "../../serialport/serial-port-store.js";
import { usePortAdminStore } from "../../serialport/port-admin.store.js";
import { useWsClientStore } from "../../ws-client-store.js";
import { isVsCodeExtensionWebview } from "../../isVsCodeExtensionWebview.js";
import { BitstreamTelemetrySourceField } from "../../bitstream-shell/ui/BitstreamTelemetrySourceField.js";
import { TRNButton, TRNHintText, TRNSelect } from "../../ui/TRN/index.js";
import { TRN_GLASS_DROPDOWN_TEXT_CLASS } from "../../ui/components/toolbar-header-dropdown-menu-ui.js";
import { ConnectionStepCard } from "./ConnectionStepCard.js";
import { ConnectionUartAllowStrip } from "./ConnectionUartAllowStrip.js";
import {
  getConnectionStepContinueLabel,
  runConnectionStep,
} from "./runConnectionStep.js";
import {
  type ConnectionPanelMode,
  type ConnectionStepId,
  useConnectionPanelStore,
} from "./connectionPanel.store.js";
import { useConnectionPanelActions } from "./connectionPanelActions.context.js";
import { useConnectionSteps } from "./useConnectionSteps.js";

const BAUD_OPTIONS = ["921600", "460800", "115200"];

function ConnectionModeToggle(props: {
  mode: ConnectionPanelMode;
  onChange: (mode: ConnectionPanelMode) => void;
}) {
  return (
    <TRNSelect
      ariaLabel="Connection panel mode"
      value={props.mode}
      size="sm"
      options={[
        { value: "guided", label: "Guided" },
        { value: "expert", label: "Expert" },
      ]}
      onValueChange={(v) => props.onChange(v as ConnectionPanelMode)}
      className="w-28"
      buttonClassName={`h-7 border-zinc-700/80 bg-zinc-900/90 ${TRN_GLASS_DROPDOWN_TEXT_CLASS}`}
    />
  );
}

export function ConnectionPanel() {
  const ext = isVsCodeExtensionWebview();
  const panelOpen = useConnectionPanelStore((s) => s.open);
  const mode = useConnectionPanelStore((s) => s.mode);
  const focusStepId = useConnectionPanelStore((s) => s.focusStepId);
  const setMode = useConnectionPanelStore((s) => s.setMode);
  const clearFocusStep = useConnectionPanelStore((s) => s.clearFocusStep);

  const { connectAll, disconnectAll, runAction } = useConnectionPanelActions();
  const { steps, activeStepId, progressLabel, linkReady } = useConnectionSteps(panelOpen);

  const backend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const wsUrl = useWsClientStore((s) => s.wsUrl);
  const setWsUrl = useWsClientStore((s) => s.setWsUrl);
  const serialPath = useBitstreamConfigStore((s) => s.serialPath);
  const setSerialPath = useBitstreamConfigStore((s) => s.setSerialPath);
  const whitelistedSerialPaths = useBitstreamConfigStore((s) => s.whitelistedSerialPaths);
  const serialPortDisplayOrder = useBitstreamConfigStore((s) => s.serialPortDisplayOrder);

  const wsConnect = useWsClientStore((s) => s.connect);
  const wsDisconnect = useWsClientStore((s) => s.disconnect);
  const wsConnected = useWsClientStore((s) => s.isConnected);

  const selectedPath = useSerialPortStore((s) => s.selectedPath);
  const baudRate = useSerialPortStore((s) => s.baudRate);
  const setSelectedPath = useSerialPortStore((s) => s.setSelectedPath);
  const setBaudRate = useSerialPortStore((s) => s.setBaudRate);
  const serialStatus = useSerialPortStore((s) => s.status);
  const listPorts = useSerialPortStore((s) => s.listPorts);

  const openPortAdmin = usePortAdminStore((s) => s.open);

  const [expandedIds, setExpandedIds] = useState<Set<ConnectionStepId>>(() => new Set());
  const [portOptions, setPortOptions] = useState<string[]>([]);
  const [portsLoading, setPortsLoading] = useState(false);
  const [continueBusy, setContinueBusy] = useState(false);
  const [copyHint, setCopyHint] = useState<"idle" | "ok">("idle");
  const scrollRootRef = useRef<HTMLDivElement>(null);

  const guidedActiveId = activeStepId ?? "link";

  useEffect(() => {
    if (!panelOpen || focusStepId == null) {
      return;
    }
    setExpandedIds((prev) => new Set(prev).add(focusStepId));
    window.requestAnimationFrame(() => {
      const el = scrollRootRef.current?.querySelector(
        `[data-connection-step="${focusStepId}"]`,
      );
      el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      clearFocusStep();
    });
  }, [clearFocusStep, focusStepId, panelOpen]);

  useEffect(() => {
    if (mode === "guided" && panelOpen) {
      setExpandedIds(new Set([guidedActiveId]));
    }
  }, [guidedActiveId, mode, panelOpen]);

  const isExpanded = useCallback(
    (id: ConnectionStepId) => {
      if (mode === "expert") {
        return expandedIds.has(id);
      }
      return id === guidedActiveId || expandedIds.has(id);
    },
    [expandedIds, guidedActiveId, mode],
  );

  const toggleExpanded = useCallback((id: ConnectionStepId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

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
      const cfg = useBitstreamConfigStore.getState();
      const pick = pickPreferredSerialPortPath({
        availablePaths: paths,
        preferredPath: serialPath || selectedPath,
        whitelistedPaths: cfg.whitelistedSerialPaths,
        displayOrder: cfg.serialPortDisplayOrder,
      });
      if (pick != null)
      {
        setSelectedPath(pick);
        setSerialPath(pick);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(`Port list failed: ${message}`);
    } finally {
      setPortsLoading(false);
    }
  }, [listPorts, selectedPath, serialPath, setSelectedPath, setSerialPath, wsConnected]);

  useEffect(() => {
    if (panelOpen && backend === "uart" && wsConnected && portOptions.length === 0) {
      void refreshPortList();
    }
  }, [backend, panelOpen, portOptions.length, refreshPortList, wsConnected]);

  const comPath = selectedPath || serialPath || "COM3";
  const comOpen = serialStatus?.isOpen === true;
  const openComPath = comOpen ? (serialStatus?.path ?? null) : null;

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

  const continueLabel =
    activeStepId != null ? getConnectionStepContinueLabel(activeStepId, backend) : null;
  const showContinue =
    mode === "guided" && activeStepId != null && !linkReady && continueLabel != null;

  const handleContinue = useCallback(async () => {
    if (activeStepId == null) {
      return;
    }
    setContinueBusy(true);
    try {
      await runAction(continueLabel ?? "Continue", async () => {
        await runConnectionStep(activeStepId);
      });
    } finally {
      setContinueBusy(false);
    }
  }, [activeStepId, continueLabel, runAction]);

  const openAllowedPort = useCallback(
    async (path: string) => {
      await runAction(`Open ${path}`, async () => {
        if (!wsConnected) {
          await wsConnect();
        }
        useSerialPortStore.getState().setSelectedPath(path);
        setSerialPath(path);
        await openUartPortAndHandshake({ forceFullBringUp: true });
      });
    },
    [runAction, setSerialPath, wsConnect, wsConnected],
  );

  const handleOpenAllowedPort = useCallback(async () => {
    if (nextLinkPick == null) {
      toast.error("No allowed port — turn Allow ON in Port Admin or set ★ active target.");
      return;
    }
    await openAllowedPort(nextLinkPick);
  }, [nextLinkPick, openAllowedPort]);

  const diagnosticsJson = useMemo(
    () =>
      JSON.stringify(
        {
          schemaVersion: 1,
          generatedAt: new Date().toISOString(),
          steps,
          wsUrl,
          backend,
          linkReady,
        },
        null,
        2,
      ),
    [backend, linkReady, steps, wsUrl],
  );

  const copyDiagnostics = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(diagnosticsJson);
      setCopyHint("ok");
      window.setTimeout(() => setCopyHint("idle"), 1600);
    } catch {
      toast.error("Clipboard blocked.");
    }
  }, [diagnosticsJson]);

  const handleOpenPort = useCallback(async () => {
    const target = nextLinkPick ?? comPath.trim();
    if (target.length === 0) {
      toast.error("Select a COM port first.");
      return;
    }
    await openAllowedPort(target);
  }, [comPath, nextLinkPick, openAllowedPort]);

  const handleClosePort = useCallback(async () => {
    await runAction("Close serial port", async () => {
      await releaseOpenSerialPort();
    });
  }, [runAction]);

  const handleRetryHandshake = useCallback(async () => {
    await runAction("Retry BS2 handshake", async () => {
      await openUartPortAndHandshake({ forceFullBringUp: true });
    });
  }, [runAction]);

  const renderStepBody = (id: ConnectionStepId) => {
    switch (id) {
      case "bridge":
        return (
          <div className="space-y-2">
            {ext ? (
              <div className="flex flex-wrap gap-2">
                <TRNButton size="compact" onClick={() => postSerialBridgeStartFromExtension()}>
                  Start bridge
                </TRNButton>
                <TRNButton
                  size="compact"
                  className="border-zinc-600/80 bg-zinc-900/75"
                  onClick={() => postSerialBridgeStopFromExtension()}
                >
                  Stop bridge
                </TRNButton>
              </div>
            ) : (
              <div className="rounded border border-amber-500/30 bg-amber-950/15 px-2 py-1.5 font-mono text-[10px] text-amber-100/90">
                cd extension && npm run start:bridge
              </div>
            )}
            <TRNHintText className="text-[10px] text-zinc-500">
              VS Code: Output → TERNION Serial Bridge. Dev: run bridge in a terminal before step 2.
            </TRNHintText>
          </div>
        );
      case "websocket":
        return (
          <div className="space-y-2">
            {mode === "expert" ? (
              <label className="block text-[10px] text-zinc-500">
                Broker URL
                <input
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-[11px] text-zinc-100"
                  value={wsUrl}
                  readOnly={ext}
                  onChange={(e) => setWsUrl(e.target.value)}
                />
              </label>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <TRNButton size="compact" disabled={wsConnected} onClick={() => void wsConnect()}>
                Connect
              </TRNButton>
              <TRNButton
                size="compact"
                className="border-zinc-600/80 bg-zinc-900/75"
                disabled={!wsConnected}
                onClick={() => void wsDisconnect()}
              >
                Disconnect
              </TRNButton>
            </div>
          </div>
        );
      case "source":
        return (
          <div className="space-y-2">
            <BitstreamTelemetrySourceField />
            <TRNButton
              size="compact"
              disabled={!wsConnected}
              onClick={() => publishTelemetryRoute(backend)}
            >
              Publish route now
            </TRNButton>
          </div>
        );
      case "transport":
        if (backend === "simulator") {
          return (
            <div className="space-y-2">
              <TRNButton
                size="compact"
                prefixIcon={<Play className="h-3 w-3" aria-hidden />}
                onClick={() =>
                  void runAction("Start simulator", async () => {
                    await ensureBitstreamSimulatorReady();
                  })
                }
              >
                Start simulator
              </TRNButton>
              <TRNHintText className="text-[10px] text-zinc-500">
                Requires bitstream-simulator VSIX + bridge. COM stays closed in Simulator mode.
              </TRNHintText>
            </div>
          );
        }
        return (
          <div className="space-y-2">
            <ConnectionUartAllowStrip
              nextLinkPick={nextLinkPick}
              portCount={portOptions.length}
              comOpen={comOpen}
              openComPath={openComPath}
              onOpenAllowedPort={() => void handleOpenAllowedPort()}
              onSwitchToAllowedPort={
                nextLinkPick != null
                  ? () => void handleOpenAllowedPort()
                  : undefined
              }
            />

            {mode === "expert" ? (
              <div className="flex flex-wrap items-end gap-2">
                <label className="min-w-[120px] flex-1 text-[10px] text-zinc-500">
                  COM port (expert override)
                  {portOptions.length > 0 ? (
                    <TRNSelect
                      ariaLabel="COM port"
                      value={comPath}
                      size="sm"
                      options={portOptions.map((p) => ({ value: p, label: p }))}
                      onValueChange={(v) => {
                        setSelectedPath(v);
                        setSerialPath(v);
                      }}
                      className="mt-1 w-full"
                      buttonClassName={`h-7 font-mono ${TRN_GLASS_DROPDOWN_TEXT_CLASS}`}
                    />
                  ) : (
                    <input
                      className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-[11px]"
                      value={comPath}
                      onChange={(e) => {
                        setSelectedPath(e.target.value);
                        setSerialPath(e.target.value);
                      }}
                    />
                  )}
                </label>
                <label className="w-28 text-[10px] text-zinc-500">
                  Baud
                  <TRNSelect
                    ariaLabel="Baud rate"
                    value={String(baudRate || 921600)}
                    size="sm"
                    options={BAUD_OPTIONS.map((b) => ({ value: b, label: b }))}
                    onValueChange={(v) => setBaudRate(Number(v))}
                    className="mt-1 w-full"
                    buttonClassName={`h-7 font-mono ${TRN_GLASS_DROPDOWN_TEXT_CLASS}`}
                  />
                </label>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <TRNButton
                size="compact"
                disabled={portsLoading || !wsConnected}
                onClick={() => void refreshPortList()}
              >
                {portsLoading ? "Listing…" : "Refresh list"}
              </TRNButton>
              {mode === "expert" ? (
                <TRNButton size="compact" disabled={!wsConnected} onClick={() => void handleOpenPort()}>
                  Open selected port
                </TRNButton>
              ) : null}
              <TRNButton
                size="compact"
                className="border-zinc-600/80 bg-zinc-900/75"
                disabled={serialStatus?.isOpen !== true}
                onClick={() => void handleClosePort()}
              >
                Close port
              </TRNButton>
              <TRNButton
                size="compact"
                className="border-zinc-600/80 bg-zinc-900/75"
                onClick={() => openPortAdmin()}
              >
                Port Admin…
              </TRNButton>
            </div>
            <TRNHintText className="text-[10px] text-zinc-500">
              Link uses allowed ports only (Port Admin → Allow). ★ active target wins among allowed.
            </TRNHintText>
          </div>
        );
      case "handshake":
        return (
          <div className="space-y-2">
            <TRNButton
              size="compact"
              disabled={backend === "uart" && serialStatus?.isOpen !== true}
              onClick={() => void handleRetryHandshake()}
            >
              Retry handshake
            </TRNButton>
            <TRNHintText className="text-[10px] text-zinc-500">
              Runs HELLO wait then BS2 PING on UART. Simulator: handshake follows external sim stream.
            </TRNHintText>
          </div>
        );
      case "link":
        return (
          <TRNHintText className="text-[10px] text-zinc-400">
            {linkReady
              ? "Workspace gates are satisfied. Sensor cfg cold sync may still run in the boot bar."
              : "Use Connect all or complete steps above."}
          </TRNHintText>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={scrollRootRef} className="flex min-h-0 flex-col gap-3 text-zinc-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] leading-snug text-zinc-400">
          Bring Bitstream online step by step. Daily use: toolbar <span className="font-medium text-zinc-300">Link</span> only.
        </p>
        <ConnectionModeToggle mode={mode} onChange={setMode} />
      </div>

      <div className="rounded-md border border-zinc-700/60 bg-zinc-900/30 px-2.5 py-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Progress</div>
            <div className="mt-0.5 text-[11px] text-zinc-200">{progressLabel}</div>
          </div>
          {showContinue ? (
            <TRNButton
              size="compact"
              prefixIcon={<Play className="h-3 w-3" aria-hidden />}
              disabled={continueBusy}
              onClick={() => void handleContinue()}
            >
              {continueBusy ? "Running…" : `Continue: ${continueLabel}`}
            </TRNButton>
          ) : null}
        </div>
        <div className="mt-1.5 flex gap-0.5">
          {steps.map((step) => (
            <span
              key={step.id}
              className={`h-1 flex-1 rounded-full ${
                step.status === "ok"
                  ? "bg-emerald-500/70"
                  : step.status === "fail"
                    ? "bg-rose-500/70"
                    : step.status === "active" || step.status === "warn"
                      ? "bg-sky-500/60"
                      : "bg-zinc-700/80"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto scrollbar-hide">
        {steps.map((step, index) => (
          <ConnectionStepCard
            key={step.id}
            step={step}
            stepNumber={index + 1}
            expanded={isExpanded(step.id)}
            onToggle={() => toggleExpanded(step.id)}
          >
            {renderStepBody(step.id)}
          </ConnectionStepCard>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800/80 pt-2">
        <TRNButton
          size="compact"
          prefixIcon={<Copy className="h-3 w-3" aria-hidden />}
          onClick={() => void copyDiagnostics()}
        >
          {copyHint === "ok" ? "Copied" : "Copy diagnostics"}
        </TRNButton>
        <TRNButton
          size="compact"
          prefixIcon={<Play className="h-3 w-3" aria-hidden />}
          onClick={() => void connectAll()}
        >
          Connect all (Link)
        </TRNButton>
        <TRNButton
          size="compact"
          className="border-zinc-600/80 bg-zinc-900/75"
          prefixIcon={<Unplug className="h-3 w-3" aria-hidden />}
          onClick={() => void disconnectAll()}
        >
          Disconnect all
        </TRNButton>
        <TRNHintText className="w-full text-[9px] text-zinc-500">
          Order: close COM → disconnect WebSocket → stop bridge (VSIX). Browser dev: stop bridge in your terminal.
        </TRNHintText>
      </div>
    </div>
  );
}
