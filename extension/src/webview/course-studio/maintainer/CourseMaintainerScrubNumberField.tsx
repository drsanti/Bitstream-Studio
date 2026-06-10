import { twMerge } from "tailwind-merge";
import {
  TRNScrubNumberField,
  type TRNScrubNumberFieldProps,
} from "../../ui/TRN/TRNScrubNumberField";
import {
  COURSE_INSPECTOR_SCRUB_APPEARANCE,
  COURSE_INSPECTOR_SCRUB_SIZE,
} from "./courseScrubFieldPresets";

/** Course Studio maintainer numeric row — `TRNSelect` field parity (`size="field"`, 13px). */
export function CourseMaintainerScrubNumberField(
  props: Omit<TRNScrubNumberFieldProps, "size"> & {
    appearance?: TRNScrubNumberFieldProps["appearance"];
  },
) {
  const { appearance, className, ...rest } = props;
  return (
    <TRNScrubNumberField
      {...rest}
      size={COURSE_INSPECTOR_SCRUB_SIZE}
      className={twMerge("w-full", className)}
      appearance={{ ...COURSE_INSPECTOR_SCRUB_APPEARANCE, ...appearance }}
    />
  );
}
