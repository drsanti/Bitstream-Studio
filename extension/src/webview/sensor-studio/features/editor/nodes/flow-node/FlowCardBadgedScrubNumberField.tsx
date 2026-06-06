import {
  TRNBadgedScrubNumberField,
  type TRNScrubFieldBadgeSpec,
  type TRNScrubNumberFieldAppearance,
  type TRNScrubNumberFieldInteraction,
} from "../../../../../ui/TRN";
import {
  ensureInspectorScrubFieldSettings,
  INSPECTOR_SCRUB_INTERACTION,
  INSPECTOR_SCRUB_SETTINGS_KEY,
} from "../../components/inspector/inspector-scrub-field-presets";

export type FlowCardBadgedScrubNumberFieldProps = {
  badge: TRNScrubFieldBadgeSpec;
  ariaLabel: string;
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

/** Compact badged scrub row for flow node cards. */
export function FlowCardBadgedScrubNumberField(props: FlowCardBadgedScrubNumberFieldProps) {
  const {
    badge,
    ariaLabel,
    value,
    min,
    max,
    step = 0.01,
    fractionDigits,
    disabled = false,
    pointerScrubEnabled = true,
    appearance,
    interaction,
    settingsKey = INSPECTOR_SCRUB_SETTINGS_KEY,
    onCommit,
  } = props;

  ensureInspectorScrubFieldSettings();

  return (
    <TRNBadgedScrubNumberField
      badge={badge}
      ariaLabel={ariaLabel}
      value={value}
      min={min}
      max={max}
      step={step}
      fractionDigits={fractionDigits}
      disabled={disabled}
      density="compact"
      size="sm"
      settingsKey={settingsKey}
      appearance={appearance}
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
