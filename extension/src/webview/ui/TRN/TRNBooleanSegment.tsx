import type { ReactNode } from "react";
import { TRNSegmentedControl } from "./TRNSegmentedControl.js";
import type { TRNSegmentedControlTone } from "./TRNSegmentedControl.js";

export type TRNBooleanSegmentAppearance =
  | "default"
  | "glass"
  | "strong"
  | "green-glass";

export type TRNBooleanSegmentProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  trueLabel?: string;
  falseLabel?: string;
  trueIcon?: ReactNode;
  falseIcon?: ReactNode;
  size?: "sm" | "md" | "lg";
  tone?: TRNSegmentedControlTone;
  variant?: "default" | "outline" | "surface";
  appearance?: TRNBooleanSegmentAppearance;
  fullWidth?: boolean;
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
  className?: string;
  itemClassName?: string;
  ariaLabel?: string;
  stopPointerDownPropagation?: boolean;
  showFocusRing?: boolean;
};

export function TRNBooleanSegment({
  value,
  onValueChange,
  trueLabel = "On",
  falseLabel = "Off",
  trueIcon,
  falseIcon,
  size = "sm",
  tone = "neutral",
  variant = "default",
  appearance = "default",
  fullWidth = false,
  orientation = "horizontal",
  disabled = false,
  className = "",
  itemClassName = "",
  ariaLabel,
  stopPointerDownPropagation = false,
  showFocusRing,
}: TRNBooleanSegmentProps)
{
  const resolvedTone: TRNSegmentedControlTone =
    appearance === "green-glass" ? "neutral" : tone;
  const resolvedShowFocusRing =
    showFocusRing ?? (appearance === "green-glass" ? false : true);

  const appearanceItemClassName = appearance === "glass"
    ? "bg-zinc-900/70 hover:border-cyan-500/40 hover:bg-cyan-500/10"
    : appearance === "strong"
      ? "border-cyan-500/45 hover:border-cyan-400 hover:bg-cyan-500/15"
      : appearance === "green-glass"
        ? "bg-emerald-950/30 !border-emerald-900/80 hover:bg-emerald-500/12 aria-checked:bg-emerald-500/14"
      : "";
  return (
    <TRNSegmentedControl
      value={value ? "true" : "false"}
      onValueChange={(nextValue) => {
        if (nextValue === "true") {
          onValueChange(true);
          return;
        }
        if (nextValue === "false") {
          onValueChange(false);
        }
      }}
      options={[
        { value: "false", label: falseLabel, icon: falseIcon },
        { value: "true", label: trueLabel, icon: trueIcon },
      ]}
      ariaLabel={ariaLabel}
      disabled={disabled}
      size={size}
      tone={resolvedTone}
      variant={variant}
      fullWidth={fullWidth}
      orientation={orientation}
      className={className}
      itemClassName={
        appearanceItemClassName.length > 0
          ? `${appearanceItemClassName} ${itemClassName}`.trim()
          : itemClassName
      }
      renderOption={
        appearance === "green-glass"
          ? (option, context) => (
              <>
                {option.icon != null ? (
                  <span
                    className={
                      "inline-flex " +
                      (context.selected ? "text-emerald-200" : "text-slate-400")
                    }
                  >
                    {option.icon}
                  </span>
                ) : null}
                <span className={context.selected ? "text-emerald-200" : "text-slate-400"}>
                  {option.label}
                </span>
              </>
            )
          : undefined
      }
      showFocusRing={resolvedShowFocusRing}
      stopPointerDownPropagation={stopPointerDownPropagation}
    />
  );
}
