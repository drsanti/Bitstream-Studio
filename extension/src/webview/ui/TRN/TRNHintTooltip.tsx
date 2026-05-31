import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import {
  TRN_HINT_HOVER_DELAY_MS,
  TRN_HINT_POPOVER_PANEL_CLASS,
} from "./TRNHintText.js";
import { TRNTooltip, type TRNTooltipPlacement } from "./TRNTooltip.js";

export type TRNHintTooltipProps = {
  /** Icon or compact control (e.g. HelpCircle). */
  trigger: ReactNode;
  /** Hint body — plain text or light markup; use `whitespace-pre-wrap` via content wrapper. */
  content: ReactNode;
  placement?: TRNTooltipPlacement;
  className?: string;
  panelClassName?: string;
  triggerClassName?: string;
  triggerAriaLabel?: string;
  /** Wider cap for long documentation (default matches standard hint width). */
  wide?: boolean;
  /** Use `"span"` when the trigger lives inside another button (e.g. collapsible section header). */
  triggerWrapper?: "button" | "span";
};

/**
 * Documentation-style hint: **1s hover delay** (see {@link TRN_HINT_HOVER_DELAY_MS}) and shared
 * professional panel chrome ({@link TRN_HINT_POPOVER_PANEL_CLASS}). Prefer this over ad-hoc
 * `TRNTooltip` for Global Directories, asset paths, and similar operator copy.
 */
export function TRNHintTooltip(props: TRNHintTooltipProps) {
  const {
    trigger,
    content,
    placement = "top-end",
    className = "",
    panelClassName = "",
    triggerClassName = "",
    triggerAriaLabel,
    wide = false,
    triggerWrapper = "button",
  } = props;

  return (
    <TRNTooltip
      className={className}
      triggerClassName={triggerClassName}
      triggerAriaLabel={triggerAriaLabel}
      triggerWrapper={triggerWrapper}
      placement={placement}
      openDelayMs={TRN_HINT_HOVER_DELAY_MS}
      disableHoverFx
      trigger={trigger}
      content={
        <div className="whitespace-pre-wrap text-left text-[11px] leading-relaxed text-zinc-100">
          {content}
        </div>
      }
      panelClassName={twMerge(
        TRN_HINT_POPOVER_PANEL_CLASS,
        wide ? "max-w-[min(420px,calc(100vw-32px))]" : "max-w-[min(320px,calc(100vw-48px))]",
        panelClassName,
      )}
    />
  );
}
