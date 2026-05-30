import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { commonInputFieldClassName } from "./field-styles";

export interface InputTextProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "className"
> {
  label?: string;
  className?: string;
  /** Merged with the default control classes (Tailwind-merge). */
  inputClassName?: string;
}

/** Single-line text control with optional label. */
export const InputText = React.forwardRef<HTMLInputElement, InputTextProps>(
  function InputText(
    { label, className, inputClassName, id, type = "text", ...rest },
    ref,
  ) {
    const inputId =
      id ??
      (label
        ? `input-text-${label.replace(/\s+/g, "-").toLowerCase()}`
        : undefined);

    return (
      <div className={clsx("flex flex-col gap-1", className)}>
        {label ? (
          <label htmlFor={inputId} className="text-sm text-zinc-400">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={twMerge(commonInputFieldClassName, inputClassName)}
          {...rest}
        />
      </div>
    );
  },
);
