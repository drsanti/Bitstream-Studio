import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { ReadingLabel } from "./ReadingLabel";
import { ReadingNumber, type ReadingNumberProps } from "./ReadingNumber";
import { ReadingRow } from "./ReadingRow";

export type ScalarReadingRowProps = {
  label: ReactNode;
  value: ReadingNumberProps["value"];
  fractionDigits?: number;
  valueClassName?: string;
  signedPositive?: boolean;
  className?: string;
};

export function ScalarReadingRow(props: ScalarReadingRowProps) {
  const { label, value, fractionDigits = 2, valueClassName, signedPositive = true, className } =
    props;

  return (
    <ReadingRow
      className={className}
      label={
        typeof label === "string" ? <ReadingLabel>{label}</ReadingLabel> : label
      }
      values={
        <ReadingNumber
          value={value}
          fractionDigits={fractionDigits}
          signedPositive={signedPositive}
          className={twMerge("text-[10px]", valueClassName ?? "text-zinc-100")}
        />
      }
    />
  );
}
