import { forwardRef, type TextareaHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";
import {
  TRN_INPUT_CONTROL_CLASS,
  trnInputRowClass,
  trnInputTextSizeClass,
  type TRNInputSize,
  type TRNInputVariant,
} from "./trnInputClasses.js";

export type TRNTextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> & {
  size?: TRNInputSize;
  variant?: TRNInputVariant;
  invalid?: boolean;
  /** Wrapper chrome (not the native textarea). */
  className?: string;
  textareaClassName?: string;
};

export const TRNTextarea = forwardRef<HTMLTextAreaElement, TRNTextareaProps>(
  function TRNTextarea(props, ref) {
    const {
      size = "sm",
      variant = "outlined",
      invalid = false,
      className,
      textareaClassName,
      disabled,
      rows = 4,
      ...textareaRest
    } = props;

    const rowClass = twMerge(
      trnInputRowClass(variant, size, invalid, disabled === true),
      "items-stretch",
      className,
    );

    const controlClass = twMerge(
      TRN_INPUT_CONTROL_CLASS,
      trnInputTextSizeClass(size),
      "min-h-0 resize-y py-1.5 text-zinc-100",
      textareaClassName,
    );

    return (
      <div className={rowClass}>
        <textarea
          ref={ref}
          disabled={disabled}
          rows={rows}
          aria-invalid={invalid || undefined}
          className={controlClass}
          {...textareaRest}
        />
      </div>
    );
  },
);
