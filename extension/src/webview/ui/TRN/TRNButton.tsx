import type { ButtonHTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

type TRNButtonProps = {
  children: ReactNode;
  selected?: boolean;
  size?: "default" | "compact";
  className?: string;
  /** UI-only prop, not forwarded to DOM */
  prefixIcon?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function TRNButton({
  children,
  selected = false,
  size = "default",
  className = "",
  disabled,
  prefixIcon,
  ...props
}: TRNButtonProps) {
  const sizeClass =
    size === "compact" ? "h-6 min-w-10 px-2 text-xs font-medium" : "h-8 min-w-12 px-3 text-sm font-semibold";
  const toneClass = selected
    ? "border-zinc-700/80 bg-cyan-500/20 text-cyan-100"
    : "border-zinc-700/80 bg-zinc-900/75 text-zinc-100 hover:bg-zinc-800/75";

  return (
    <button
      type="button"
      disabled={disabled}
      className={twMerge(
        "inline-flex items-center justify-center rounded-sm border transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        sizeClass,
        toneClass,
        className,
      )}
      {...props}
    >
      {prefixIcon ? (
        <span className="mr-1 inline-flex shrink-0 items-center">{prefixIcon}</span>
      ) : null}
      {children}
    </button>
  );
}
