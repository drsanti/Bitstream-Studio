import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

/** Default hover delay before showing contextual hint popovers (documentation-style hints). */
export const TRN_HINT_HOVER_DELAY_MS = 1000;

/**
 * Shared panel chrome for hint popovers.
 * Use with {@link TRNTooltip} `panelClassName` or inline label-adjacent tooltips so copy-heavy UIs stay consistent.
 */
export const TRN_HINT_POPOVER_PANEL_CLASS =
  "rounded-md border border-zinc-700/80 bg-zinc-900/96 px-2.5 py-2 text-xs leading-relaxed text-zinc-100 shadow-lg ring-1 ring-black/35";

export type TRNHintTextTone = "muted" | "info" | "warn";

export function TRNHintText(props: {
  children: ReactNode;
  className?: string;
  tone?: TRNHintTextTone;
}) {
  const { children, className, tone = "muted" } = props;
  const base =
    tone === "warn"
      ? "text-amber-200/85"
      : tone === "info"
        ? "text-sky-200/85"
        : "text-zinc-400";
  return (
    <p className={twMerge("text-[11px] leading-relaxed", base, className)}>{children}</p>
  );
}

