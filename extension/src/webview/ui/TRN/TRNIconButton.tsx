import type { ButtonHTMLAttributes, ReactNode } from "react";
import { TRN_HINT_HOVER_DELAY_MS, TRN_HINT_POPOVER_PANEL_CLASS } from "./TRNHintText.js";
import { TRNTooltip, type TRNTooltipPlacement } from "./TRNTooltip.js";

type TRNIconButtonProps = {
  icon: ReactNode;
  label: string;
  className?: string;
  /** When false, omit native `title` (use with {@link TRNTooltip} / `hint`). Default true. */
  nativeTitle?: boolean;
  /** Rich hover hint (no native `title`). */
  hint?: ReactNode;
  hintPlacement?: TRNTooltipPlacement;
  hintDelayMs?: number;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function TRNIconButton({
  icon,
  label,
  className = "",
  nativeTitle = true,
  hint,
  hintPlacement = "bottom",
  hintDelayMs = TRN_HINT_HOVER_DELAY_MS,
  disabled,
  ...props
}: TRNIconButtonProps) {
  const useNativeTitle = nativeTitle && hint == null;

  const button = (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      {...(useNativeTitle ? { title: label } : {})}
      className={
        "inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-700/80 " +
        "bg-zinc-900/80 p-0 text-zinc-100 transition-colors hover:bg-zinc-800/70 " +
        "disabled:cursor-not-allowed disabled:opacity-50 " +
        className
      }
      {...props}
    >
      {icon}
    </button>
  );

  if (hint == null) {
    return button;
  }

  return (
    <TRNTooltip
      className="pointer-events-auto inline-flex shrink-0"
      placement={hintPlacement}
      openDelayMs={hintDelayMs}
      disableHoverFx
      triggerWrapper="span"
      triggerClassName="inline-flex"
      triggerAriaLabel={label}
      content={
        <span className="text-[11px] leading-relaxed text-zinc-100">{hint}</span>
      }
      panelClassName={TRN_HINT_POPOVER_PANEL_CLASS}
      trigger={button}
    />
  );
}
