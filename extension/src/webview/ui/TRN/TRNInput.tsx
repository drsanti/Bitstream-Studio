/*******************************************************************************
 * File Name        : TRNInput.tsx
 *
 * Description      : Text input with optional prefix icon, suffix slot, and password toggle.
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.0
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import {
  forwardRef,
  isValidElement,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { twMerge } from "tailwind-merge";
import {
  TRN_INPUT_CONTROL_CLASS,
  trnInputRowClass,
  trnInputTextSizeClass,
  type TRNInputSize,
  type TRNInputVariant,
} from "./trnInputClasses.js";

export type { TRNInputSize, TRNInputVariant } from "./trnInputClasses.js";

export type TRNInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> & {
  /** Lucide component or custom React node (e.g. colored icon). */
  prefixIcon?: LucideIcon | ReactNode;
  /** Trailing slot (overrides built-in password toggle when set). */
  suffix?: ReactNode;
  /** When type is password, show reveal toggle unless set to false. */
  showPasswordToggle?: boolean;
  size?: TRNInputSize;
  variant?: TRNInputVariant;
  invalid?: boolean;
  /** Row chrome (not the native input). */
  className?: string;
  inputClassName?: string;
};

/** Render prefix as a Lucide component or pass-through React element. */
function renderPrefixIcon(prefix: LucideIcon | ReactNode): ReactNode {
  if (isValidElement(prefix)) {
    return prefix;
  }
  const Icon = prefix as LucideIcon;
  return <Icon className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />;
}

export const TRNInput = forwardRef<HTMLInputElement, TRNInputProps>(function TRNInput(
  props,
  ref,
) {
  const {
    prefixIcon,
    suffix,
    showPasswordToggle,
    size = "sm",
    variant = "ghost",
    invalid = false,
    className,
    inputClassName,
    disabled,
    type: typeProp,
    ...inputRest
  } = props;

  const [passwordVisible, setPasswordVisible] = useState(false);

  const isPassword = typeProp === "password";
  const effectiveType =
    isPassword && showPasswordToggle !== false && passwordVisible ? "text" : typeProp;

  const useBuiltInToggle =
    isPassword && showPasswordToggle !== false && suffix == null && !disabled;

  const rowClass = twMerge(
    trnInputRowClass(variant, size, invalid, disabled === true),
    className,
  );

  const controlClass = twMerge(
    TRN_INPUT_CONTROL_CLASS,
    trnInputTextSizeClass(size),
    "text-zinc-100",
    inputClassName,
  );

  return (
    <div className={rowClass}>
      {prefixIcon != null ? renderPrefixIcon(prefixIcon) : null}
      <input
        ref={ref}
        type={effectiveType}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={controlClass}
        {...inputRest}
      />
      {suffix != null ? (
        <span className="inline-flex shrink-0 items-center">{suffix}</span>
      ) : null}
      {useBuiltInToggle ? (
        <button
          type="button"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-800/70 hover:text-zinc-300 disabled:pointer-events-none"
          aria-label={passwordVisible ? "Hide password" : "Show password"}
          onClick={() => setPasswordVisible((v) => !v)}
          tabIndex={0}
        >
          {passwordVisible ? (
            <EyeOff className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Eye className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>
      ) : null}
    </div>
  );
});
