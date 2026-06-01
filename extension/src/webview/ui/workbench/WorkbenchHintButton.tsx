import type { ButtonHTMLAttributes, ReactNode } from "react";
import { TRN_HINT_HOVER_DELAY_MS } from "../TRN/TRNHintText.js";
import { TRNTooltip } from "../TRN/TRNTooltip.js";

type WorkbenchHintButtonProps = {
  hint: ReactNode;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
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
  onClick,
  onPointerDown,
  onContextMenu,
  disabled,
  type = "button",
}: WorkbenchHintButtonProps) {
  return (
    <TRNTooltip
      content={hint}
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
