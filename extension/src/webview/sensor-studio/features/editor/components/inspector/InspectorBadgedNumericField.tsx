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
} from "./inspector-scrub-field-presets";

export type InspectorBadgedNumericFieldProps = {
  badge: TRNScrubFieldBadgeSpec;
  ariaLabel: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  fractionDigits?: number;
  disabled?: boolean;
  locked?: boolean;
  onLockedChange?: (locked: boolean) => void;
  pointerScrubEnabled?: boolean;
  appearance?: TRNScrubNumberFieldAppearance;
  interaction?: TRNScrubNumberFieldInteraction;
  settingsKey?: string;
  onCommit: (next: number) => void;
};

/** Badge + scrub field — uses flow-wide inspector scrub prefs by default. */
export function InspectorBadgedNumericField(props: InspectorBadgedNumericFieldProps) {
  const {
    badge,
    ariaLabel,
    value,
    min,
    max,
    step = 0.01,
    fractionDigits,
    disabled = false,
    locked,
    onLockedChange,
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
      locked={locked}
      onLockedChange={onLockedChange}
      density="full"
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
