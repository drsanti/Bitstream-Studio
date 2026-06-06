import { twMerge } from "tailwind-merge";
import { TRNButton } from "./TRNButton.js";
import {
  TRNScrubNumberField,
  type TRNScrubNumberFieldAppearance,
  type TRNScrubNumberFieldInteraction,
} from "./TRNScrubNumberField.js";

export type TRNOptionalScrubNumberFieldProps = {
  ariaLabel: string;
  value: number | undefined;
  onChange: (next: number | null) => void;
  step?: number;
  /** Value seeded when activating from the empty state; also used as reset target. */
  seedValue?: number;
  /** Alias for `seedValue` when naming reset semantics explicitly. */
  resetValue?: number;
  disabled?: boolean;
  className?: string;
  min?: number;
  max?: number;
  fractionDigits?: number;
  emptyLabel?: string;
  settingsKey?: string;
  appearance?: TRNScrubNumberFieldAppearance;
  interaction?: TRNScrubNumberFieldInteraction;
};

const DEFAULT_OPTIONAL_APPEARANCE: TRNScrubNumberFieldAppearance = {
  variant: "full",
  stepButtonsVisibility: "always",
  lockIconVisibility: "always",
  resetIconVisibility: "always",
  clearIconVisibility: "always",
};

const DEFAULT_OPTIONAL_INTERACTION: TRNScrubNumberFieldInteraction = {
  pointerScrubEnabled: true,
  wheelEnabled: true,
  wheelBoundedMode: "span-percent",
};

const EMPTY_SHELL_CLASS =
  "w-full border-zinc-700/80 bg-zinc-950/45 text-zinc-500 hover:text-zinc-200";

/**
 * Optional numeric bound — empty `(none)` seed button; when set, full {@link TRNScrubNumberField}
 * chrome (‹ › lock ↺ ✕) inside one shell.
 */
export function TRNOptionalScrubNumberField(props: TRNOptionalScrubNumberFieldProps) {
  const {
    ariaLabel,
    value,
    onChange,
    step = 0.01,
    seedValue = 0,
    resetValue,
    disabled = false,
    className,
    min,
    max,
    fractionDigits,
    emptyLabel = "(none)",
    settingsKey,
    appearance = DEFAULT_OPTIONAL_APPEARANCE,
    interaction = DEFAULT_OPTIONAL_INTERACTION,
  } = props;

  const baseline = resetValue ?? seedValue;

  if (value == null) {
    return (
      <TRNButton
        size="compact"
        disabled={disabled}
        className={twMerge(EMPTY_SHELL_CLASS, className)}
        hint={`No ${ariaLabel.toLowerCase()} bound. Click to set a value.`}
        aria-label={`${ariaLabel}: not set. Activate to enter a value.`}
        onClick={() => onChange(seedValue)}
      >
        {emptyLabel}
      </TRNButton>
    );
  }

  return (
    <TRNScrubNumberField
      ariaLabel={ariaLabel}
      className={twMerge("w-full", className)}
      inputClassName="text-[11px]"
      value={value}
      step={step}
      min={min}
      max={max}
      fractionDigits={fractionDigits}
      disabled={disabled}
      defaultValue={baseline}
      settingsKey={settingsKey}
      appearance={appearance}
      interaction={interaction}
      resetAriaLabel={`Reset ${ariaLabel}`}
      clearAriaLabel={`Clear ${ariaLabel}`}
      onClear={() => onChange(null)}
      onChange={(n) => onChange(n)}
    />
  );
}
