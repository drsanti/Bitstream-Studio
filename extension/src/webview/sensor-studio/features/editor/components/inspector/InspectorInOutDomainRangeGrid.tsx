import { TRNBadgedScrubNumberFieldGrid } from "../../../../../ui/TRN";
import { InspectorBadgedNumericField } from "./InspectorBadgedNumericField";

export type InspectorInOutDomainRangeGridProps = {
  inMin: number;
  inMax: number;
  outMin: number;
  outMax: number;
  step?: number;
  onCommitInMin: (next: number) => void;
  onCommitInMax: (next: number) => void;
  onCommitOutMin: (next: number) => void;
  onCommitOutMax: (next: number) => void;
};

/**
 * Four-field input/output domain grid — Map range, Value normalizer, etc.
 * Badges: In− / In+ / Out− / Out+.
 */
export function InspectorInOutDomainRangeGrid(props: InspectorInOutDomainRangeGridProps) {
  const {
    inMin,
    inMax,
    outMin,
    outMax,
    step = 0.01,
    onCommitInMin,
    onCommitInMax,
    onCommitOutMin,
    onCommitOutMax,
  } = props;

  return (
    <TRNBadgedScrubNumberFieldGrid columns={2}>
      <InspectorBadgedNumericField
        badge={{ kind: "text", text: "In−", tone: "sky" }}
        ariaLabel="Input domain minimum"
        value={inMin}
        step={step}
        onCommit={onCommitInMin}
      />
      <InspectorBadgedNumericField
        badge={{ kind: "text", text: "In+", tone: "sky" }}
        ariaLabel="Input domain maximum"
        value={inMax}
        step={step}
        onCommit={onCommitInMax}
      />
      <InspectorBadgedNumericField
        badge={{ kind: "text", text: "Out−", tone: "violet" }}
        ariaLabel="Output domain minimum"
        value={outMin}
        step={step}
        onCommit={onCommitOutMin}
      />
      <InspectorBadgedNumericField
        badge={{ kind: "text", text: "Out+", tone: "violet" }}
        ariaLabel="Output domain maximum"
        value={outMax}
        step={step}
        onCommit={onCommitOutMax}
      />
    </TRNBadgedScrubNumberFieldGrid>
  );
}
