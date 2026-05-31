import { twMerge } from "tailwind-merge";
import { TrnLiveDataPulseIcon } from "@/ui/TRN/TrnLiveDataPulseIcon";
import { getCatalogLucideIcon } from "./catalog-lucide-icons";
import {
  PALETTE_LIVE_ICON_PULSE_PEAK_HEX,
  PALETTE_LIVE_ICON_PULSE_THROTTLE_MS,
} from "./palette-icon-pulse";

export type PaletteCatalogIconProps = {
  icon: string;
  className?: string;
  /** Live stream tone for static icon tint. */
  livePulse?: "live" | "idle" | null;
  /** Changes when live telemetry updates — drives GSAP pulse (live rows only). */
  pulseTriggerKey?: string | null;
};

export function PaletteCatalogIcon(props: PaletteCatalogIconProps) {
  const { icon, className, livePulse = null, pulseTriggerKey = null } = props;
  const Icon = getCatalogLucideIcon(icon);
  const toneClass =
    livePulse === "live"
      ? "text-emerald-400/90"
      : livePulse === "idle"
        ? "text-zinc-500"
        : "text-zinc-400";

  const iconEl = (
    <Icon
      className={twMerge("h-3.5 w-3.5 shrink-0", toneClass, className)}
      aria-hidden
    />
  );

  if (livePulse == null && pulseTriggerKey == null) {
    return iconEl;
  }

  return (
    <TrnLiveDataPulseIcon
      className="inline-flex shrink-0 origin-center"
      enabled={livePulse === "live" && pulseTriggerKey != null}
      pulseTriggerKey={pulseTriggerKey}
      throttleMs={PALETTE_LIVE_ICON_PULSE_THROTTLE_MS}
      peakColorHex={PALETTE_LIVE_ICON_PULSE_PEAK_HEX}
      intensityPreset="normal"
      animationPreset="smooth"
      colorAnimationEnabled
    >
      {iconEl}
    </TrnLiveDataPulseIcon>
  );
}
