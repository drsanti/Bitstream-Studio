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

/** Flow node card scrub prefs — isolated from inspector so minimal legacy prefs do not hide step/lock. */
export const FLOW_CARD_SCRUB_SETTINGS_KEY = "flow-card-numeric";

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
let flowCardScrubSettingsSeeded = false;

/** Seed persisted inspector scrub prefs (ignores legacy `number-constant` minimal chrome). */
export function ensureInspectorScrubFieldSettings(): TrnScrubNumberFieldStoredSettingsV1 {
  if (!inspectorScrubSettingsSeeded) {
    inspectorScrubSettingsSeeded = true;
    const existing = loadTrnScrubNumberFieldSettings(INSPECTOR_SCRUB_SETTINGS_KEY);
    if (!existing) {
      saveTrnScrubNumberFieldSettings(
        INSPECTOR_SCRUB_SETTINGS_KEY,
        INSPECTOR_SCRUB_STORED_DEFAULTS,
      );
    }
  }
  return loadTrnScrubNumberFieldSettings(INSPECTOR_SCRUB_SETTINGS_KEY) ?? INSPECTOR_SCRUB_STORED_DEFAULTS;
}

/** Seed flow-card scrub prefs with full step/lock chrome (separate from inspector key). */
export function ensureFlowCardScrubFieldSettings(): TrnScrubNumberFieldStoredSettingsV1 {
  if (!flowCardScrubSettingsSeeded) {
    flowCardScrubSettingsSeeded = true;
    const existing = loadTrnScrubNumberFieldSettings(FLOW_CARD_SCRUB_SETTINGS_KEY);
    if (!existing) {
      saveTrnScrubNumberFieldSettings(
        FLOW_CARD_SCRUB_SETTINGS_KEY,
        INSPECTOR_SCRUB_STORED_DEFAULTS,
      );
    }
  }
  return loadTrnScrubNumberFieldSettings(FLOW_CARD_SCRUB_SETTINGS_KEY) ?? INSPECTOR_SCRUB_STORED_DEFAULTS;
}
