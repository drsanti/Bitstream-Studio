/*******************************************************************************
 * File Name : LandingCardIcon.tsx
 *
 * Description : Icon shell for landing cards — TRNFloatingNotice-style pop and
 *               ring pulse on card hover.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

export type LandingCardAccent = "sky" | "emerald" | "violet";

export type LandingCardIconProps = {
  icon: LucideIcon;
  accent: LandingCardAccent;
  shellClassName?: string;
  iconClassName?: string;
};

const ACCENT_ICON_SHELL: Record<LandingCardAccent, string> = {
  sky: "border-sky-400/40 bg-sky-500/15 text-sky-200 shadow-[0_0_24px_rgba(56,189,248,0.25)]",
  emerald:
    "border-emerald-400/40 bg-emerald-500/15 text-emerald-200 shadow-[0_0_24px_rgba(52,211,153,0.25)]",
  violet:
    "border-violet-400/40 bg-violet-500/15 text-violet-200 shadow-[0_0_24px_rgba(167,139,250,0.25)]",
};

/** Ring pulse color (matches TRNFloatingNotice --trn-floating-notice-ring pattern). */
const ACCENT_ICON_RING: Record<LandingCardAccent, string> = {
  sky: "rgba(56, 189, 248, 0.35)",
  emerald: "rgba(52, 211, 153, 0.35)",
  violet: "rgba(167, 139, 250, 0.35)",
};

/**
 * Circular icon badge; animates on parent `.webview-launcher-card` hover.
 */
export function LandingCardIcon({
  icon: Icon,
  accent,
  shellClassName = "h-14 w-14",
  iconClassName = "h-7 w-7",
}: LandingCardIconProps)
{
  const ringStyle = {
    "--launcher-icon-ring": ACCENT_ICON_RING[accent],
  } as CSSProperties;

  return (
    <span
      className={[
        "webview-launcher-card__icon-shell flex shrink-0 items-center justify-center rounded-full border",
        shellClassName,
        ACCENT_ICON_SHELL[accent],
      ].join(" ")}
      style={ringStyle}
      aria-hidden
    >
      <span className="webview-launcher-card__icon-inner flex items-center justify-center">
        <Icon className={iconClassName} strokeWidth={1.75} aria-hidden />
      </span>
    </span>
  );
}
