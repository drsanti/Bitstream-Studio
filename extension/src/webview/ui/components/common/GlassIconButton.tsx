import React from "react";
import { twMerge } from "tailwind-merge";
import { GlassButton, type GlassButtonColor } from "./GlassButton";

/** @deprecated Prefer TRN icon/button primitives for new code. */
export type GlassIconButtonVariant = "glass" | "ghost";

/** @deprecated Prefer TRN icon/button primitives for new code. */
export type GlassIconButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "children"
> & {
  /** Required for icon-only controls. */
  "aria-label": string;
  icon: React.ReactNode;
  color?: GlassButtonColor;
  className?: string;
  /**
   * `glass` — frosted border + tint (default).
   * `ghost` — icon only; no border/background; subtle hover wash (use `className` to tune).
   */
  variant?: GlassIconButtonVariant;
  /**
   * `compact` — smaller hit target, no extra padding, smaller glyph (e.g. dense toolbars).
   */
  compact?: boolean;
  /** When set, forwarded as `aria-pressed` (e.g. auto-scroll toggle). */
  pressed?: boolean;
};

const layoutDefault =
  "!h-8 !w-8 !min-h-8 !min-w-8 shrink-0 !gap-0 !px-0 !py-0 [&_svg]:!size-3.5";

const layoutCompact =
  "!h-6 !w-6 !min-h-6 !min-w-6 shrink-0 !gap-0 !p-0 [&_svg]:!size-3";

/** Neutralizes {@link GlassButton} chrome; merged after color presets. */
const ghostChromeReset =
  "!border-transparent !shadow-none !backdrop-blur-none !bg-transparent hover:!bg-white/[0.08] active:!bg-white/[0.12] disabled:hover:!bg-transparent disabled:active:!bg-transparent";

/** Icon tint for `ghost` (background/border from presets are stripped). */
const ghostTint: Record<GlassButtonColor, string> = {
  gray: "text-zinc-400 hover:text-zinc-200",
  blue: "text-blue-300/90 hover:text-blue-200",
  red: "text-red-300/90 hover:text-red-200",
  emerald: "text-emerald-400/90 hover:text-emerald-300",
  amber: "text-amber-300/90 hover:text-amber-200",
  violet: "text-violet-300/90 hover:text-violet-200",
};

/** @deprecated Prefer TRN icon/button primitives for new code. */
/** Square glass button with a single icon; wraps {@link GlassButton}. */
export const GlassIconButton = React.forwardRef<
  HTMLButtonElement,
  GlassIconButtonProps
>(function GlassIconButton(
  {
    icon,
    color = "gray",
    className,
    pressed,
    compact = false,
    variant = "glass",
    type = "button",
    "aria-pressed": ariaPressedProp,
    ...rest
  },
  ref,
) {
  const ariaPressed =
    pressed !== undefined ? pressed : ariaPressedProp;

  return (
    <GlassButton
      ref={ref}
      type={type}
      color={color}
      size="sm"
      icon={icon}
      aria-pressed={ariaPressed}
      className={twMerge(
        compact ? layoutCompact : layoutDefault,
        variant === "ghost"
          ? twMerge(ghostChromeReset, ghostTint[color])
          : null,
        className,
      )}
      {...rest}
    />
  );
});

GlassIconButton.displayName = "GlassIconButton";
