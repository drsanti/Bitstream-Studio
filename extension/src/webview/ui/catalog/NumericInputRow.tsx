import { twMerge } from 'tailwind-merge';
import { TRNScrubNumberInput } from '../TRN/TRNScrubNumberInput.js';

export interface NumericInputRowProps
{
  label: string;
  value: number;
  unit?: string;
  step?: number;
  locked?: boolean;
  disabled?: boolean;
  decimals?: number;
  labelWidth?: string;
  onValueChange: (value: number) => void;
  onLockToggle?: (locked: boolean) => void;
}

/* Compact labeled numeric field for Model Loader query rows. */
export function NumericInputRow({
  label,
  value,
  step = 0.01,
  disabled = false,
  decimals = 3,
  labelWidth,
  onValueChange,
}: NumericInputRowProps)
{
  return (
    <div className="flex items-center gap-2">
      <div className={twMerge('text-sm font-medium text-gray-300 shrink-0', labelWidth)}>
        {label}
      </div>
      <TRNScrubNumberInput
        className="flex-1 min-w-0"
        value={value}
        onChange={onValueChange}
        step={step}
        fractionDigits={decimals}
        disabled={disabled}
        pointerScrubEnabled
        aria-label={label}
      />
    </div>
  );
}
