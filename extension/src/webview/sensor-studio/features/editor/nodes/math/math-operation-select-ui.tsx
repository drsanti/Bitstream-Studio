import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import type { TRNSelectOption } from "../../../../../ui/TRN";
import { mathOperationShortLabel, type MathOperation } from "../../../../core/flow/math-operations";

function mathOpChip(text: string): ReactNode {
  return (
    <span
      className={twMerge(
        "inline-flex h-4 w-8 items-center justify-center rounded-sm border border-white/10 bg-white/6",
        "font-mono text-[10px] font-semibold leading-none tracking-tight text-zinc-300",
      )}
      aria-hidden
    >
      {text}
    </span>
  );
}

function stripOpSuffix(label: string): string {
  // "Add (+)" -> "Add", "Sine (sin)" -> "Sine"
  const idx = label.indexOf(" (");
  return idx >= 0 ? label.slice(0, idx) : label;
}

export function mathOperationSelectOptions(
  options: ReadonlyArray<{ value: MathOperation; label: string }>,
): TRNSelectOption[] {
  return options.map((o) => {
    const chip = mathOperationShortLabel(o.value);
    return {
      value: o.value,
      label: stripOpSuffix(o.label),
      icon: mathOpChip(chip),
    };
  });
}

