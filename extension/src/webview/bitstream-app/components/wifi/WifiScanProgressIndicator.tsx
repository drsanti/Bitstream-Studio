/*******************************************************************************
 * File Name        : WifiScanProgressIndicator.tsx
 *
 * Description      : Animated scan-in-progress motif (Radio + ping) for Wi‑Fi panel.
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.1
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Radio } from "lucide-react";
import { twMerge } from "tailwind-merge";

export type WifiScanProgressSize = "compact" | "default" | "hero";

export function WifiScanProgressIndicator(props: {
  title: string;
  subtitle?: string;
  size?: WifiScanProgressSize;
  className?: string;
}) {
  const { title, subtitle, size = "default", className } = props;

  const iconBox =
    size === "hero" ? "h-16 w-16" : size === "compact" ? "h-8 w-8" : "h-11 w-11";
  const iconSize =
    size === "hero" ? "h-8 w-8" : size === "compact" ? "h-4 w-4" : "h-5 w-5";
  const pingBox =
    size === "hero" ? "h-14 w-14" : size === "compact" ? "h-6 w-6" : "h-9 w-9";
  const pingOuter =
    size === "hero" ? "h-[4.5rem] w-[4.5rem] bg-sky-400/15" : null;

  return (
    <div
      className={twMerge(
        "flex flex-col items-center gap-1.5 text-center",
        size === "hero" ? "py-5" : size === "compact" ? "py-1" : "py-3",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className={twMerge("relative flex items-center justify-center", iconBox)}>
        {pingOuter != null ? (
          <span
            className={twMerge("absolute rounded-full animate-ping", pingOuter)}
            aria-hidden
          />
        ) : null}
        <span
          className={twMerge(
            "absolute rounded-full bg-sky-400/25 animate-ping",
            pingBox,
          )}
          aria-hidden
        />
        <Radio
          className={twMerge(iconSize, "relative z-[1] text-sky-300/95 animate-pulse")}
          aria-hidden
        />
      </div>
      <p
        className={twMerge(
          "font-medium text-sky-100/95",
          size === "hero" ? "text-sm" : size === "compact" ? "text-[11px]" : "text-xs",
        )}
      >
        {title}
      </p>
      {subtitle != null && subtitle.length > 0 ? (
        <p
          className={twMerge(
            "max-w-[20rem] leading-snug text-zinc-500",
            size === "hero" ? "text-[11px]" : size === "compact" ? "text-[10px]" : "text-[11px]",
          )}
        >
          {subtitle}
        </p>
      ) : null}
      {size === "hero" ? (
        <p className="text-[10px] tracking-[0.35em] text-zinc-600" aria-hidden>
          · · · · ·
        </p>
      ) : null}
    </div>
  );
}
