import { TRNInput } from "../../ui/TRN/TRNInput";
import type { GaugeScaleReadoutConfig } from "../../sensor-studio/features/editor/nodes/display/gauge-display-config";
import {
  CourseInspectorFieldGrid,
  CourseInspectorFieldGridControls,
  CourseInspectorFieldGridLabels,
} from "./CourseInspectorFieldGrid";
import { CourseMaintainerScrubNumberField } from "./CourseMaintainerScrubNumberField";

export type CourseGaugeScaleReadoutFieldsProps = {
  cfg: Pick<GaugeScaleReadoutConfig, "min" | "max" | "unit" | "decimals">;
  labelPrefix: string;
  decimalsMax?: number;
  minDescription?: string;
  maxDescription?: string;
  defaultMin?: number;
  defaultMax?: number;
  defaultDecimals?: number;
  onPatch: (patch: Partial<Pick<GaugeScaleReadoutConfig, "min" | "max" | "unit" | "decimals">>) => void;
};

/** Min / max / unit / decimals — Sensor Studio {@link GaugeScaleReadoutInspectorFields} parity for Course Studio. */
export function CourseGaugeScaleReadoutFields(props: CourseGaugeScaleReadoutFieldsProps) {
  const {
    cfg,
    labelPrefix,
    decimalsMax = 4,
    minDescription = "Scale start — incoming values map into [min, max].",
    maxDescription = "Scale end.",
    defaultMin,
    defaultMax,
    defaultDecimals,
    onPatch,
  } = props;

  return (
    <div className="flex flex-col gap-2">
      <CourseInspectorFieldGrid>
        <CourseInspectorFieldGridLabels
          left={{ label: "Min", description: minDescription }}
          right={{ label: "Max", description: maxDescription }}
        />
        <CourseInspectorFieldGridControls
          left={
            <CourseMaintainerScrubNumberField
              ariaLabel={`${labelPrefix} minimum`}
              value={cfg.min}
              step={0.01}
              defaultValue={defaultMin}
              onChange={(min) => onPatch({ min })}
            />
          }
          right={
            <CourseMaintainerScrubNumberField
              ariaLabel={`${labelPrefix} maximum`}
              value={cfg.max}
              step={0.01}
              defaultValue={defaultMax}
              onChange={(max) => onPatch({ max })}
            />
          }
        />
      </CourseInspectorFieldGrid>

      <CourseInspectorFieldGrid>
        <CourseInspectorFieldGridLabels
          left={{
            label: "Unit",
            description: "Suffix shown next to the live value (optional).",
          }}
          right={{ label: "Decimals" }}
        />
        <CourseInspectorFieldGridControls
          left={
            <TRNInput
              variant="outlined"
              size="sm"
              className="w-full"
              aria-label={`${labelPrefix} unit`}
              value={cfg.unit}
              placeholder="e.g. g"
              onChange={(event) => onPatch({ unit: event.target.value })}
            />
          }
          right={
            <CourseMaintainerScrubNumberField
              ariaLabel={`${labelPrefix} decimal places`}
              value={cfg.decimals}
              min={0}
              max={decimalsMax}
              step={1}
              fractionDigits={0}
              defaultValue={defaultDecimals}
              onChange={(decimals) => onPatch({ decimals: Math.round(decimals) })}
            />
          }
        />
      </CourseInspectorFieldGrid>
    </div>
  );
}
