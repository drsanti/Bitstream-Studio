import React from "react";
import { clsx } from "clsx";

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    /** T3D Settings: `border-white/10 bg-white/5` (e.g. Graphics Advanced / Reset). */
    | "outline"
    /** T3D Settings destructive: soft red border/fill. */
    | "outlineDanger";
  /** `compact`: minimal vertical padding (Serial Monitor toolbar style). */
  size?: "default" | "compact";
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "border border-transparent bg-blue-600 hover:bg-blue-700 text-white",
  secondary: "border border-transparent bg-gray-600 hover:bg-gray-500 text-white",
  danger: "border border-transparent bg-red-600 hover:bg-red-700 text-white",
  outline:
    "border border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10 transition-colors",
  outlineDanger:
    "border border-red-500/30 bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "px-4 py-2 font-semibold",
  compact: "px-2 py-1 text-xs font-medium",
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "default",
  className,
  disabled,
  children,
  ...rest
}) => {
  return (
    <button
      type="button"
      className={clsx(
        "rounded disabled:cursor-not-allowed disabled:opacity-50",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};
