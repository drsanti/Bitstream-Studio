import type { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";
import { formatSignedFixed } from "./format-signed-number";

export type ReadingNumberProps = HTMLAttributes<HTMLSpanElement> & {
  value: number | null | undefined;
  /** Decimal places when `value` is a finite number. */
  fractionDigits?: number;
  /**
   * When true (default), positive values get a `+` prefix.
   * Set false for values that are never meaningfully signed in the UI (e.g. always ≥ 0).
   */
  signedPositive?: boolean;
  /** Shown when `value` is not a finite number. */
  emptyChar?: string;
};

export function ReadingNumber(props: ReadingNumberProps) {
  const {
    value,
    fractionDigits = 2,
    signedPositive = true,
    emptyChar = "—",
    className,
    ...rest
  } = props;
  const text =
    typeof value === "number" && Number.isFinite(value)
      ? signedPositive
        ? formatSignedFixed(value, fractionDigits)
        : value.toFixed(fractionDigits)
      : emptyChar;

  return (
    <span
      className={twMerge("font-mono tabular-nums text-zinc-100", className)}
      {...rest}
    >
      {text}
    </span>
  );
}
