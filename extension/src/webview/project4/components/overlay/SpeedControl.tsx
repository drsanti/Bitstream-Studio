import { useCallback, useState } from "react";
import { TRNButton } from "../../../ui/TRN/TRNButton";

export type SpeedControlProps = {
  onApply: (val: number) => void;
  disabled?: boolean;
};

export function SpeedControl(props: SpeedControlProps) {
  const [val, setVal] = useState(128);

  const apply = useCallback(() => {
    if (!props.disabled) {
      props.onApply(val);
    }
  }, [props.disabled, props.onApply, val]);

  return (
    <div className="pointer-events-auto flex w-full flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          Speed <span className="font-mono text-zinc-500">setSpeed</span>
        </span>
        <span className="font-sans text-xs font-semibold tabular-nums tracking-wide text-zinc-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          {val}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={255}
        step={1}
        value={val}
        disabled={props.disabled}
        onChange={(e) => setVal(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={255}
          step={1}
          value={val}
          disabled={props.disabled}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) {
              setVal(Math.max(0, Math.min(255, Math.round(n))));
            }
          }}
          className="w-20 rounded border border-white/15 bg-zinc-950/55 px-2 py-1 font-sans text-xs font-semibold tabular-nums tracking-wide text-zinc-100 outline-none backdrop-blur-md focus:border-cyan-500/50 disabled:opacity-50"
        />
        <TRNButton
          type="button"
          size="compact"
          className="border-cyan-800/50 bg-cyan-950/40 hover:bg-cyan-950/55"
          disabled={props.disabled}
          onClick={apply}
        >
          Apply
        </TRNButton>
      </div>
    </div>
  );
}
