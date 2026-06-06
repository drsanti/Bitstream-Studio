import type {
  TRNScrubNumberFieldAppearance,
  TRNScrubNumberFieldInteraction,
} from "../../../../../ui/TRN";
import {
  loadTrnScrubNumberFieldSettings,
  saveTrnScrubNumberFieldSettings,
  type TrnScrubNumberFieldStoredSettingsV1,
} from "../../../../../ui/TRN/trnScrubNumberFieldStorage";

/** localStorage key for flow-wide inspector numeric scrub chrome. */
export const INSPECTOR_SCRUB_SETTINGS_KEY = "inspector-numeric";

const LEGACY_SCRUB_SETTINGS_KEY = "number-constant";

/** Default scrub chrome for typed node inspector numeric rows. */
export const INSPECTOR_SCRUB_APPEARANCE: TRNScrubNumberFieldAppearance = {
  variant: "full",
  stepButtonsVisibility: "always",
  lockIconVisibility: "always",
  resetIconVisibility: "hidden",
  clearIconVisibility: "hidden",
};

export const INSPECTOR_SCRUB_INTERACTION: TRNScrubNumberFieldInteraction = {
  pointerScrubEnabled: true,
  wheelEnabled: true,
  wheelBoundedMode: "span-percent",
};

export const INSPECTOR_SCRUB_STORED_DEFAULTS: TrnScrubNumberFieldStoredSettingsV1 = {
  version: 1,
  valueRules: { stepAuto: true },
  appearance: INSPECTOR_SCRUB_APPEARANCE,
  interaction: INSPECTOR_SCRUB_INTERACTION,
};

let inspectorScrubSettingsSeeded = false;

/** Seed persisted inspector scrub prefs (migrates legacy `number-constant` key once). */
export function ensureInspectorScrubFieldSettings(): TrnScrubNumberFieldStoredSettingsV1 {
  if (!inspectorScrubSettingsSeeded) {
    inspectorScrubSettingsSeeded = true;
    const existing = loadTrnScrubNumberFieldSettings(INSPECTOR_SCRUB_SETTINGS_KEY);
    if (!existing) {
      const legacy = loadTrnScrubNumberFieldSettings(LEGACY_SCRUB_SETTINGS_KEY);
      saveTrnScrubNumberFieldSettings(
        INSPECTOR_SCRUB_SETTINGS_KEY,
        legacy ?? INSPECTOR_SCRUB_STORED_DEFAULTS,
      );
    }
  }
  return loadTrnScrubNumberFieldSettings(INSPECTOR_SCRUB_SETTINGS_KEY) ?? INSPECTOR_SCRUB_STORED_DEFAULTS;
}
