import { useMemo, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

export type TRNSegmentedControlOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
};

export type TRNSegmentedControlTone =
  | "neutral"
  | "accent"
  | "success"
  | "danger";

type RenderOptionContext = {
  selected: boolean;
  focused: boolean;
  disabled: boolean;
};

export type TRNSegmentedControlProps = {
  value: string | null;
  onValueChange: (value: string | null) => void;
  options: TRNSegmentedControlOption[];
  name?: string;
  ariaLabel?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "surface";
  fullWidth?: boolean;
  orientation?: "horizontal" | "vertical";
  className?: string;
  itemClassName?: string;
  tone?: TRNSegmentedControlTone;
  allowDeselect?: boolean;
  onFocusChange?: (value: string | null) => void;
  renderOption?: (
    option: TRNSegmentedControlOption,
    context: RenderOptionContext,
  ) => ReactNode;
  stopPointerDownPropagation?: boolean;
  showFocusRing?: boolean;
};

function toneClasses(tone: TRNSegmentedControlTone, selected: boolean): string {
  if (!selected) {
    return "border-zinc-700/80 bg-zinc-950/90 text-zinc-400 hover:bg-zinc-800/70";
  }
  if (tone === "success") {
    return "border-zinc-700/80 bg-emerald-500/10 text-emerald-300";
  }
  if (tone === "danger") {
    return "border-zinc-700/80 bg-rose-500/10 text-rose-300";
  }
  if (tone === "accent") {
    return "border-zinc-700/80 bg-cyan-500/20 text-zinc-100";
  }
  return "border-zinc-700/80 bg-cyan-500/15 text-zinc-100";
}

function toneFocusRingClass(tone: TRNSegmentedControlTone): string {
  if (tone === "success") {
    return "ring-1 ring-emerald-500/70";
  }
  if (tone === "danger") {
    return "ring-1 ring-rose-500/70";
  }
  if (tone === "accent") {
    return "ring-1 ring-cyan-400/90";
  }
  return "ring-1 ring-cyan-400/50";
}

export function TRNSegmentedControl({
  value,
  onValueChange,
  options,
  name,
  ariaLabel,
  disabled = false,
  size = "md",
  variant = "default",
  fullWidth = false,
  orientation = "horizontal",
  className = "",
  itemClassName = "",
  tone = "accent",
  allowDeselect = false,
  onFocusChange,
  renderOption,
  stopPointerDownPropagation = false,
  showFocusRing = false,
}: TRNSegmentedControlProps) {
  const [focusedValue, setFocusedValue] = useState<string | null>(null);
  const enabledOptions = useMemo(
    () => options.filter((option) => !option.disabled),
    [options],
  );
  const currentIndex = enabledOptions.findIndex(
    (option) => option.value === value,
  );

  const sizeClass =
    size === "sm"
      ? "px-2 py-0.5 text-[10px]"
      : size === "lg"
        ? "px-3 py-1 text-sm"
        : "px-2 py-1 text-xs";

  const containerVariantClass =
    variant === "surface"
      ? "rounded border border-zinc-700/80 bg-zinc-900/80 p-1"
      : variant === "outline"
        ? "rounded border border-zinc-700/80 p-1"
        : "";

  const isVertical = orientation === "vertical";
  const rootClass =
    (isVertical ? "flex flex-col" : "flex flex-wrap") +
    " gap-1 " +
    (fullWidth ? "w-full " : "") +
    containerVariantClass +
    (className.length > 0 ? ` ${className}` : "");

  const setFocusValue = (next: string | null) => {
    setFocusedValue(next);
    onFocusChange?.(next);
  };

  const handleKeyDown = (
    evt: KeyboardEvent<HTMLButtonElement>,
    option: TRNSegmentedControlOption,
  ) => {
    if (disabled || option.disabled || enabledOptions.length === 0) {
      return;
    }
    const isPrevKey = isVertical
      ? evt.key === "ArrowUp"
      : evt.key === "ArrowLeft";
    const isNextKey = isVertical
      ? evt.key === "ArrowDown"
      : evt.key === "ArrowRight";
    if (!isPrevKey && !isNextKey) {
      return;
    }
    evt.preventDefault();
    const baseIndex =
      currentIndex >= 0
        ? currentIndex
        : enabledOptions.findIndex((item) => item.value === option.value);
    if (baseIndex < 0) {
      return;
    }
    const delta = isPrevKey ? -1 : 1;
    const nextIndex =
      (baseIndex + delta + enabledOptions.length) % enabledOptions.length;
    const nextValue = enabledOptions[nextIndex]?.value ?? null;
    if (nextValue != null) {
      onValueChange(nextValue);
      setFocusValue(nextValue);
    }
  };

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={rootClass}>
      {options.map((option) => {
        const isSelected = option.value === value;
        const isOptionDisabled = disabled || option.disabled === true;
        const isFocused = focusedValue === option.value;
        return (
          <button
            key={option.value}
            type="button"
            name={name}
            role="radio"
            aria-checked={isSelected}
            aria-pressed={isSelected}
            disabled={isOptionDisabled}
            onPointerDown={(evt) => {
              if (stopPointerDownPropagation) {
                evt.stopPropagation();
              }
            }}
            onClick={(evt) => {
              if (stopPointerDownPropagation) {
                evt.stopPropagation();
              }
              if (isOptionDisabled) {
                return;
              }
              if (allowDeselect && isSelected) {
                onValueChange(null);
                return;
              }
              onValueChange(option.value);
            }}
            onFocus={() => {
              setFocusValue(option.value);
            }}
            onBlur={() => {
              setFocusValue(null);
            }}
            onKeyDown={(evt) => {
              handleKeyDown(evt, option);
            }}
            className={
              "inline-flex items-center justify-center gap-1.5 rounded border transition-colors focus:outline-none focus-visible:outline-none focus:ring-0 " +
              sizeClass +
              " " +
              toneClasses(tone, isSelected) +
              (fullWidth ? " flex-1 " : " ") +
              (isFocused && showFocusRing ? `${toneFocusRingClass(tone)} ` : "") +
              "disabled:opacity-50 disabled:cursor-not-allowed " +
              itemClassName
            }
          >
            {renderOption != null ? (
              renderOption(option, {
                selected: isSelected,
                focused: isFocused,
                disabled: isOptionDisabled,
              })
            ) : (
              <>
                {option.icon != null ? (
                  <span className="inline-flex">{option.icon}</span>
                ) : null}
                <span>{option.label}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
