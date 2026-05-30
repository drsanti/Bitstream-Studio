import { useId } from "react";
import { TRNButton, TRNFormField } from "../../ui/TRN";
import {
  hzFromIntervalMs,
  presetMatchesInterval,
  type HzPreset,
} from "../lib/samplingRatePresets";

const inputClass =
  "w-full min-w-0 rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100";

type Props = {
  label: string;
  intervalMs: number;
  presets: HzPreset[];
  disabled?: boolean;
  dirty?: boolean;
  appliedIntervalMs: number;
  minMs?: number;
  onIntervalMsChange: (ms: number) => void;
};

export function IntervalRateField({
  label,
  intervalMs,
  presets,
  disabled,
  dirty,
  appliedIntervalMs,
  minMs = 1,
  onIntervalMsChange,
}: Props) {
  const baseId = useId();
  const matchedHz = presetMatchesInterval(presets, intervalMs);
  const isCustom = matchedHz == null && intervalMs > 0;

  return (
    <TRNFormField label={label} htmlFor={`${baseId}-ms`}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1">
          {presets.map((p) => (
            <TRNButton
              key={p.hz}
              size="compact"
              selected={matchedHz === p.hz}
              disabled={disabled}
              onClick={() => onIntervalMsChange(p.intervalMs)}
            >
              {p.label}
            </TRNButton>
          ))}
          <TRNButton
            size="compact"
            selected={isCustom || intervalMs === 0}
            disabled={disabled}
            onClick={() => {
              if (intervalMs <= 0) onIntervalMsChange(100);
            }}
          >
            Custom
          </TRNButton>
        </div>
        <div className="flex items-center gap-2">
          <input
            id={`${baseId}-ms`}
            type="number"
            min={0}
            className={`${inputClass} ${dirty ? "border-amber-600/50 ring-1 ring-amber-500/25" : ""}`}
            value={intervalMs}
            disabled={disabled}
            onChange={(e) => {
              const next = Math.max(0, Number(e.target.value));
              onIntervalMsChange(next > 0 ? Math.max(minMs, next) : 0);
            }}
          />
          <span className="shrink-0 text-xs text-zinc-500">{hzFromIntervalMs(intervalMs)}</span>
        </div>
        {dirty ? (
          <p className="text-[10px] text-amber-200/70">
            Applied: {appliedIntervalMs} ms ({hzFromIntervalMs(appliedIntervalMs)})
          </p>
        ) : null}
      </div>
    </TRNFormField>
  );
}
