import React from 'react';
import { Zap, Wrench } from 'lucide-react';
import { cn } from './cn.js';

export interface LabeledSliderProps
{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  showValue?: boolean;
  onCommit?: (value: number) => void;
  formatValue?: (value: number) => string;
  decimals?: number;
  disabled?: boolean;
  requiresRebuild?: boolean;
  showIndicator?: boolean;
}

/* Labeled range slider for model-catalog preview settings. */
export function LabeledSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  showValue = true,
  onCommit,
  formatValue,
  decimals = 1,
  disabled = false,
  requiresRebuild = false,
  showIndicator = false,
}: LabeledSliderProps)
{
  const safeValue = typeof value === 'number' && isFinite(value) ? value : min;

  const displayValue = formatValue
    ? formatValue(safeValue)
    : safeValue.toFixed(decimals);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
  {
    onChange(parseFloat(e.target.value));
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>) =>
  {
    onChange(parseFloat(e.currentTarget.value));
  };

  const handleMouseUp = () =>
  {
    if (onCommit)
    {
      onCommit(safeValue);
    }
  };

  return (
    <div className={cn('space-y-0', disabled && 'opacity-50')}>
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] uppercase tracking-wide text-slate-400">
            {label}
          </label>
          {showIndicator && (
            <span
              title={
                requiresRebuild
                  ? 'Requires rebuild - click Rebuild Vehicle to apply'
                  : 'Runtime - applies immediately'
              }
              className="inline-flex items-center"
            >
              {requiresRebuild ? (
                <Wrench className="h-3 w-3 text-slate-400" />
              ) : (
                <Zap className="h-3 w-3 text-slate-400" />
              )}
            </span>
          )}
        </div>
        {showValue && (
          <span className="text-xs text-slate-300 font-mono">{displayValue}</span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeValue}
        onChange={handleChange}
        onInput={handleInput}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
        disabled={disabled}
        className="w-full h-1.5 bg-gray-600 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-colors [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-gray-600 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-colors [&::-moz-range-track]:bg-gray-600 [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full"
        style={{
          background: `linear-gradient(to right, rgb(209, 213, 219) 0%, rgb(209, 213, 219) ${((safeValue - min) / (max - min)) * 100}%, rgb(75, 85, 99) ${((safeValue - min) / (max - min)) * 100}%, rgb(75, 85, 99) 100%)`,
        }}
      />
    </div>
  );
}
