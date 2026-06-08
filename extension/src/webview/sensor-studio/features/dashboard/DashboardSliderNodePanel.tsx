import { useCallback, useMemo } from "react";
import { TRNScrubNumberInput } from "../../../ui/TRN/TRNScrubNumberInput";
import { coerceKnobConfig } from "../editor/nodes/display/gauge-display-config";

type DashboardSliderNodePanelProps = {
  className?: string;
  defaultConfig: Record<string, unknown>;
  value: number;
  disabled?: boolean;
  onValueChange: (value: number) => void;
};

function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function DashboardSliderNodePanel(props: DashboardSliderNodePanelProps) {
  const { className, defaultConfig, value, disabled = false, onValueChange } = props;
  const cfg = useMemo(() => coerceKnobConfig(defaultConfig), [defaultConfig]);
  const label =
    typeof defaultConfig.label === "string" && defaultConfig.label.trim().length > 0
      ? defaultConfig.label.trim()
      : "Slider";
  const safeValue = clampValue(value, cfg.min, cfg.max);

  const commit = useCallback(
    (next: number) => {
      if (!Number.isFinite(next)) {
        return;
      }
      onValueChange(clampValue(next, cfg.min, cfg.max));
    },
    [cfg.max, cfg.min, onValueChange],
  );

  return (
    <div
      className={`flex h-full min-h-[var(--dashboard-row-height,56px)] w-full flex-col justify-center gap-2 px-3 py-2 ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium text-zinc-300">{label}</span>
        <TRNScrubNumberInput
          className="w-24 shrink-0"
          value={safeValue}
          min={cfg.min}
          max={cfg.max}
          step={cfg.step}
          fractionDigits={cfg.decimals}
          disabled={disabled}
          aria-label={`${label} value`}
          onChange={commit}
        />
      </div>
      <input
        type="range"
        className="h-2 w-full cursor-pointer accent-[color:var(--dashboard-accent,#22d3ee)] disabled:cursor-not-allowed disabled:opacity-50"
        min={cfg.min}
        max={cfg.max}
        step={cfg.step}
        value={safeValue}
        disabled={disabled}
        aria-label={`${label} slider`}
        onChange={(event) => commit(Number(event.target.value))}
      />
    </div>
  );
}
