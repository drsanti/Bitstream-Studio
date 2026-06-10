import { twMerge } from "tailwind-merge";
import {
  TRNScrubNumberInput,
  type TRNScrubNumberInputProps,
} from "../../ui/TRN/TRNScrubNumberInput";
import { COURSE_INSPECTOR_SCRUB_INPUT_CLASS } from "./courseScrubFieldPresets";

/** Bare maintainer numeric (no step chrome) — 13px to match {@link TRNSelect} field triggers. */
export function CourseMaintainerScrubNumberInput(props: TRNScrubNumberInputProps) {
  const { inputClassName, className, ...rest } = props;
  return (
    <TRNScrubNumberInput
      {...rest}
      className={twMerge("w-full", className)}
      inputClassName={twMerge(COURSE_INSPECTOR_SCRUB_INPUT_CLASS, inputClassName)}
    />
  );
}
