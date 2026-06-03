/*******************************************************************************
 * File Name        : WifiLinkProgressIcon.tsx
 *
 * Description      : Compact link-pulse animation for Connection status tile.
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.0
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Radio, Wifi, type LucideIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

export type WifiLinkProgressMotif = "connecting" | "scanning";

const MOTIF_CONFIG: Record<
  WifiLinkProgressMotif,
  { Icon: LucideIcon; iconClass: string; pingInner: string; pingOuter: string }
> = {
  connecting: {
    Icon: Wifi,
    iconClass: "text-amber-300/95",
    pingInner: "bg-amber-400/30",
    pingOuter: "bg-sky-400/15",
  },
  scanning: {
    Icon: Radio,
    iconClass: "text-violet-300/95",
    pingInner: "bg-violet-400/28",
    pingOuter: "bg-sky-400/12",
  },
};

/** Ping rings + pulsing glyph sized for the Status tab Connection tile. */
export function WifiLinkProgressIcon(props: {
  motif: WifiLinkProgressMotif;
  className?: string;
  label?: string;
}) {
  const { motif, className, label } = props;
  const cfg = MOTIF_CONFIG[motif];
  const Icon = cfg.Icon;

  return (
    <div
      className={twMerge(
        "relative flex h-7 w-7 shrink-0 items-center justify-center",
        className,
      )}
      role="img"
      aria-label={label}
    >
      <span
        className={twMerge("absolute h-6 w-6 rounded-full animate-ping", cfg.pingOuter)}
        aria-hidden
      />
      <span
        className={twMerge("absolute h-5 w-5 rounded-full animate-ping", cfg.pingInner)}
        aria-hidden
      />
      <Icon
        className={twMerge("relative z-1 h-4 w-4 animate-pulse", cfg.iconClass)}
        aria-hidden
      />
    </div>
  );
}
