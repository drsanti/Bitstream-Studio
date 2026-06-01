import { useId, useState } from "react";
import { TRNFormField } from "../../ui/TRN";
import {
  getSensorMaskUiSpec,
  toggleMaskBit,
  type SensorMaskPreset,
} from "../lib/sensorMaskChannels";

const inputClass =
  "w-full min-w-0 rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 font-mono text-sm text-zinc-100";

type Props = {
  sensorId: number;
  mask: number;
  disabled?: boolean;
  dirty?: boolean;
  appliedMask: number;
  onMaskChange: (mask: number) => void;
  /** Hide mask hex readout, hex editor, and applied hex (Sensor Config pane). */
  showMaskHex?: boolean;
  showAppliedHex?: boolean;
  showPresets?: boolean;
  showHexEditor?: boolean;
};

export function SensorMaskChannelsField({
  sensorId,
  mask,
  disabled,
  dirty,
  appliedMask,
  onMaskChange,
  showMaskHex = true,
  showAppliedHex = true,
  showPresets = true,
  showHexEditor = true,
}: Props) {
  const baseId = useId();
  const [showHex, setShowHex] = useState(false);
  const maskBits = (mask ?? 0) & 0xff;
  const appliedMaskBits = (appliedMask ?? 0) & 0xff;
  const spec = getSensorMaskUiSpec(sensorId);

  if (!spec) {
    return (
      <TRNFormField label="Mask (hex)" htmlFor={`${baseId}-mask-hex`}>
        <input
          id={`${baseId}-mask-hex`}
          className={inputClass}
          value={maskBits.toString(16)}
          disabled={disabled}
          onChange={(e) => onMaskChange(parseInt(e.target.value.trim() || "0", 16) & 0xff)}
        />
      </TRNFormField>
    );
  }

  const applyPreset = (preset: SensorMaskPreset) => {
    onMaskChange(preset.mask & 0xff);
  };

  return (
    <div
      className={
        "flex min-w-0 flex-col gap-2 rounded-md border bg-zinc-900/40 px-3 py-2 sm:col-span-2 " +
        (dirty ? "border-amber-700/40" : "border-zinc-800/80")
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-300">Channels</span>
        {showMaskHex ? (
          <span className="font-mono text-xs text-zinc-500">mask 0x{maskBits.toString(16)}</span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {spec.channels.map((ch) => {
          const checked = (maskBits & ch.bit) !== 0;
          const id = `${baseId}-ch-${ch.bit}`;
          return (
            <label key={ch.bit} htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                id={id}
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-600"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onMaskChange(toggleMaskBit(maskBits, ch.bit, e.target.checked))}
              />
              <span className="text-zinc-200">{ch.label}</span>
            </label>
          );
        })}
      </div>

      {showPresets ? (
        <div className="flex flex-wrap gap-1.5">
          {spec.presets.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={disabled}
              className="rounded border border-zinc-700/80 bg-zinc-950/60 px-2 py-0.5 text-[11px] text-zinc-300 hover:bg-zinc-800/80 disabled:opacity-50"
              onClick={() => applyPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>
      ) : null}

      {showHexEditor ? (
        <button
          type="button"
          className="self-start text-[11px] text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
          onClick={() => setShowHex((v) => !v)}
        >
          {showHex ? "Hide" : "Advanced"} hex
        </button>
      ) : null}

      {showHexEditor && showHex ? (
        <input
          id={`${baseId}-mask-hex`}
          className={inputClass}
          value={maskBits.toString(16)}
          disabled={disabled}
          onChange={(e) => onMaskChange(parseInt(e.target.value.trim() || "0", 16) & 0xff)}
        />
      ) : null}

      {showAppliedHex && dirty ? (
        <p className="text-[10px] text-amber-200/70">Applied: 0x{appliedMaskBits.toString(16)}</p>
      ) : null}
    </div>
  );
}
