export const TRN_SCRUB_NUMBER_FIELD_STORAGE_PREFIX = "trn-scrub-number-field:";

export type TrnScrubNumberFieldStoredSettingsV1 = {
  version: 1;
  /** Optional default bounds/step when the field is used without explicit props. */
  valueRules?: {
    min?: number;
    max?: number;
    /** When set, overrides `step` when the field is used without explicit props. */
    step?: number;
    /** When true, prefer auto-deriving step from span when min/max exist. */
    stepAuto?: boolean;
  };
  appearance?: {
    variant?: "minimal" | "full";
    stepButtonsVisibility?: "hidden" | "always" | "hover";
    lockIconVisibility?: "hidden" | "always" | "hover";
    resetIconVisibility?: "hidden" | "always" | "hover";
    clearIconVisibility?: "hidden" | "always" | "hover";
  };
  interaction?: {
    pointerScrubEnabled?: boolean;
    dragSensitivityPreset?: "slow" | "normal" | "fast" | "custom";
    wheelEnabled?: boolean;
    /** Unbounded wheel step (defaults to 1). */
    wheelUnboundedStep?: number;
    /** Bounded wheel mode. */
    wheelBoundedMode?: "step" | "span-percent";
    /** Multiplier when Shift is held (defaults 0.1). */
    shiftMultiplier?: number;
    /** Multiplier when Ctrl/Cmd is held (defaults 10). */
    ctrlOrCmdMultiplier?: number;
    /** Horizontal px per 0.1% of reference (lower = faster). */
    horizontalPxPerTenthPercent?: number;
    /** Vertical px per 1% of reference (lower = faster). */
    verticalPxPerPercent?: number;
    /** Pointer movement threshold (px) before scrubbing starts. */
    scrubActivationThresholdPx?: number;
    /** Pixel-mode wheel accumulator threshold. */
    wheelPixelAccumThreshold?: number;
  };
};

export function getTrnScrubNumberFieldStorageKey(key: string): string {
  return `${TRN_SCRUB_NUMBER_FIELD_STORAGE_PREFIX}${key}`;
}

export function loadTrnScrubNumberFieldSettings(
  key: string,
): TrnScrubNumberFieldStoredSettingsV1 | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(getTrnScrubNumberFieldStorageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "version" in parsed &&
      (parsed as any).version === 1
    ) {
      return parsed as TrnScrubNumberFieldStoredSettingsV1;
    }
    return null;
  } catch (error) {
    console.warn("Failed to load TRN scrub number field settings:", error);
    return null;
  }
}

export function saveTrnScrubNumberFieldSettings(
  key: string,
  settings: TrnScrubNumberFieldStoredSettingsV1,
): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(
      getTrnScrubNumberFieldStorageKey(key),
      JSON.stringify(settings),
    );
  } catch (error) {
    if (error instanceof Error && error.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded, cannot save scrub number settings");
    } else {
      console.warn("Failed to save TRN scrub number field settings:", error);
    }
  }
}

