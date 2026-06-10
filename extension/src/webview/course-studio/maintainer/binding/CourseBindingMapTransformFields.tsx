import { ArrowRight, GitCompareArrows } from "lucide-react";
import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNFormField } from "../../../ui/TRN/TRNForm";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { TRNToggleSwitch } from "../../../ui/TRN/TRNToggleSwitch";
import type { DiagramBindingV1 } from "../../schemas/diagram.v1";
import { applyMapOps, formatBindingNumber } from "../../runtime/diagram/evaluateDiagramScene";
import {
  hasScaleMapOp,
  readClampMapOp,
  readScaleMapOp,
  withClampMapOp,
  withoutScaleMapOp,
  withScaleMapOp,
} from "../../runtime/diagram/diagramNodeMutations";
import { CourseMaintainerScrubNumberInput } from "../CourseMaintainerScrubNumberInput";

type ScalePresetId = "unit01" | "percent" | "memsY" | "invert";

const SCALE_PRESETS: Record<
  ScalePresetId,
  { label: string; scale: { inMin: number; inMax: number; outMin: number; outMax: number } }
> = {
  unit01: {
    label: "±1 → 0–1",
    scale: { inMin: -1, inMax: 1, outMin: 0, outMax: 1 },
  },
  percent: {
    label: "±1 → 0–100",
    scale: { inMin: -1, inMax: 1, outMin: 0, outMax: 100 },
  },
  memsY: {
    label: "±1 → ±14",
    scale: { inMin: -1, inMax: 1, outMin: 14, outMax: -14 },
  },
  invert: {
    label: "Invert output",
    scale: { inMin: -1, inMax: 1, outMin: -14, outMax: 14 },
  },
};

function formatPipelineNumber(value: number | null, format: string | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  return formatBindingNumber(value, format);
}

function RangePairFields({
  idPrefix,
  minLabel,
  maxLabel,
  min,
  max,
  minStep,
  maxStep,
  onMinChange,
  onMaxChange,
}: {
  idPrefix: string;
  minLabel: string;
  maxLabel: string;
  min: number;
  max: number;
  minStep: number;
  maxStep: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <TRNFormField id={`${idPrefix}-min`} label={minLabel}>
        <CourseMaintainerScrubNumberInput value={min} step={minStep} onChange={onMinChange} />
      </TRNFormField>
      <TRNFormField id={`${idPrefix}-max`} label={maxLabel}>
        <CourseMaintainerScrubNumberInput value={max} step={maxStep} onChange={onMaxChange} />
      </TRNFormField>
    </div>
  );
}

export function CourseBindingMapTransformFields({
  binding,
  onChange,
  idPrefix,
  rawValue,
  displayValue,
  unit,
  format,
}: {
  binding: DiagramBindingV1;
  onChange: (next: DiagramBindingV1) => void;
  idPrefix: string;
  rawValue: number | null;
  displayValue: number | null;
  unit: string;
  format?: string;
}) {
  const scaleActive = hasScaleMapOp(binding);
  const scale = readScaleMapOp(binding);
  const clamp = readClampMapOp(binding);
  const clampEnabled = clamp != null;

  const pipeline = useMemo(() => {
    if (rawValue == null || !Number.isFinite(rawValue)) {
      return null;
    }
    const afterScale = scaleActive ? applyMapOps(rawValue, [{ op: "scale", ...scale }]) : rawValue;
    const afterClamp = applyMapOps(afterScale, clampEnabled && clamp != null ? [clamp] : []);
    return {
      raw: rawValue,
      afterScale,
      afterClamp,
    };
  }, [rawValue, scaleActive, scale, clampEnabled, clamp]);

  const updateScale = (patch: Partial<typeof scale>) => {
    onChange(withScaleMapOp(binding, { ...scale, ...patch }));
  };

  const setScaleActive = (active: boolean) => {
    if (!active) {
      onChange(withoutScaleMapOp(binding));
      return;
    }
    onChange(withScaleMapOp(binding, scale));
  };

  const applyPreset = (presetId: ScalePresetId) => {
    const preset = SCALE_PRESETS[presetId];
    let nextScale = { op: "scale" as const, ...preset.scale };
    if (presetId === "invert") {
      const current = readScaleMapOp(binding);
      nextScale = {
        op: "scale",
        inMin: current.inMin,
        inMax: current.inMax,
        outMin: current.outMax,
        outMax: current.outMin,
      };
    }
    onChange(withScaleMapOp(binding, nextScale));
  };

  const setClampEnabled = (enabled: boolean) => {
    if (!enabled) {
      onChange(withClampMapOp(binding, null));
      return;
    }
    onChange(withClampMapOp(binding, clamp ?? { op: "clamp", min: 0, max: 1 }));
  };

  const updateClamp = (patch: Partial<{ min: number; max: number }>) => {
    const next = clamp ?? { op: "clamp" as const, min: 0, max: 1 };
    onChange(withClampMapOp(binding, { ...next, ...patch }));
  };

  return (
    <div className="flex flex-col gap-3">
      <TRNHintText tone="muted">
        Remap the live sensor value before it reaches the widget. Use <strong>Direct</strong> to
        pass the value through unchanged.
      </TRNHintText>

      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Transform mode">
        <TRNButton
          size="compact"
          selected={!scaleActive}
          onClick={() => setScaleActive(false)}
        >
          Direct
        </TRNButton>
        <TRNButton
          size="compact"
          selected={scaleActive}
          onClick={() => setScaleActive(true)}
        >
          Custom scale
        </TRNButton>
      </div>

      {scaleActive ? (
        <div className="flex flex-col gap-2.5 rounded-md border border-zinc-700/70 bg-zinc-950/35 p-2.5">
          <div className="flex flex-wrap gap-1">
            {(Object.keys(SCALE_PRESETS) as ScalePresetId[]).map((presetId) => (
              <TRNButton
                key={presetId}
                size="compact"
                className="px-2"
                onClick={() => applyPreset(presetId)}
              >
                {SCALE_PRESETS[presetId].label}
              </TRNButton>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div className="min-w-0">
              <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                Input range
              </div>
              <RangePairFields
                idPrefix={`${idPrefix}-in`}
                minLabel="Min"
                maxLabel="Max"
                min={scale.inMin}
                max={scale.inMax}
                minStep={0.1}
                maxStep={0.1}
                onMinChange={(inMin) => updateScale({ inMin })}
                onMaxChange={(inMax) => updateScale({ inMax })}
              />
            </div>

            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full border border-zinc-700/80 bg-zinc-900/80 text-zinc-400"
              aria-hidden
            >
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
            </div>

            <div className="min-w-0">
              <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                Output range
              </div>
              <RangePairFields
                idPrefix={`${idPrefix}-out`}
                minLabel="Min"
                maxLabel="Max"
                min={scale.outMin}
                max={scale.outMax}
                minStep={1}
                maxStep={1}
                onMinChange={(outMin) => updateScale({ outMin })}
                onMaxChange={(outMax) => updateScale({ outMax })}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 rounded-md border border-zinc-700/70 bg-zinc-950/35 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-zinc-200">Limit output</div>
            <div className="text-[10px] text-zinc-500">Clamp the value after scaling.</div>
          </div>
          <TRNToggleSwitch
            checked={clampEnabled}
            ariaLabel="Limit output range"
            onCheckedChange={setClampEnabled}
          />
        </div>
        {clampEnabled ? (
          <RangePairFields
            idPrefix={`${idPrefix}-clamp`}
            minLabel="Floor"
            maxLabel="Ceiling"
            min={clamp?.min ?? 0}
            max={clamp?.max ?? 1}
            minStep={0.1}
            maxStep={0.1}
            onMinChange={(min) => updateClamp({ min })}
            onMaxChange={(max) => updateClamp({ max })}
          />
        ) : null}
      </div>

      {pipeline != null ? (
        <div className="flex flex-col gap-1 rounded-md border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-2">
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-cyan-400/80">
            <GitCompareArrows className="h-3 w-3" aria-hidden />
            Live pipeline
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-300">
            <span className="text-zinc-500">Sensor</span>
            <span className="font-medium text-zinc-100">
              {formatPipelineNumber(pipeline.raw, format)}
              {unit.length > 0 ? ` ${unit}` : ""}
            </span>
            {scaleActive ? (
              <>
                <ArrowRight className="h-3 w-3 text-zinc-600" aria-hidden />
                <span className="text-zinc-500">Scaled</span>
                <span className="font-medium text-zinc-100">
                  {formatPipelineNumber(pipeline.afterScale, format)}
                </span>
              </>
            ) : null}
            {clampEnabled ? (
              <>
                <ArrowRight className="h-3 w-3 text-zinc-600" aria-hidden />
                <span className="text-zinc-500">Clamped</span>
                <span className="font-medium text-zinc-100">
                  {formatPipelineNumber(pipeline.afterClamp, format)}
                </span>
              </>
            ) : null}
            <ArrowRight className="h-3 w-3 text-zinc-600" aria-hidden />
            <span className="text-zinc-500">Display</span>
            <span className={twMerge("font-semibold", displayValue != null ? "text-cyan-200" : "text-zinc-500")}>
              {displayValue != null ? formatPipelineNumber(displayValue, format) : "—"}
              {displayValue != null && unit.length > 0 ? ` ${unit}` : ""}
            </span>
          </div>
        </div>
      ) : (
        <TRNHintText tone="muted">Connect telemetry to preview the transform pipeline.</TRNHintText>
      )}
    </div>
  );
}
