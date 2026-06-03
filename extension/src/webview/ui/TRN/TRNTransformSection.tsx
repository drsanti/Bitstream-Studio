import type { ReactNode } from "react";
import type { TRNScrubInteractionConfig } from "./TRNScrubNumberInput";
import { TRNVector3Field, type TRNVector3 } from "./TRNVector3Field";
import { TRNToggleSwitch } from "./TRNToggleSwitch";

export type TRNTransformSectionValue = {
  position: TRNVector3;
  /** Degrees (editor-friendly). */
  rotationDeg?: TRNVector3;
  scale: TRNVector3;
  /** When true, keep scale uniform and write to x/y/z together. */
  uniformScale?: boolean;
};

export type TRNTransformSectionProps = {
  title?: ReactNode;
  value: TRNTransformSectionValue;
  onChange: (next: TRNTransformSectionValue) => void;
  showRotation?: boolean;
  showScale?: boolean;
  /** Per-axis suffix on rotation rows (default none — use label `Rotation (deg)`). */
  rotationUnitLabel?: string;
  disabled?: boolean;
  className?: string;
  /** Forwarded to every `TRNVector3Field` (drag px scale + wheel pixel threshold). */
  scrubInteraction?: TRNScrubInteractionConfig;
};

export function TRNTransformSection(props: TRNTransformSectionProps) {
  const {
    title = "Transform",
    value,
    onChange,
    showRotation = true,
    showScale = true,
    rotationUnitLabel = "",
    disabled = false,
    className = "",
    scrubInteraction,
  } = props;

  const uniformScale = value.uniformScale !== false;
  const rotationDeg = value.rotationDeg ?? { x: 0, y: 0, z: 0 };

  return (
    <section className={"space-y-2 " + className}>
      <div className="text-[11px] font-semibold text-zinc-100">{title}</div>

      <TRNVector3Field
        label="Position"
        value={value.position}
        onChange={(next) => onChange({ ...value, position: next })}
        step={0.01}
        disabled={disabled}
        {...scrubInteraction}
      />

      {showRotation ? (
        <TRNVector3Field
          label="Rotation (deg)"
          value={rotationDeg}
          onChange={(next) => onChange({ ...value, rotationDeg: next })}
          step={0.5}
          unit={rotationUnitLabel.length > 0 ? rotationUnitLabel : undefined}
          disabled={disabled}
          {...scrubInteraction}
        />
      ) : null}

      {showScale ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-zinc-950/35 px-2 py-1">
            <span className="text-xs font-medium text-zinc-200">Uniform scale</span>
            <TRNToggleSwitch
              checked={uniformScale}
              ariaLabel="Toggle uniform scale"
              onCheckedChange={(checked) =>
                onChange({ ...value, uniformScale: checked })
              }
              disabled={disabled}
            />
          </div>
          <TRNVector3Field
            label="Scale"
            value={value.scale}
            onChange={(next) => {
              if (!uniformScale) {
                onChange({ ...value, scale: next });
                return;
              }
              // Apply the edited axis value across all axes.
              const s = next.x ?? next.y ?? next.z ?? 1;
              onChange({ ...value, scale: { x: s, y: s, z: s } });
            }}
            step={0.01}
            disabled={disabled}
            {...scrubInteraction}
          />
        </div>
      ) : null}
    </section>
  );
}

