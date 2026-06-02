import { Globe2, Menu } from "lucide-react";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { useBitstreamTelemetrySourceStore } from "../../bitstream-app/state/bitstreamTelemetrySource.store";
import { bitstreamProductVersionLabel } from "../bitstreamProductVersion.js";
import { BitstreamSystemStatusIndicators } from "./BitstreamSystemStatusIndicators";
import { ShellLinkTelemetryCluster } from "./ShellLinkTelemetryCluster";
import { ShellControlDeck } from "./ShellControlDeck";
import {
  BRAND_TITLE_GRADIENT,
  BRAND_WAVE_DURATION_S,
  BRAND_WAVE_GRADIENT_ID,
} from "./bitstreamBrandWaveConstants";
import { TRNIconButton } from "../../ui/TRN/TRNIconButton.js";
import { TRNToolbar, TRNToolbarGroup } from "../../ui/TRN/TRNToolbar.js";

function clearBrandTitleGradientStyles(el: HTMLHeadingElement) {
  el.style.removeProperty("background-image");
  el.style.removeProperty("background-size");
  el.style.removeProperty("background-position");
  el.style.removeProperty("background-clip");
  el.style.removeProperty("-webkit-background-clip");
  el.style.removeProperty("color");
  el.style.removeProperty("-webkit-text-fill-color");
}

function BitstreamToolbarBrandTitle(props: { titleRef?: RefObject<HTMLHeadingElement | null> }) {
  return (
    <div className="flex min-w-0 items-baseline gap-1.5">
      <h1
        ref={props.titleRef}
        className="text-sm font-semibold tracking-tight text-zinc-100"
      >
        TERNION Bitstream
      </h1>
      <span className="shrink-0 text-[10px] font-medium tracking-wide text-zinc-500">
        {bitstreamProductVersionLabel()}
      </span>
    </div>
  );
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
          <BitstreamToolbarBrandTitle />
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
        <BitstreamToolbarBrandTitle titleRef={titleRef} />
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
    onOpenFirmwareLogLevel,
    onOpenWifiPanel,
    onOpenSystemDiagnostics,
  } = props;

  const linkConnected = brokerWsConnected || connected;
  const linkConnecting = brokerWsConnecting || connecting;

  const telemetryBackend = useBitstreamTelemetrySourceStore((s) => s.backend);
  const sourceIsUart = telemetryBackend === "uart";

  const linkStatusLabel = linkConnecting
    ? "Connecting…"
    : linkConnected
      ? "Connected"
      : "Not connected";

  return (
    <header className="m-0 w-full shrink-0 border-b border-zinc-700/80 bg-zinc-950/95 p-0">
      <TRNToolbar
        density="sm"
        tone="default"
        wrap={false}
        className="!grid w-full !min-h-7 !py-0.5 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 border-0 bg-transparent shadow-none"
      >
        <TRNToolbarGroup
          gap="sm"
          align="start"
          className="min-w-0 self-center justify-self-start overflow-x-auto scrollbar-hide"
        >
          <BitstreamToolbarBrand />
        </TRNToolbarGroup>

        <div className="flex min-w-0 justify-center justify-self-center px-1">
          <ShellControlDeck
            linkConnected={linkConnected}
            linkConnecting={linkConnecting}
            sourceIsUart={sourceIsUart}
            linkStatusLabel={linkStatusLabel}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
          />
        </div>

        <TRNToolbarGroup
          gap="xs"
          align="end"
          className="min-w-0 self-center justify-self-end overflow-x-auto scrollbar-hide"
        >
          <ShellLinkTelemetryCluster />
          <BitstreamSystemStatusIndicators
            onOpenFirmwareLogLevel={onOpenFirmwareLogLevel}
            onOpenWifiPanel={onOpenWifiPanel}
            onOpenSystemDiagnostics={onOpenSystemDiagnostics}
          />
          <TRNIconButton
            icon={<Menu size={16} className="text-zinc-400" strokeWidth={2.25} />}
            label="Menu"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-pressed={menuOpen}
            data-bitstream-header-menu="true"
            onClick={onMenuClick}
            className="!h-6 !w-6 !rounded-md !border-0 !bg-transparent shadow-none hover:!bg-zinc-800/50 hover:text-zinc-100"
          />
        </TRNToolbarGroup>
      </TRNToolbar>
    </header>
  );
}
