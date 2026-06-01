import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { TRNHintTooltip } from "./TRNHintTooltip.js";
import { TRNToggleSwitch } from "./TRNToggleSwitch.js";

export type TRNInlineToggleRowProps = {
  label: string;
  /** Hover tooltip on the label ({@link TRNHintTooltip}) — not inline helper copy. */
  hint?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  /** Accessibility label for the switch; defaults to `label`. */
  ariaLabel?: string;
  className?: string;
  /** Extra content between the label column and the switch (stays inline). */
  middleSlot?: ReactNode;
};

/**
 * Compact settings row: primary label + optional hint + {@link TRNToggleSwitch}.
 * Visual shell matches {@link TRNSettingRow} (zinc border / muted panel).
 */
export function TRNInlineToggleRow(props: TRNInlineToggleRowProps) {
  const {
    label,
    hint,
    checked,
    onCheckedChange,
    disabled = false,
    ariaLabel,
    className,
    middleSlot,
  } = props;

  const labelNode = (
    <span className="inline-flex min-h-5 items-center text-xs font-semibold leading-none text-zinc-100">
      {label}
    </span>
  );

  return (
    <div
      className={twMerge(
        "flex min-h-9.5 items-center justify-between gap-3 rounded-md border border-zinc-700/80 bg-zinc-950/75 p-2 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center">
        {hint != null && hint.length > 0 ? (
          <TRNHintTooltip
            className="inline-flex"
            trigger={
              <span className="inline-flex w-fit cursor-help items-center">{labelNode}</span>
            }
            content={hint}
            triggerAriaLabel={`About ${label}`}
            placement="top-start"
            triggerWrapper="span"
            triggerClassName="!p-0"
            wide={hint.length > 120}
          />
        ) : (
          labelNode
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {middleSlot}
        <TRNToggleSwitch
          checked={checked}
          disabled={disabled}
          ariaLabel={ariaLabel ?? label}
          onCheckedChange={onCheckedChange}
        />
      </div>
    </div>
  );
}
