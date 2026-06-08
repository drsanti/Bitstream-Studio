import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNToggleSwitch } from "../../ui/TRN/TRNToggleSwitch";
import { TRNScrubNumberInput } from "../../ui/TRN/TRNScrubNumberInput";
import type { DiagramBindingV1 } from "../schemas/diagram.v1";
import { readClampMapOp, readScaleMapOp, withClampMapOp, withScaleMapOp } from "../runtime/diagram/diagramNodeMutations";

export function DiagramMapOpChainFields({
  binding,
  onChange,
  idPrefix,
}: {
  binding: DiagramBindingV1;
  onChange: (next: DiagramBindingV1) => void;
  idPrefix: string;
}) {
  const scale = readScaleMapOp(binding);
  const clamp = readClampMapOp(binding);
  const clampEnabled = clamp != null;

  const updateScale = (patch: Partial<typeof scale>) => {
    onChange(withScaleMapOp(binding, { ...scale, ...patch }));
  };

  const setClampEnabled = (enabled: boolean) => {
    if (!enabled) {
      onChange(withClampMapOp(binding, null));
      return;
    }
    onChange(
      withClampMapOp(binding, clamp ?? { op: "clamp", min: 0, max: 1 }),
    );
  };

  const updateClamp = (patch: Partial<{ min: number; max: number }>) => {
    const next = clamp ?? { op: "clamp" as const, min: 0, max: 1 };
    onChange(withClampMapOp(binding, { ...next, ...patch }));
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border border-zinc-700/80 bg-zinc-950/50 p-2">
      <div className="text-2xs font-semibold uppercase tracking-wide text-zinc-500">MapOp chain</div>
      <div className="grid grid-cols-2 gap-2">
        <TRNFormField id={`${idPrefix}-inMin`} label="Scale inMin">
          <TRNScrubNumberInput value={scale.inMin} step={0.1} onChange={(v) => updateScale({ inMin: v })} />
        </TRNFormField>
        <TRNFormField id={`${idPrefix}-inMax`} label="Scale inMax">
          <TRNScrubNumberInput value={scale.inMax} step={0.1} onChange={(v) => updateScale({ inMax: v })} />
        </TRNFormField>
        <TRNFormField id={`${idPrefix}-outMin`} label="Scale outMin">
          <TRNScrubNumberInput value={scale.outMin} step={1} onChange={(v) => updateScale({ outMin: v })} />
        </TRNFormField>
        <TRNFormField id={`${idPrefix}-outMax`} label="Scale outMax">
          <TRNScrubNumberInput value={scale.outMax} step={1} onChange={(v) => updateScale({ outMax: v })} />
        </TRNFormField>
      </div>
      <TRNFormField id={`${idPrefix}-clamp-toggle`} label="Clamp after scale">
        <TRNToggleSwitch
          checked={clampEnabled}
          onCheckedChange={setClampEnabled}
          ariaLabel="Clamp after scale"
          size="sm"
        />
      </TRNFormField>
      {clampEnabled ? (
        <div className="grid grid-cols-2 gap-2">
          <TRNFormField id={`${idPrefix}-clamp-min`} label="Clamp min">
            <TRNScrubNumberInput
              value={clamp?.min ?? 0}
              step={0.1}
              onChange={(min) => updateClamp({ min })}
            />
          </TRNFormField>
          <TRNFormField id={`${idPrefix}-clamp-max`} label="Clamp max">
            <TRNScrubNumberInput
              value={clamp?.max ?? 1}
              step={0.1}
              onChange={(max) => updateClamp({ max })}
            />
          </TRNFormField>
        </div>
      ) : null}
      <TRNFormField id={`${idPrefix}-fallback`} label="Fallback">
        <TRNScrubNumberInput
          value={typeof binding.fallback === "number" ? binding.fallback : 0}
          step={0.1}
          onChange={(fallback) => onChange({ ...binding, fallback })}
        />
      </TRNFormField>
    </div>
  );
}
