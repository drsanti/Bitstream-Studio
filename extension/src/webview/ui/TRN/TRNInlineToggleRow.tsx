import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { TRNHintText } from "./TRNHintText.js";
import { TRNToggleSwitch } from "./TRNToggleSwitch.js";

export type TRNInlineToggleRowProps = {
  label: string;
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

  return (
    <div
      className={twMerge(
        "flex items-start justify-between gap-3 rounded-xl border border-zinc-700/80 bg-zinc-950/75 p-3 backdrop-blur-sm",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-zinc-100">{label}</div>
        {hint != null && hint.length > 0 ? (
          <TRNHintText className="mt-1">{hint}</TRNHintText>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
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
