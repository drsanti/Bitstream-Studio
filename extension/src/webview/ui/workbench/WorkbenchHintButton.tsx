import type { ButtonHTMLAttributes, ReactNode } from "react";
import { TRN_HINT_HOVER_DELAY_MS } from "../TRN/TRNHintText.js";
import { TRNTooltip } from "../TRN/TRNTooltip.js";

type WorkbenchHintButtonProps = {
  hint: ReactNode;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  /** Passed to {@link TRNTooltip} wrapper (e.g. `!p-0` on pane chrome drag handle). */
  triggerClassName?: string;
  /** Root {@link TRNTooltip} container (e.g. negative margin to align drag grip). */
  tooltipClassName?: string;
} & Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "onPointerDown" | "onContextMenu" | "disabled" | "type"
>;

/** Icon/header control with TRN hover hint (no native `title`). */
export function WorkbenchHintButton({
  hint,
  ariaLabel,
  children,
  className,
  triggerClassName,
  tooltipClassName,
  onClick,
  onPointerDown,
  onContextMenu,
  disabled,
  type = "button",
}: WorkbenchHintButtonProps) {
  return (
    <TRNTooltip
      content={hint}
      className={tooltipClassName}
      triggerClassName={triggerClassName}
      trigger={
        <button
          type={type}
          aria-label={ariaLabel}
          className={className}
          disabled={disabled}
          onClick={onClick}
          onPointerDown={onPointerDown}
          onContextMenu={onContextMenu}
        >
          {children}
        </button>
      }
      triggerWrapper="span"
      openDelayMs={TRN_HINT_HOVER_DELAY_MS}
    />
  );
}
