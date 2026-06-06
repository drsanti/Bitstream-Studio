import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { TRN_DENSE_FIELD_SHELL } from "./trn-dense-field-shell.js";
import { TRNScrubFieldBadge, type TRNScrubFieldBadgeSpec } from "./TRNScrubFieldBadge.js";
import {
  TRNScrubNumberField,
  type TRNScrubNumberFieldAppearance,
  type TRNScrubNumberFieldInteraction,
} from "./TRNScrubNumberField.js";

export type TRNBadgedScrubNumberFieldDensity = "compact" | "full";

export type TRNBadgedScrubNumberFieldProps = {
  badge: TRNScrubFieldBadgeSpec;
  ariaLabel: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  fractionDigits?: number;
  disabled?: boolean;
  locked?: boolean;
  onLockedChange?: (locked: boolean) => void;
  className?: string;
  suffix?: ReactNode;
  density?: TRNBadgedScrubNumberFieldDensity;
  settingsKey?: string;
  appearance?: TRNScrubNumberFieldAppearance;
  interaction?: TRNScrubNumberFieldInteraction;
  defaultValue?: number;
  onClear?: () => void;
  onReset?: () => void;
  size?: "sm" | "md";
};

export const TRN_BADGED_SCRUB_COMPACT_APPEARANCE: TRNScrubNumberFieldAppearance = {
  variant: "full",
  stepButtonsVisibility: "hover",
  lockIconVisibility: "always",
  resetIconVisibility: "hidden",
  clearIconVisibility: "hidden",
};

export const TRN_BADGED_SCRUB_FULL_APPEARANCE: TRNScrubNumberFieldAppearance = {
  variant: "full",
  stepButtonsVisibility: "always",
  lockIconVisibility: "always",
  resetIconVisibility: "hover",
  clearIconVisibility: "hidden",
};

/**
 * Leading badge + {@link TRNScrubNumberField} in one dense shell — layout W/H, Vector3 axes, etc.
 */
export function TRNBadgedScrubNumberField(props: TRNBadgedScrubNumberFieldProps) {
  const {
    badge,
    ariaLabel,
    value,
    onChange,
    min,
    max,
    step,
    fractionDigits,
    disabled = false,
    locked,
    onLockedChange,
    className,
    suffix,
    density = "compact",
    settingsKey,
    appearance,
    interaction,
    defaultValue,
    onClear,
    onReset,
    size = "md",
  } = props;

  const resolvedAppearance =
    appearance ??
    (settingsKey != null
      ? undefined
      : density === "full"
        ? TRN_BADGED_SCRUB_FULL_APPEARANCE
        : TRN_BADGED_SCRUB_COMPACT_APPEARANCE);

  const rowLocked = locked === true;

  return (
    <div
      className={twMerge(
        "group/trnScrubField",
        TRN_DENSE_FIELD_SHELL,
        disabled ? "opacity-60" : "",
        rowLocked && !disabled ? "opacity-80" : "",
        className,
      )}
    >
      <TRNScrubFieldBadge badge={badge} />
      <TRNScrubNumberField
        embedded
        ariaLabel={ariaLabel}
        className="min-w-0 flex-1"
        inputClassName={size === "sm" ? "text-[10px]" : "text-[11px]"}
        value={value}
        step={step}
        min={min}
        max={max}
        fractionDigits={fractionDigits}
        disabled={disabled}
        locked={locked}
        onLockedChange={onLockedChange}
        settingsKey={settingsKey}
        appearance={resolvedAppearance}
        interaction={interaction}
        defaultValue={defaultValue}
        onClear={onClear}
        onReset={onReset}
        size={size}
        onChange={(next) => {
          if (rowLocked) {
            return;
          }
          onChange(next);
        }}
      />
      {suffix != null ? (
        <span className="shrink-0 pl-0.5 text-[10px] tracking-tight text-zinc-500">{suffix}</span>
      ) : null}
    </div>
  );
}
