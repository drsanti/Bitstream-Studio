import React from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "./Button";

export interface OptionButton<T extends string> {
  value: T;
  label: string;
  title?: string;
  icon?: LucideIcon;
}

export interface OptionButtonGroupProps<T extends string> {
  value: T;
  options: OptionButton<T>[];
  onChange: (value: T) => void;
  className?: string;
  layout?: "column" | "row";
}

export function OptionButtonGroup<T extends string>({
  value,
  options,
  onChange,
  className = "",
  layout = "column",
}: OptionButtonGroupProps<T>) {
  const layoutClass =
    layout === "row" ? "grid grid-cols-2 gap-2" : "space-y-2";

  return (
    <div className={`${layoutClass} ${className}`}>
      {options.map((opt) => {
        const selected = opt.value === value;
        const Icon = opt.icon;
        return (
          <Button
            key={opt.value}
            variant="secondary"
            className={`w-full h-7 inline-flex items-center justify-center gap-1.5 border backdrop-blur-md px-1.5 py-0 text-xs font-medium leading-none shadow-sm shadow-black/20 ${
              selected
                ? "border-emerald-300/25 bg-emerald-500/6! text-emerald-50 hover:bg-emerald-500/12!"
                : "border-gray-400/25 bg-slate-700/14! text-gray-100 hover:bg-slate-600/22!"
            }`}
            onClick={() => onChange(opt.value)}
            title={opt.title}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" />}
            <span className="truncate text-center">{opt.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
