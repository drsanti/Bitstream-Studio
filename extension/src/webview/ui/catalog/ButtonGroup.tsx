import React from 'react';
import { Zap, Wrench } from 'lucide-react';
import { cn } from './cn.js';
import {
  GLASS_BUTTON_DISABLED_CLASS,
  GLASS_BUTTON_IDLE_CLASS,
  GLASS_BUTTON_SELECTED_CLASS_BY_TONE,
  type GlassButtonTone,
} from './button-glass-tokens.js';

export interface ButtonGroupOption<T = string | number>
{
  value: T;
  label: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  tooltip?: string;
}

export interface ButtonGroupProps<T = string | number>
{
  label?: string;
  labelPosition?: 'above' | 'inline';
  value: T;
  options: ButtonGroupOption<T>[];
  onChange: (value: T) => void;
  columns?: number;
  buttonPadding?: 'sm' | 'md';
  variant?: 'glass' | 'solid';
  tone?: GlassButtonTone;
  disabled?: boolean;
  className?: string;
  requiresRebuild?: boolean;
  showIndicator?: boolean;
}

/* Grid of selectable glass buttons (HDRI presets, etc.). */
export function ButtonGroup<T extends string | number = string | number>({
  label,
  labelPosition = 'above',
  value,
  options,
  onChange,
  columns = 3,
  buttonPadding = 'md',
  variant = 'glass',
  tone = 'zinc',
  disabled = false,
  className,
  requiresRebuild = false,
  showIndicator = false,
}: ButtonGroupProps<T>)
{
  const paddingClass = buttonPadding === 'sm' ? 'py-1' : 'py-1.5';
  const selectedClass =
    variant === 'glass'
      ? GLASS_BUTTON_SELECTED_CLASS_BY_TONE[tone]
      : 'bg-gray-300 text-gray-800 border-gray-300 shadow-md';
  const idleClass =
    variant === 'glass'
      ? GLASS_BUTTON_IDLE_CLASS
      : 'bg-gray-600 text-gray-300 border-gray-600 hover:bg-gray-500 hover:border-gray-500';
  const disabledClass =
    variant === 'glass'
      ? GLASS_BUTTON_DISABLED_CLASS
      : 'bg-gray-700 text-gray-500 border-gray-700 cursor-not-allowed opacity-60';

  const handleClick = (optionValue: T) =>
  {
    if (!disabled)
    {
      onChange(optionValue);
    }
  };

  const renderLabel = () =>
  {
    if (!label)
    {
      return null;
    }

    return (
      <div className="flex items-center justify-between mb-2 mt-1">
        <div className="flex items-center gap-1.5">
          <label className={cn('text-sm font-medium text-gray-300')}>
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
                <Wrench className="h-3 w-3 text-gray-400" />
              ) : (
                <Zap className="h-3 w-3 text-gray-400" />
              )}
            </span>
          )}
        </div>
      </div>
    );
  };

  const gridColsClass =
    {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
    }[columns] || 'grid-cols-3';

  return (
    <div className={cn('space-y-2', className)}>
      {labelPosition === 'above' ? renderLabel() : null}
      <div className={cn('grid gap-0.5', gridColsClass)}>
        {options.map((option) =>
        {
          const isSelected = value === option.value;
          const isOptionDisabled = disabled || option.disabled;
          const isLoading = option.loading;

          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => handleClick(option.value)}
              disabled={isOptionDisabled || isLoading}
              title={option.tooltip}
              className={cn(
                paddingClass,
                'text-xs rounded border transition-all outline-none focus:outline-none focus:ring-0 active:outline-none flex items-center justify-center gap-1',
                isOptionDisabled || isLoading
                  ? disabledClass
                  : isSelected
                    ? selectedClass
                    : idleClass,
              )}
            >
              {isLoading ? (
                <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {option.icon && <span>{option.icon}</span>}
                  <span>{option.label}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
