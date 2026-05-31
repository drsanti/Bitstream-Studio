import type { LucideIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { TRNFormField } from "./TRNForm.js";

export type TRNIconOptionGroupOption<T extends string> = {
  value: T;
  label: string;
  title?: string;
  icon?: LucideIcon;
};

export type TRNIconOptionGroupProps<T extends string> = {
  label?: string;
  value: T;
  options: TRNIconOptionGroupOption<T>[];
  onChange: (value: T) => void;
  layout?: "row" | "column";
  className?: string;
  disabled?: boolean;
};

export function TRNIconOptionGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  layout = "column",
  className,
  disabled = false,
}: TRNIconOptionGroupProps<T>) {
  const gridClass =
    layout === "row" ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2";

  const buttons = (
    <div className={gridClass} role="radiogroup" aria-label={label}>
      {options.map((opt) => {
        const selected = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            title={opt.title}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={twMerge(
              "inline-flex h-8 w-full items-center justify-center gap-1.5 rounded border px-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-50",
              selected
                ? "border-zinc-700/80 bg-cyan-500/20 text-cyan-100"
                : "border-zinc-700/80 bg-zinc-950/90 text-zinc-300 hover:bg-zinc-800/70",
            )}
          >
            {Icon != null ? (
              <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
            ) : null}
            <span className="truncate text-center">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );

  if (label != null && label.length > 0) {
    return (
      <TRNFormField label={label} className={className}>
        {buttons}
      </TRNFormField>
    );
  }

  return <div className={className}>{buttons}</div>;
}
