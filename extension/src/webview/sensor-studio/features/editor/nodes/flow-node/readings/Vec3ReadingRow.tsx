import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { ReadingAxisNumber } from "./ReadingAxisNumber";
import { ReadingLabel } from "./ReadingLabel";
import { ReadingRow } from "./ReadingRow";
import { ReadingValueGroup } from "./ReadingValueGroup";

export type Vec3ReadingRowProps = {
  /** Omit, pass `null`, or `""` to render only the value group (full-width). */
  label?: ReactNode;
  vector: { x: number; y: number; z: number } | null | undefined;
  fractionDigits?: number;
  /** Applied to each axis value (Tailwind text-* etc.). */
  valueClassName?: string;
  className?: string;
};

export function Vec3ReadingRow(props: Vec3ReadingRowProps) {
  const { label, vector, fractionDigits = 2, valueClassName, className } = props;
  const vx = vector?.x;
  const vy = vector?.y;
  const vz = vector?.z;

  const values = (
    <ReadingValueGroup>
      <ReadingAxisNumber
        axis="x"
        value={vx}
        fractionDigits={fractionDigits}
        className={valueClassName}
      />
      <ReadingAxisNumber
        axis="y"
        value={vy}
        fractionDigits={fractionDigits}
        className={valueClassName}
      />
      <ReadingAxisNumber
        axis="z"
        value={vz}
        fractionDigits={fractionDigits}
        className={valueClassName}
      />
    </ReadingValueGroup>
  );

  const hideLabel =
    label === "" || label === null || label === undefined || label === false;

  if (hideLabel) {
    return <div className={twMerge("flex justify-end", className)}>{values}</div>;
  }

  return (
    <ReadingRow
      className={className}
      label={
        typeof label === "string" ? (
          <ReadingLabel>{label}</ReadingLabel>
        ) : (
          label
        )
      }
      values={values}
    />
  );
}
