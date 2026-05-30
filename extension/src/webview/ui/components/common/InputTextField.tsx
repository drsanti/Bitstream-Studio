import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { commonInputFieldClassName } from "./field-styles";

export interface InputTextFieldProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  label?: string;
  className?: string;
  /** Merged with the default control classes (Tailwind-merge). */
  textareaClassName?: string;
}

/** Multi-line text control, vertically user-resizable. */
export const InputTextField = React.forwardRef<
  HTMLTextAreaElement,
  InputTextFieldProps
>(function InputTextField(
  {
    label,
    className,
    textareaClassName,
    id,
    rows = 4,
    ...rest
  },
  ref,
) {
  const textareaId =
    id ??
    (label
      ? `input-text-field-${label.replace(/\s+/g, "-").toLowerCase()}`
      : undefined);

  return (
    <div className={clsx("flex flex-col gap-1", className)}>
      {label ? (
        <label
          htmlFor={textareaId}
          className="text-sm text-zinc-400"
        >
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={twMerge(
          commonInputFieldClassName,
          "h-auto min-h-20 resize-y font-[inherit] leading-normal",
          textareaClassName,
        )}
        {...rest}
      />
    </div>
  );
});
