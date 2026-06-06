import {
  TRNOptionalScrubNumberField,
  type TRNOptionalScrubNumberFieldProps,
} from "../../../../../ui/TRN";
import {
  ensureInspectorScrubFieldSettings,
  INSPECTOR_SCRUB_SETTINGS_KEY,
} from "./inspector-scrub-field-presets";

export type InspectorOptionalScrubNumberFieldProps = TRNOptionalScrubNumberFieldProps & {
  /** @deprecated Use `onChange`. */
  onCommit?: (next: number | null) => void;
};

/** Inspector alias for {@link TRNOptionalScrubNumberField}. */
export function InspectorOptionalScrubNumberField(props: InspectorOptionalScrubNumberFieldProps) {
  const {
    onCommit,
    onChange,
    settingsKey = INSPECTOR_SCRUB_SETTINGS_KEY,
    appearance,
    interaction,
    ...rest
  } = props;

  ensureInspectorScrubFieldSettings();

  return (
    <TRNOptionalScrubNumberField
      {...rest}
      settingsKey={settingsKey}
      appearance={{
        clearIconVisibility: "always",
        ...appearance,
      }}
      interaction={interaction}
      onChange={onChange ?? onCommit ?? (() => undefined)}
    />
  );
}
