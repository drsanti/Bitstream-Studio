import type {
  TRNScrubNumberFieldAppearance,
  TRNScrubNumberFieldSize,
} from "../../ui/TRN/TRNScrubNumberField";

/** Match {@link TRNSelect} field trigger (`text-[13px]`) in maintainer rows. */
export const COURSE_INSPECTOR_SCRUB_INPUT_CLASS =
  "text-[13px] font-normal leading-tight";

/** {@link TRNScrubNumberField} size for Course Studio maintainer cards. */
export const COURSE_INSPECTOR_SCRUB_SIZE: TRNScrubNumberFieldSize = "field";

/** Shared scrub chrome for Course Studio maintainer numerics (YouTube crop, GSAP timing, …). */
export const COURSE_INSPECTOR_SCRUB_APPEARANCE: TRNScrubNumberFieldAppearance = {
  variant: "full",
  stepButtonsVisibility: "always",
  lockIconVisibility: "hidden",
  resetIconVisibility: "always",
  clearIconVisibility: "hidden",
};
