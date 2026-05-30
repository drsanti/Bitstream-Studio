import {
  TRNParameterSlider,
  TRNScrubNumberInput,
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
  const cardControl = readNumberConstantCardValueControl(defaultConfig);
  const sliderRange = getNumberConstantSliderRange(defaultConfig, display);
  const valueStep =
    mode === "integer" ? Math.max(1, step ?? 1) : step != null && step > 0 ? step : 0.01;

  const commitValue = (nextRaw: number) => {
    const merged = { ...defaultConfig, value: nextRaw };
    const out = coerceNumberConstantValue(merged, nextRaw);
    updateField(nodeId, "value", out);
  };

  return (
    <ReadingPanel className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] text-zinc-500">
        <span className="rounded border border-zinc-700/60 px-1 py-px font-medium text-zinc-400">
          {mode === "integer" ? "Integer" : "Float"}
        </span>
        {min != null ? <span>min {min}</span> : null}
        {max != null ? <span>max {max}</span> : null}
        {step != null ? <span>step {step}</span> : null}
      </div>
      <div className="space-y-1.5">
        <span className="text-[11px] font-medium text-zinc-400">Output value</span>
        <TRNSegmentedControl
          ariaLabel="Number card editor mode"
          className="nodrag w-full"
          fullWidth
          size="sm"
          stopPointerDownPropagation
          tone="neutral"
          variant="surface"
          value={cardControl}
          options={[
            { value: "input", label: "Input" },
            { value: "slider", label: "Slider" },
          ]}
          onValueChange={(next) => {
            if (next === "input" || next === "slider") {
              updateField(nodeId, "cardValueControl", next);
            }
          }}
        />
        {cardControl === "input" ? (
          <div className={"nodrag w-full " + TRN_DENSE_NUMERIC_FIELD_SHELL}>
            <div className="flex min-w-0 flex-1 items-center gap-0.5">
              <TRNScrubNumberInput
                aria-label="Numeric constant value"
                className="w-full"
                inputClassName="text-xs"
                value={display}
                step={valueStep}
                min={min}
                max={max}
                pointerScrubEnabled={false}
                onChange={(next) => {
                  commitValue(next);
                }}
              />
            </div>
          </div>
        ) : (
          <TRNParameterSlider
            className="nodrag px-0 py-0"
            appearance="divider"
            name={<span className="sr-only">Numeric constant value</span>}
            value={display}
            min={sliderRange.min}
            max={sliderRange.max}
            step={sliderRange.step}
            throttleMs={120}
            animateExternalValueChange={false}
            valueScrubEnabled={false}
            valueFormatter={(v) =>
              mode === "integer" ? String(Math.round(v)) : String(v)
            }
            onChange={(next) => {
              commitValue(next);
            }}
          />
        )}
      </div>
    </ReadingPanel>
  );
}
