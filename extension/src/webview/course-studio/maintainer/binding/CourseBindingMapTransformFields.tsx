import { ArrowRight, GitCompareArrows } from "lucide-react";
import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import {
  TRNFormField,
  TRNHintText,
  TRNInlineToggleRow,
  TRNSegmentedControl,
} from "../../../ui/TRN";
import type { DiagramBindingV1 } from "../../schemas/diagram.v1";
import { applyMapOps, formatBindingNumber } from "../../runtime/diagram/evaluateDiagramScene";
import {
  disableScaleMapOp,
  enableScaleMapOp,
  hasScaleMapOp,
  readClampMapOp,
  readScaleMapOp,
  withClampMapOp,
  withScaleMapOpDraftSync,
} from "../../runtime/diagram/diagramNodeMutations";
import { CourseMapRangeDomainGrid } from "../CourseMapRangeDomainGrid";
import {
  CourseInspectorFieldGrid,
  CourseInspectorFieldGridControls,
  CourseInspectorFieldGridLabels,
} from "../CourseInspectorFieldGrid";
import { CourseMaintainerScrubNumberField } from "../CourseMaintainerScrubNumberField";

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
    label: "Invert",
    scale: { inMin: -1, inMax: 1, outMin: -14, outMax: 14 },
  },
};

const MAP_MODE_OPTIONS = [
  {
    value: "direct",
    label: "Direct",
    icon: <ArrowRight className="h-3 w-3 shrink-0 opacity-90" aria-hidden />,
  },
  {
    value: "map",
    label: "Map range",
    icon: <GitCompareArrows className="h-3 w-3 shrink-0 opacity-90" aria-hidden />,
  },
];

function formatPipelineNumber(value: number | null, format: string | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  return formatBindingNumber(value, format);
}

function CourseBindingPipelineStage({
  label,
  valueText,
  unit,
  emphasis = false,
}: {
  label: string;
  valueText: string;
  unit?: string;
  emphasis?: boolean;
}) {
  const unitLabel = unit != null && unit.length > 0 ? unit : "";

  return (
    <div className="flex shrink-0 flex-col gap-0.5">
      <span className="text-[10px] text-zinc-500">{label}</span>
      <span className="flex items-baseline gap-1">
        <span
          className={twMerge(
            "inline-block min-w-[4.75rem] text-[11px] leading-none",
            emphasis ? "font-semibold text-zinc-100" : "font-medium text-zinc-100",
          )}
        >
          {valueText}
        </span>
        <span className="inline-block min-w-[2.25rem] text-[10px] leading-none text-zinc-400">
          {unitLabel}
        </span>
      </span>
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
  const mapMode = scaleActive ? "map" : "direct";

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
    onChange(withScaleMapOpDraftSync(binding, { ...scale, ...patch }));
  };

  const setMapMode = (mode: string) => {
    if (mode === "direct") {
      onChange(disableScaleMapOp(binding));
      return;
    }
    onChange(enableScaleMapOp(binding));
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
    onChange(withScaleMapOpDraftSync(binding, nextScale));
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
    <div className="flex flex-col gap-2">
      <TRNFormField id={`${idPrefix}-mode`} label="Mode">
        <TRNSegmentedControl
          value={mapMode}
          onValueChange={(value) => {
            if (value === "direct" || value === "map") {
              setMapMode(value);
            }
          }}
          options={[...MAP_MODE_OPTIONS]}
          ariaLabel="Map range mode"
          size="sm"
          fullWidth
        />
      </TRNFormField>

      {scaleActive ? (
        <>
          <TRNFormField id={`${idPrefix}-presets`} label="Presets">
            <div className="flex flex-wrap gap-1">
              {(Object.keys(SCALE_PRESETS) as ScalePresetId[]).map((presetId) => (
                <TRNButton
                  key={presetId}
                  size="compact"
                  onClick={() => applyPreset(presetId)}
                >
                  {SCALE_PRESETS[presetId].label}
                </TRNButton>
              ))}
            </div>
          </TRNFormField>

          <CourseMapRangeDomainGrid
            inMin={scale.inMin}
            inMax={scale.inMax}
            outMin={scale.outMin}
            outMax={scale.outMax}
            onCommitInMin={(inMin) => updateScale({ inMin })}
            onCommitInMax={(inMax) => updateScale({ inMax })}
            onCommitOutMin={(outMin) => updateScale({ outMin })}
            onCommitOutMax={(outMax) => updateScale({ outMax })}
          />
        </>
      ) : null}

      <TRNInlineToggleRow
        label="Clamp result to out min / max"
        hint="Clip the mapped value to the output floor and ceiling."
        checked={clampEnabled}
        onCheckedChange={setClampEnabled}
        ariaLabel="Clamp mapped result to output range"
      />

      {clampEnabled ? (
        <CourseInspectorFieldGrid>
          <CourseInspectorFieldGridLabels
            left={{ label: "Floor", description: "Minimum value after mapping." }}
            right={{ label: "Ceiling", description: "Maximum value after mapping." }}
          />
          <CourseInspectorFieldGridControls
            left={
              <CourseMaintainerScrubNumberField
                ariaLabel="Map range clamp floor"
                value={clamp?.min ?? 0}
                step={0.01}
                onChange={(min) => updateClamp({ min })}
              />
            }
            right={
              <CourseMaintainerScrubNumberField
                ariaLabel="Map range clamp ceiling"
                value={clamp?.max ?? 1}
                step={0.01}
                onChange={(max) => updateClamp({ max })}
              />
            }
          />
        </CourseInspectorFieldGrid>
      ) : null}

      {pipeline != null ? (
        <div className="flex flex-col gap-1 rounded-md border border-zinc-700/60 bg-zinc-950/40 px-2.5 py-2">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            <GitCompareArrows className="h-3 w-3 shrink-0" aria-hidden />
            Live pipeline
          </div>
          <div className="flex min-w-0 items-start gap-2 overflow-x-auto">
            <CourseBindingPipelineStage
              label="Sensor"
              valueText={formatPipelineNumber(pipeline.raw, format)}
              unit={unit}
            />
            {scaleActive ? (
              <>
                <ArrowRight
                  className="mt-4 h-3 w-3 shrink-0 text-zinc-600"
                  aria-hidden
                />
                <CourseBindingPipelineStage
                  label="Mapped"
                  valueText={formatPipelineNumber(pipeline.afterScale, format)}
                />
              </>
            ) : null}
            {clampEnabled ? (
              <>
                <ArrowRight
                  className="mt-4 h-3 w-3 shrink-0 text-zinc-600"
                  aria-hidden
                />
                <CourseBindingPipelineStage
                  label="Clamped"
                  valueText={formatPipelineNumber(pipeline.afterClamp, format)}
                />
              </>
            ) : null}
            <ArrowRight className="mt-4 h-3 w-3 shrink-0 text-zinc-600" aria-hidden />
            <CourseBindingPipelineStage
              label="Display"
              valueText={
                displayValue != null ? formatPipelineNumber(displayValue, format) : "—"
              }
              unit={displayValue != null ? unit : ""}
              emphasis={displayValue != null}
            />
          </div>
        </div>
      ) : (
        <TRNHintText tone="muted">Connect telemetry to preview the transform pipeline.</TRNHintText>
      )}
    </div>
  );
}
