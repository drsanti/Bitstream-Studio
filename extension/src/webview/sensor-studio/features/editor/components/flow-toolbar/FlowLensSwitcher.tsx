import { TRNSegmentedControl } from "../../../../../ui/TRN";
import type { StudioSplitFlowLens } from "../../../../state/studio-split-flow-lens.store";

export type FlowLensSwitcherProps = {
  value: StudioSplitFlowLens;
  onChange: (lens: StudioSplitFlowLens) => void;
  compact?: boolean;
};

const OPTIONS: { value: StudioSplitFlowLens; label: string }[] = [
  { value: "dashboard", label: "Dashboard" },
  { value: "stage", label: "Stage" },
  { value: "full", label: "Full" },
];

export function FlowLensSwitcher(props: FlowLensSwitcherProps) {
  const { value, onChange, compact = false } = props;

  return (
    <div
      className={`pointer-events-auto shrink-0 rounded-md border border-cyan-800/40 bg-cyan-950/40 p-0.5 ${
        compact ? "" : ""
      }`}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <TRNSegmentedControl
        size="sm"
        variant="surface"
        tone="accent"
        ariaLabel="Flow graph scope"
        value={value}
        onValueChange={(next) => {
          if (next === "dashboard" || next === "stage" || next === "full") {
            onChange(next);
          }
        }}
        options={OPTIONS.map((row) => ({
          value: row.value,
          label: row.label,
        }))}
        stopPointerDownPropagation
        className={compact ? "min-w-0" : undefined}
      />
    </div>
  );
}

export function isStudioSplitFlowLens(value: string): value is StudioSplitFlowLens {
  return value === "dashboard" || value === "stage" || value === "full";
}
