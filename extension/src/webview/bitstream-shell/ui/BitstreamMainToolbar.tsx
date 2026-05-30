import {
  Activity,
  Globe2,
  Menu,
  MessageSquareText,
  Play,
  Plug,
  RefreshCcw,
  ScrollText,
  Unplug,
  Workflow,
} from "lucide-react";
import { ensureBitstreamSimulatorReady } from "../../bitstream-app/bridge/requestBitstreamSimulatorHost";
import { isVsCodeExtensionWebview } from "../../isVsCodeExtensionWebview";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useSensorStudioAssistantUiStore } from "../../sensor-studio/state/sensorStudioAssistantUi.store";
import { useBitstreamTelemetrySourceStore } from "../../bitstream-app/state/bitstreamTelemetrySource.store";
import { useBitstreamWorkspaceModeStore } from "../../bitstream-app/state/bitstreamWorkspaceMode.store";
import { BitstreamSystemStatusIndicators } from "./BitstreamSystemStatusIndicators";
import {
  BRAND_TITLE_GRADIENT,
  BRAND_WAVE_DURATION_S,
  BRAND_WAVE_GRADIENT_ID,
} from "./bitstreamBrandWaveConstants";
import { TRNIconButton } from "../../ui/TRN/TRNIconButton.js";
import { TRNButton } from "../../ui/TRN/TRNButton";
import { TRNToolbar, TRNToolbarGroup } from "../../ui/TRN/TRNToolbar.js";
import { TRNTooltip } from "../../ui/TRN/TRNTooltip.js";
import { BitstreamTelemetrySourceField } from "./BitstreamTelemetrySourceField";

function clearBrandTitleGradientStyles(el: HTMLHeadingElement) {
  el.style.removeProperty("background-image");
  el.style.removeProperty("background-size");
  el.style.removeProperty("background-position");
  el.style.removeProperty("background-clip");
  el.style.removeProperty("-webkit-background-clip");
  el.style.removeProperty("color");
  el.style.removeProperty("-webkit-text-fill-color");
}

/**
 * Globe (3D world) + title share one GSAP phase: text uses sliding background clip;
 * icon stroke uses the same palette via SVG `linearGradient` + `gradientTransform`.
 */
function BitstreamToolbarBrand() {
  const [motionOk, setMotionOk] = useState<boolean | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const gradientRef = useRef<SVGLinearGradientElement>(null);

  useLayoutEffect(() => {
    setMotionOk(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useLayoutEffect(() => {
    if (motionOk !== true) {
      return;
    }
    const title = titleRef.current;
    const gradient = gradientRef.current;
    if (title == null || gradient == null) {
      return;
    }

    title.style.backgroundImage = BRAND_TITLE_GRADIENT;
    title.style.backgroundSize = "200% 100%";
    title.style.backgroundPosition = "0% 50%";
    title.style.backgroundClip = "text";
    title.style.setProperty("-webkit-background-clip", "text");
    title.style.color = "transparent";
    title.style.setProperty("-webkit-text-fill-color", "transparent");
    gradient.setAttribute("gradientTransform", "translate(0, 0)");

    const durationMs = BRAND_WAVE_DURATION_S * 1000;
    let rafId = 0;

    const tick = (now: number) => {
      const t = (now % durationMs) / durationMs;
      // 90deg tiled gradient + 200% width: 0% and 100% x-alignment show twin waves → seamless wrap.
      title.style.backgroundPosition = `${t * 100}% 50%`;
      gradient.setAttribute("gradientTransform", `translate(${t * 0.5}, 0)`);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      clearBrandTitleGradientStyles(title);
      gradient.removeAttribute("gradientTransform");
    };
  }, [motionOk]);

  const globeProps = {
    className: "h-4 w-4 shrink-0",
    strokeWidth: 2.25,
    "aria-hidden": true as const,
  };

  if (motionOk !== true) {
    return (
      <>
        <span className="inline-flex text-zinc-400">
          <Globe2 {...globeProps} />
        </span>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-zinc-100">
            TESAIoT Digital Twin
          </h1>
        </div>
      </>
    );
  }

  const strokeUrl = `url(#${BRAND_WAVE_GRADIENT_ID})`;

  return (
    <>
      <span className="inline-flex shrink-0 items-center justify-center">
        <svg width="0" height="0" aria-hidden className="size-0 overflow-hidden">
          <defs>
            <linearGradient
              ref={gradientRef}
              id={BRAND_WAVE_GRADIENT_ID}
              gradientUnits="objectBoundingBox"
              x1="0"
              y1="0.5"
              x2="1"
              y2="0.5"
            >
              <stop offset="0%" stopColor="#a1a1aa" />
              <stop offset="9%" stopColor="#22d3ee" />
              <stop offset="21%" stopColor="#c084fc" />
              <stop offset="33%" stopColor="#4ade80" />
              <stop offset="44%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#a1a1aa" />
              <stop offset="59%" stopColor="#22d3ee" />
              <stop offset="71%" stopColor="#c084fc" />
              <stop offset="83%" stopColor="#4ade80" />
              <stop offset="94%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#a1a1aa" />
            </linearGradient>
          </defs>
        </svg>
        <Globe2 {...globeProps} style={{ stroke: strokeUrl }} />
      </span>
      <div>
        <h1
          ref={titleRef}
          className="text-sm font-semibold tracking-tight text-zinc-100"
        >
          TESAIoT Digital Twin
        </h1>
      </div>
    </>
  );
}

export function BitstreamMainToolbar(props: {
  menuOpen: boolean;
  onMenuClick: () => void;
  /** App session connected (connectSession); may lag WS on refresh. */
  connected?: boolean;
  connecting?: boolean;
  /** Live WebSocket to broker — drives Link icon on page load. */
  brokerWsConnected?: boolean;
  brokerWsConnecting?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onOpenSystemLogs?: () => void;
  onOpenFirmwareLogLevel?: () => void;
  onOpenWifiPanel?: () => void;
  onOpenSystemDiagnostics?: () => void;
}) {
  const {
    menuOpen,
    onMenuClick,
    connected = false,
    connecting = false,
    brokerWsConnected = false,
    brokerWsConnecting = false,
    onConnect,
    onDisconnect,
    onOpenSystemLogs,
    onOpenFirmwareLogLevel,
    onOpenWifiPanel,
    onOpenSystemDiagnostics,
  } = props;

  const linkConnected = brokerWsConnected || connected;
  const linkConnecting = brokerWsConnecting || connecting;

  const telemetryBackend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const loopbackAvailable = useBitstreamTelemetrySourceStore((s) => s.loopbackAvailable);
  const sourceIsUart = telemetryBackend === "uart";
  const showStartSimulator =
    telemetryBackend === "simulator" &&
    !loopbackAvailable &&
    isVsCodeExtensionWebview();

  const [simulatorStartBusy, setSimulatorStartBusy] = useState(false);
  const startSimulator = useCallback(async () =>
  {
    if (simulatorStartBusy)
    {
      return;
    }
    setSimulatorStartBusy(true);
    try
    {
      await ensureBitstreamSimulatorReady();
    }
    finally
    {
      setSimulatorStartBusy(false);
    }
  }, [simulatorStartBusy]);

  const linkStatusLabel = linkConnecting
    ? "Connecting…"
    : linkConnected
      ? "Connected"
      : "Not connected";

  const workspace = useBitstreamWorkspaceModeStore((s) => s.workspace);
  const setWorkspace = useBitstreamWorkspaceModeStore((s) => s.setWorkspace);

  const assistantOpen = useSensorStudioAssistantUiStore((s) => s.assistantOpen);
  const toggleAssistant = useSensorStudioAssistantUiStore((s) => s.toggleAssistant);

  const [devRestartBusy, setDevRestartBusy] = useState(false);
  const devRestart = useCallback(async () => {
    if (!import.meta.env.DEV) {
      return;
    }
    if (devRestartBusy) {
      return;
    }
    setDevRestartBusy(true);
    try {
      await fetch("http://127.0.0.1:9910/restart", { method: "POST" });
    } finally {
      setTimeout(() => setDevRestartBusy(false), 800);
    }
  }, [devRestartBusy]);

  return (
    <header className="m-0 w-full shrink-0 border-b border-zinc-700/80 bg-zinc-950/95 p-0">
      <TRNToolbar
        tone="default"
        wrap
        className="flex flex-row items-center justify-between gap-y-1 border-0 bg-transparent shadow-none"
      >
        <TRNToolbarGroup
          gap="sm"
          align="start"
          className="min-w-0 flex-1 overflow-x-auto scrollbar-hide"
        >
          <BitstreamToolbarBrand />
          <div
            className="ml-2 inline-flex items-center rounded-md border border-zinc-700/80 bg-zinc-900/60 p-0.5"
            role="group"
            aria-label="Workspace"
          >
            <button
              type="button"
              className={
                workspace === "sensor-telemetry"
                  ? "inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium bg-zinc-700/90 text-zinc-50"
                  : "inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200"
              }
              aria-pressed={workspace === "sensor-telemetry"}
              title="Sensor Telemetry — configuration + live deck"
              onClick={() => setWorkspace("sensor-telemetry")}
            >
              <Activity
                className={
                  workspace === "sensor-telemetry"
                    ? "h-3.5 w-3.5 shrink-0 text-emerald-200/95"
                    : "h-3.5 w-3.5 shrink-0 opacity-80"
                }
                strokeWidth={2.25}
                aria-hidden
              />
              Sensor Telemetry
            </button>
            <button
              type="button"
              className={
                workspace === "sensor-studio"
                  ? "inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium bg-zinc-700/90 text-zinc-50"
                  : "inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200"
              }
              aria-pressed={workspace === "sensor-studio"}
              title="Sensor Studio — flow editor workspace"
              onClick={() => setWorkspace("sensor-studio")}
            >
              <Workflow
                className={
                  workspace === "sensor-studio"
                    ? "h-3.5 w-3.5 shrink-0 text-violet-200/95"
                    : "h-3.5 w-3.5 shrink-0 opacity-80"
                }
                strokeWidth={2.25}
                aria-hidden
              />
              Sensor Studio
            </button>
          </div>
          <div className="ml-2 inline-flex items-center gap-2">
            <BitstreamTelemetrySourceField />
            {showStartSimulator ? (
              <TRNIconButton
                icon={
                  <Play
                    size={16}
                    className="text-violet-200/90"
                    strokeWidth={2.25}
                  />
                }
                label={simulatorStartBusy ? "Starting simulator…" : "Start simulator"}
                nativeTitle={false}
                disabled={simulatorStartBusy}
                onClick={() => void startSimulator()}
                className="border border-violet-700/60 bg-violet-950/25 text-zinc-200 hover:bg-violet-900/15"
              />
            ) : null}
            <div
              className="inline-flex shrink-0 items-center gap-1.5 border-l border-zinc-700/80 pl-2"
              role="group"
              aria-label="Connection to board"
            >
              <span className="text-[10px] font-medium tracking-wide text-zinc-500 uppercase">
                Link
              </span>
              <TRNTooltip
                placement="bottom-end"
                openDelayMs={650}
                disableHoverFx
                triggerWrapper="span"
                content={
                  <div className="min-w-0 max-w-xs whitespace-pre-line text-left">
                    <div className="font-semibold text-zinc-100">Connection</div>
                    <div className="text-zinc-300">Status: {linkStatusLabel}</div>
                    {linkConnected ? (
                      <div className="mt-1 text-zinc-400">
                        You are linked to the TESAIoT service on this computer. Sensor data and
                        settings can flow between this window and your board.
                      </div>
                    ) : (
                      <div className="mt-1 text-zinc-400">
                        Press Connect to start. The service on this computer must be running (start
                        it from the project scripts if the link stays off).
                      </div>
                    )}
                    <div className="mt-1 text-zinc-500">
                      {sourceIsUart
                        ? linkConnected
                          ? "Disconnect releases the USB serial port so other apps can use it. With Bitstream selected, the app finds your port and checks the board after you connect."
                          : "Bitstream: plug in the board via USB, then Connect. The app will pick the port and finish setup automatically."
                        : linkConnected
                          ? "Simulator mode uses sample data on this computer—no USB cable required. Disconnect when you want to stop."
                          : "Simulator mode uses sample data on this computer—no USB cable required."}
                    </div>
                  </div>
                }
                trigger={
                  <TRNIconButton
                    nativeTitle={false}
                    icon={
                    linkConnecting ? (
                      <RefreshCcw
                        size={16}
                        className="text-amber-200/90"
                        strokeWidth={2.25}
                      />
                    ) : linkConnected ? (
                      <Unplug
                        size={16}
                        className="text-rose-200/90"
                        strokeWidth={2.25}
                      />
                    ) : (
                      <Plug
                        size={16}
                        className="text-emerald-200/90"
                        strokeWidth={2.25}
                      />
                    )
                  }
                  label={
                    linkConnecting
                      ? "Connecting…"
                      : linkConnected
                        ? "Disconnect"
                        : "Connect"
                  }
                  aria-pressed={linkConnected || linkConnecting}
                  onClick={() => {
                    if (linkConnected || linkConnecting) {
                      onDisconnect?.();
                    } else {
                      onConnect?.();
                    }
                  }}
                  disabled={
                    linkConnected || linkConnecting ? !onDisconnect : !onConnect
                  }
                  className={
                    linkConnecting
                        ? "border border-amber-700/60 bg-amber-950/25 text-zinc-200 hover:bg-amber-900/15"
                      : linkConnected
                        ? "border border-rose-700/60 bg-rose-950/25 text-zinc-200 hover:bg-rose-900/15"
                        : "border border-emerald-700/60 bg-emerald-950/20 text-zinc-200 hover:bg-emerald-900/15"
                    }
                  />
                }
              />
            </div>
          </div>
        </TRNToolbarGroup>

        <BitstreamSystemStatusIndicators
          onOpenFirmwareLogLevel={onOpenFirmwareLogLevel}
          onOpenWifiPanel={onOpenWifiPanel}
          onOpenSystemDiagnostics={onOpenSystemDiagnostics}
        />

        <TRNToolbarGroup gap="xs" align="end">
          {import.meta.env.DEV ? (
            <TRNIconButton
              icon={
                <RefreshCcw
                  size={16}
                  className={devRestartBusy ? "text-amber-200/90" : "text-zinc-400 hover:text-zinc-100"}
                  strokeWidth={2.25}
                />
              }
              label={devRestartBusy ? "Restarting dev server…" : "Restart dev server"}
              onClick={devRestart}
              disabled={devRestartBusy}
              className="border border-zinc-700/80 bg-zinc-900/75 text-zinc-200 hover:bg-zinc-800/80"
            />
          ) : null}
          <TRNIconButton
            icon={<ScrollText size={16} className="text-zinc-400 hover:text-zinc-100" strokeWidth={2.25} />}
            label="System logs"
            aria-haspopup="dialog"
            onClick={onOpenSystemLogs}
            disabled={!onOpenSystemLogs}
            className="border border-zinc-700/80 bg-zinc-900/75 text-zinc-200 hover:bg-zinc-800/80"
          />
          <TRNIconButton
            icon={<Menu size={16} className="text-zinc-400 hover:text-zinc-100" strokeWidth={2.25} />}
            label="Menu"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-pressed={menuOpen}
            data-bitstream-header-menu="true"
            onClick={onMenuClick}
            className="border border-zinc-700/80 bg-zinc-900/75 text-zinc-200 hover:bg-zinc-800/80"
          />
        </TRNToolbarGroup>
      </TRNToolbar>
    </header>
  );
}
