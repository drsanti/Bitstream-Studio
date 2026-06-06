import { TRNBadgedScrubNumberFieldGrid } from "../../../../../ui/TRN";
import { InspectorBadgedNumericField } from "./InspectorBadgedNumericField";

export type InspectorMinMaxRangeGridProps = {
  min: number;
  max: number;
  step?: number;
  onCommitMin: (next: number) => void;
  onCommitMax: (next: number) => void;
};

/** Min / Max badged pair — Clamp and similar two-bound nodes. */
export function InspectorMinMaxRangeGrid(props: InspectorMinMaxRangeGridProps) {
  const { min, max, step = 0.01, onCommitMin, onCommitMax } = props;

  return (
    <TRNBadgedScrubNumberFieldGrid columns={2}>
      <InspectorBadgedNumericField
        badge={{ kind: "text", text: "Min", tone: "sky" }}
        ariaLabel="Minimum bound"
        value={min}
        step={step}
        onCommit={onCommitMin}
      />
      <InspectorBadgedNumericField
        badge={{ kind: "text", text: "Max", tone: "violet" }}
        ariaLabel="Maximum bound"
        value={max}
        step={step}
        onCommit={onCommitMax}
      />
    </TRNBadgedScrubNumberFieldGrid>
  );
}
