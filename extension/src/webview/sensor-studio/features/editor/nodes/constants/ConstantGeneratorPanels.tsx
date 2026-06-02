import {
  TRNScrubNumberInput,
  TRNScrubNumberField,
  TRNSegmentedControl,
  TRNToggleSwitch,
} from "../../../../../ui/TRN";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";
import {
  coerceNumberConstantValue,
  getNumberConstantSliderRange,
  readNumberConstantCardValueControl,
  readNumberConstantMode,
  readOptionalFiniteNumber,
} from "./number-constant-helpers";

/** Same chrome as `TRNVector3Field` / inspector number rows (`NumberConstantSettingsSection`). */
const TRN_DENSE_NUMERIC_FIELD_SHELL =
  "flex min-w-0 items-center gap-1 rounded border border-zinc-700/80 bg-zinc-950/45 px-1 py-1";

export type BooleanConstantNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

export function BooleanConstantNodePanel(props: BooleanConstantNodePanelProps) {
  const { nodeId, defaultConfig } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const raw = defaultConfig.value;
  const value = typeof raw === "boolean" ? raw : false;

  return (
    <ReadingPanel className="space-y-2">
      <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
        <span className="text-xs font-medium text-zinc-200">Output</span>
        <TRNToggleSwitch
          checked={value}
          ariaLabel="Boolean constant output"
          onCheckedChange={(checked) => {
            updateField(nodeId, "value", checked);
          }}
        />
      </div>
    </ReadingPanel>
  );
}

export type NumberConstantNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

function readFiniteNumber(raw: unknown, fallback: number): number {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function NumberConstantNodePanel(props: NumberConstantNodePanelProps) {
  const { nodeId, defaultConfig } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const mode = readNumberConstantMode(defaultConfig);
  const min = readOptionalFiniteNumber(defaultConfig, "min");
  const max = readOptionalFiniteNumber(defaultConfig, "max");
  const step = readOptionalFiniteNumber(defaultConfig, "step");
  const rawValue = readFiniteNumber(defaultConfig.value, 0);
  const display = coerceNumberConstantValue(defaultConfig, rawValue);
  const valueStep =
    mode === "integer" ? Math.max(1, step ?? 1) : step != null && step > 0 ? step : 0.01;

  const commitValue = (nextRaw: number) => {
    const merged = { ...defaultConfig, value: nextRaw };
    const out = coerceNumberConstantValue(merged, nextRaw);
    updateField(nodeId, "value", out);
  };

  return (
    <div className="nodrag mt-2 min-w-0 w-full max-w-full">
      <TRNScrubNumberField
        ariaLabel="Numeric constant value"
        className="w-full"
        inputClassName="text-xs"
        value={display}
        step={valueStep}
        min={min}
        max={max}
        fractionDigits={mode === "integer" ? 0 : undefined}
        settingsKey="number-constant"
        appearance={{ variant: "full", buttonsVisible: "hover" }}
        interaction={{ pointerScrubEnabled: true, wheelEnabled: true, wheelBoundedMode: "span-percent" }}
        onChange={(next) => {
          commitValue(next);
        }}
      />
    </div>
  );
}
