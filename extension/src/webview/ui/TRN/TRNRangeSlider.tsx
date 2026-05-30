import React from "react";
import { clsx } from "clsx";

export interface TRNRangeSliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "className"> {
  label?: string;
  className?: string;
  valueLabel?: string;
}

export const TRNRangeSlider: React.FC<TRNRangeSliderProps> = ({
  label,
  className,
  valueLabel,
  id,
  ...rest
}) => {
  const inputId = id ?? (label ? `slider-${label.replace(/\s/g, "-")}` : undefined);
  return (
    <div className={clsx("flex min-w-0 flex-col gap-0.5", className)}>
      {(label || valueLabel) && (
        <div className="flex items-baseline justify-between gap-2">
          {label && (
            <label htmlFor={inputId} className="truncate text-xs text-gray-400">
              {label}
            </label>
          )}
          {valueLabel != null && (
            <span className="shrink-0 tabular-nums text-xs text-gray-400">{valueLabel}</span>
          )}
        </div>
      )}
      <input
        id={inputId}
        type="range"
        className={clsx(
          "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-800/85 accent-cyan-500 transition-colors",
          "hover:bg-zinc-700/85 focus-visible:outline-none",
          "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-zinc-800/85",
          "[&::-webkit-slider-thumb]:mt-[-4px] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-emerald-300/50",
          "[&::-webkit-slider-thumb]:bg-[rgba(16,185,129,0.72)] [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgba(8,12,20,0.95)] [&::-webkit-slider-thumb]:transition-transform",
          "hover:[&::-webkit-slider-thumb]:scale-110",
          "focus-visible:[&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgba(8,12,20,0.95),0_0_0_4px_rgba(34,211,238,0.35)]",
          "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:border-none [&::-moz-range-track]:bg-zinc-800/85",
          "[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-emerald-300/50 [&::-moz-range-thumb]:bg-[rgba(16,185,129,0.72)]",
          "disabled:cursor-not-allowed disabled:opacity-45"
        )}
        {...rest}
      />
    </div>
  );
};
