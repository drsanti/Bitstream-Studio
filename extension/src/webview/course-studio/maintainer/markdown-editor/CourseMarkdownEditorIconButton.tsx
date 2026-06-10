import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { TRN_HINT_HOVER_DELAY_MS } from "../../../ui/TRN/TRNHintText";
import { TRNTooltip } from "../../../ui/TRN/TRNTooltip";

export function CourseMarkdownEditorIconButton({
  hint,
  ariaLabel,
  selected = false,
  disabled = false,
  className,
  onClick,
  children,
}: {
  hint: ReactNode;
  ariaLabel: string;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <TRNTooltip
      content={hint}
      openDelayMs={TRN_HINT_HOVER_DELAY_MS}
      triggerWrapper="span"
      triggerClassName="inline-flex shrink-0"
      trigger={
        <button
          type="button"
          aria-label={ariaLabel}
          aria-pressed={selected}
          disabled={disabled}
          className={twMerge(
            "course-md-editor-icon-btn",
            selected && "course-md-editor-icon-btn--selected",
            className,
          )}
          onClick={onClick}
        >
          {children}
        </button>
      }
    />
  );
}
