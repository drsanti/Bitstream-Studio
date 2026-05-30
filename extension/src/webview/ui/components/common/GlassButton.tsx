import React from "react";
import { twMerge } from "tailwind-merge";

/** @deprecated Use `TRNGlassButton` tone/color API for new code. */
export type GlassButtonColor =
  | "gray"
  | "blue"
  | "red"
  | "emerald"
  | "amber"
  | "violet";

/** @deprecated Use `TRNGlassButtonProps` from `@/ui/TRN` for new code. */
export type GlassButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "children"
> & {
  /** Glass tint; default neutral gray. Custom hues: override with `className`. */
  color?: GlassButtonColor;
  /**
   * `sm` compact; `md` larger tap target; `control` matches `commonInputFieldClassName` / combobox (h-9).
   */
  size?: "sm" | "md" | "control";
  className?: string;
} & (
  | { children: React.ReactNode; icon?: React.ReactNode }
  | { icon: React.ReactNode; children?: React.ReactNode }
);

const glassBase =
  "inline-flex shrink-0 items-center justify-center rounded-md border shadow-sm backdrop-blur-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

const colorClasses: Record<GlassButtonColor, string> = {
  gray:
    "border-white/12 bg-white/[0.06] text-zinc-100 hover:bg-white/[0.10] active:bg-white/[0.13]",
  blue:
    "border-blue-400/22 bg-blue-500/[0.14] text-blue-100 hover:bg-blue-500/22 active:bg-blue-500/28",
  red:
    "border-red-400/25 bg-red-500/[0.14] text-red-100 hover:bg-red-500/22 active:bg-red-500/28",
  emerald:
    "border-emerald-400/22 bg-emerald-500/[0.14] text-emerald-100 hover:bg-emerald-500/22 active:bg-emerald-500/28",
  amber:
    "border-amber-400/25 bg-amber-500/[0.14] text-amber-100 hover:bg-amber-500/22 active:bg-amber-500/28",
  violet:
    "border-violet-400/22 bg-violet-500/[0.14] text-violet-100 hover:bg-violet-500/22 active:bg-violet-500/28",
};

const sizeClasses: Record<NonNullable<GlassButtonProps["size"]>, string> = {
  sm: "px-2 py-[3px] text-xs font-medium gap-1.5",
  md: "px-3 py-1.5 text-sm font-medium gap-2",
  control:
    "box-border min-h-9 h-9 px-3 py-0 text-sm font-medium gap-2 leading-normal",
};

/**
 * @deprecated Prefer `TRNGlassButton` for new development.
 * Frosted glass button; use `color` for tint presets or `className` for full control.
 * Pass `icon` for a leading icon; provide `children` and/or `icon` (at least one required).
 */
export const GlassButton = React.forwardRef<
  HTMLButtonElement,
  GlassButtonProps
>(function GlassButton(
  {
    color = "gray",
    size = "sm",
    className,
    disabled,
    children,
    icon,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={twMerge(
        glassBase,
        sizeClasses[size],
        colorClasses[color],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
});

GlassButton.displayName = "GlassButton";
