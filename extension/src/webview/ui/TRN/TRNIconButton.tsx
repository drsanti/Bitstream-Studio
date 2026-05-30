import type { ButtonHTMLAttributes, ReactNode } from "react";

type TRNIconButtonProps = {
  icon: ReactNode;
  label: string;
  className?: string;
  /** When false, omit native `title` (pair with TRNTooltip). Default true. */
  nativeTitle?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function TRNIconButton({
  icon,
  label,
  className = "",
  nativeTitle = true,
  disabled,
  ...props
}: TRNIconButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      {...(nativeTitle ? { title: label } : {})}
      className={
        "inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-700/80 " +
        "bg-zinc-900/80 p-0 text-zinc-100 transition-colors hover:bg-zinc-800/70 " +
        "disabled:cursor-not-allowed disabled:opacity-50 " +
        className
      }
      {...props}
    >
      {icon}
    </button>
  );
}
