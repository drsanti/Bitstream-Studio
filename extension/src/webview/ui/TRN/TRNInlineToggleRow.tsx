import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import {
  TRN_FIELD_CONTROL_LABEL_CLASS,
  trnFieldControlRowShellClass,
  type TRNFieldControlSize,
  type TRNFieldControlVariant,
} from "./trnFieldControlClasses.js";
import { TRNHintTooltip } from "./TRNHintTooltip.js";
import { TRNToggleSwitch } from "./TRNToggleSwitch.js";

export type TRNInlineToggleRowVariant = TRNFieldControlVariant | "plain";
export type TRNInlineToggleRowSize = TRNFieldControlSize;

/** Default shell preset — matches {@link TRNSelect} `variant="field"` trigger. */
export const TRN_INLINE_TOGGLE_ROW_DEFAULT_VARIANT: TRNInlineToggleRowVariant = "field";
export const TRN_INLINE_TOGGLE_ROW_DEFAULT_SIZE: TRNInlineToggleRowSize = "md";

export type TRNInlineToggleRowProps = {
  label: string;
  /** Hover tooltip on the label ({@link TRNHintTooltip}) — not inline helper copy. */
  hint?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  /** Accessibility label for the switch; defaults to `label`. */
  ariaLabel?: string;
  /** Row chrome preset. Default `field` — same shell as {@link TRNSelect} field trigger. */
  variant?: TRNInlineToggleRowVariant;
  /** Vertical density. Default `md` — same padding as {@link TRNSelect} `size="md"`. */
  size?: TRNInlineToggleRowSize;
  className?: string;
  /** Extra content between the label column and the switch (stays inline). */
  middleSlot?: ReactNode;
};

/**
 * Compact settings row: primary label + optional hint + {@link TRNToggleSwitch}.
 * Default `variant="field"` matches {@link TRNSelect} field trigger chrome.
 */
export function TRNInlineToggleRow(props: TRNInlineToggleRowProps) {
  const {
    label,
    hint,
    checked,
    onCheckedChange,
    disabled = false,
    ariaLabel,
    variant = TRN_INLINE_TOGGLE_ROW_DEFAULT_VARIANT,
    size = TRN_INLINE_TOGGLE_ROW_DEFAULT_SIZE,
    className,
    middleSlot,
  } = props;

  const labelNode = <span className={TRN_FIELD_CONTROL_LABEL_CLASS}>{label}</span>;

  return (
    <div
      className={twMerge(
        "flex w-full items-center justify-between gap-3",
        trnFieldControlRowShellClass({ variant, size }),
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
