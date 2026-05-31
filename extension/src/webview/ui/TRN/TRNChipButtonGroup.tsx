import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import {
  TRN_COMPACT_CHOICE_BUTTON_BASE,
  TRN_COMPACT_CHOICE_BUTTON_SIZE,
  trnCompactChoiceButtonTone,
} from "./trnCompactChoiceButtonClasses.js";

export type TRNChipButtonGroupOption<T extends string | number = string | number> =
  {
    value: T;
    label: string;
    disabled?: boolean;
    loading?: boolean;
    icon?: ReactNode;
    title?: string;
  };

export type TRNChipButtonGroupProps<
  T extends string | number = string | number,
> = {
  label?: string;
  value: T;
  options: TRNChipButtonGroupOption<T>[];
  onChange: (value: T) => void;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
  /** Accessibility label when `label` is omitted. */
  ariaLabel?: string;
};

const GRID_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

export function TRNChipButtonGroup<
  T extends string | number = string | number,
>(props: TRNChipButtonGroupProps<T>) {
  const {
    label,
    value,
    options,
    onChange,
    columns = 3,
    size = "sm",
    disabled = false,
    className,
    ariaLabel,
  } = props;

  const sizeClass = size === "sm" ? TRN_COMPACT_CHOICE_BUTTON_SIZE : "py-1.5 px-2 text-xs font-semibold";

  return (
    <div className={twMerge("space-y-2", className)}>
      {label != null && label.length > 0 ? (
        <div className="text-xs font-semibold text-zinc-100">{label}</div>
      ) : null}
      <div
        role="radiogroup"
        aria-label={ariaLabel ?? label}
        className={twMerge("grid gap-1", GRID_COLS[columns] ?? "grid-cols-3")}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          const isOptionDisabled = disabled || option.disabled === true;
          const isLoading = option.loading === true;

          return (
            <button
              key={String(option.value)}
              type="button"
              role="radio"
              aria-checked={isSelected}
              title={option.title}
              disabled={isOptionDisabled || isLoading}
              onClick={() => {
                if (!isOptionDisabled && !isLoading) {
                  onChange(option.value);
                }
              }}
              className={twMerge(
                TRN_COMPACT_CHOICE_BUTTON_BASE,
                "w-full min-w-0 gap-1",
                sizeClass,
                trnCompactChoiceButtonTone(isSelected, isOptionDisabled || isLoading),
              )}
            >
              {isLoading ? (
                <span
                  className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent"
                  aria-hidden
                />
              ) : (
                <>
                  {option.icon != null ? (
                    <span className="inline-flex shrink-0">{option.icon}</span>
                  ) : null}
                  <span className="truncate">{option.label}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
