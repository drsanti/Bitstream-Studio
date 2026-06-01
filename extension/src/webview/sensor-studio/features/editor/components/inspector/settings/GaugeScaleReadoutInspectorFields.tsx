import {
  InspectorFieldGrid,
  InspectorFieldGridControls,
  InspectorFieldGridLabels,
} from "../InspectorFieldGrid";
import { InspectorNumericField, InspectorTextField } from "../InspectorNumericScrubRow";
import type { GaugeScaleReadoutConfig } from "../../../nodes/display/gauge-display-config";

export type GaugeScaleReadoutInspectorFieldsProps = {
  cfg: GaugeScaleReadoutConfig;
  onUpdateConfigField: (key: string, value: unknown) => boolean;
  /** Prefix for aria labels (e.g. "Radial gauge"). */
  labelPrefix: string;
  decimalsMax?: number;
  minDescription?: string;
  maxDescription?: string;
};

export function GaugeScaleReadoutInspectorFields(props: GaugeScaleReadoutInspectorFieldsProps) {
  const {
    cfg,
    onUpdateConfigField,
    labelPrefix,
    decimalsMax = 6,
    minDescription = "Scale start — incoming values map into [min, max].",
    maxDescription = "Scale end.",
  } = props;

  return (
    <>
      <InspectorFieldGrid>
        <InspectorFieldGridLabels
          left={{ label: "Min", description: minDescription }}
          right={{ label: "Max", description: maxDescription }}
        />
        <InspectorFieldGridControls
          left={
            <InspectorNumericField
              ariaLabel={`${labelPrefix} minimum`}
              value={cfg.min}
              step={0.01}
              onCommit={(next) => {
                onUpdateConfigField("min", next);
              }}
            />
          }
          right={
            <InspectorNumericField
              ariaLabel={`${labelPrefix} maximum`}
              value={cfg.max}
              step={0.01}
              onCommit={(next) => {
                onUpdateConfigField("max", next);
              }}
            />
          }
        />
      </InspectorFieldGrid>

      <InspectorFieldGrid>
        <InspectorFieldGridLabels
          left={{
            label: "Unit",
            description: "Suffix shown next to the live value (optional).",
          }}
          right={{ label: "Decimals" }}
        />
        <InspectorFieldGridControls
          left={
            <InspectorTextField
              ariaLabel={`${labelPrefix} unit`}
              value={cfg.unit}
              placeholder="e.g. °C"
              onChange={(next) => {
                onUpdateConfigField("unit", next);
              }}
            />
          }
          right={
            <InspectorNumericField
              ariaLabel={`${labelPrefix} decimal places`}
              value={cfg.decimals}
              min={0}
              max={decimalsMax}
              step={1}
              fractionDigits={0}
              onCommit={(next) => {
                onUpdateConfigField("decimals", Math.round(next));
              }}
            />
          }
        />
      </InspectorFieldGrid>
    </>
  );
}
