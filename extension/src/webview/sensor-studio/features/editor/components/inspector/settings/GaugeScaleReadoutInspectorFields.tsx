import { InspectorNumericScrubRow } from "../InspectorNumericScrubRow";
import { InspectorPropertyRow } from "../InspectorPropertyRow";
import { InspectorScrubNumberInput } from "../InspectorScrubNumberInput";
import type { GaugeScaleReadoutConfig } from "../../../nodes/display/gauge-display-config";

const controlClass =
  "w-full rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1 text-xs text-zinc-100";

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
      <InspectorNumericScrubRow
        label="Min"
        description={minDescription}
        ariaLabel={`${labelPrefix} minimum`}
        value={cfg.min}
        step={0.01}
        onCommit={(next) => {
          onUpdateConfigField("min", next);
        }}
      />
      <InspectorNumericScrubRow
        label="Max"
        description={maxDescription}
        ariaLabel={`${labelPrefix} maximum`}
        value={cfg.max}
        step={0.01}
        onCommit={(next) => {
          onUpdateConfigField("max", next);
        }}
      />
      <InspectorPropertyRow
        label="Unit"
        description="Suffix shown next to the live value (optional)."
      >
        <input
          type="text"
          className={controlClass}
          value={cfg.unit}
          placeholder="e.g. °C"
          aria-label={`${labelPrefix} unit`}
          onChange={(event) => {
            onUpdateConfigField("unit", event.target.value);
          }}
        />
      </InspectorPropertyRow>
      <InspectorPropertyRow label="Decimals">
        <InspectorScrubNumberInput
          aria-label={`${labelPrefix} decimal places`}
          className={controlClass}
          value={cfg.decimals}
          min={0}
          max={decimalsMax}
          step={1}
          onCommit={(next) => {
            onUpdateConfigField("decimals", Math.round(next));
          }}
        />
      </InspectorPropertyRow>
    </>
  );
}
