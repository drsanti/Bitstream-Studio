import {
  TRNScrubNumberField,
  type TRNScrubNumberFieldAppearance,
  type TRNScrubNumberFieldInteraction,
} from "../../../../../ui/TRN";
import {
  ensureFlowCardScrubFieldSettings,
  FLOW_CARD_SCRUB_SETTINGS_KEY,
  INSPECTOR_SCRUB_APPEARANCE,
  INSPECTOR_SCRUB_INTERACTION,
} from "../../components/inspector/inspector-scrub-field-presets";

export type FlowCardScrubNumberFieldProps = {
  ariaLabel: string;
  className?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  fractionDigits?: number;
  disabled?: boolean;
  pointerScrubEnabled?: boolean;
  appearance?: TRNScrubNumberFieldAppearance;
  interaction?: TRNScrubNumberFieldInteraction;
  settingsKey?: string;
  onCommit: (next: number) => void;
};

/** Flow node card numeric scrub — same chrome + prefs as the inspector (`inspector-numeric`). */
export function FlowCardScrubNumberField(props: FlowCardScrubNumberFieldProps) {
  const {
    ariaLabel,
    className,
    value,
    min,
    max,
    step = 0.01,
    fractionDigits,
    disabled = false,
    pointerScrubEnabled = true,
    appearance,
    interaction,
    settingsKey = FLOW_CARD_SCRUB_SETTINGS_KEY,
    onCommit,
  } = props;

  ensureFlowCardScrubFieldSettings();

  return (
    <TRNScrubNumberField
      size="sm"
      ariaLabel={ariaLabel}
      className={className}
      inputClassName="text-[10px]"
      value={value}
      min={min}
      max={max}
      step={step}
      fractionDigits={fractionDigits}
      disabled={disabled}
      settingsKey={settingsKey}
      appearance={{
        ...INSPECTOR_SCRUB_APPEARANCE,
        ...appearance,
      }}
      interaction={{
        ...INSPECTOR_SCRUB_INTERACTION,
        ...interaction,
        pointerScrubEnabled:
          interaction?.pointerScrubEnabled ?? pointerScrubEnabled,
      }}
      onChange={onCommit}
    />
  );
}
