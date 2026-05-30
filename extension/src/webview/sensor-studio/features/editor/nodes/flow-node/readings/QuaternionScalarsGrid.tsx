import { ReadingAxisNumber } from "./ReadingAxisNumber";

export type QuaternionScalarsGridProps = {
  w: number | null | undefined;
  x: number | null | undefined;
  y: number | null | undefined;
  z: number | null | undefined;
  fractionDigits?: number;
  /** Merged per component; axis default tints apply when omitted. */
  valueClassName?: string;
};

/** Four quaternion components in one row (aligns with BMI270 quaternion column order: w, x, y, z). */
export function QuaternionScalarsGrid(props: QuaternionScalarsGridProps) {
  const { w, x, y, z, fractionDigits = 3, valueClassName } = props;

  return (
    <div className="grid w-max max-w-full grid-cols-4 items-baseline justify-items-end gap-x-2 text-[10px]">
      <ReadingAxisNumber axis="w" value={w} fractionDigits={fractionDigits} className={valueClassName} />
      <ReadingAxisNumber axis="x" value={x} fractionDigits={fractionDigits} className={valueClassName} />
      <ReadingAxisNumber axis="y" value={y} fractionDigits={fractionDigits} className={valueClassName} />
      <ReadingAxisNumber axis="z" value={z} fractionDigits={fractionDigits} className={valueClassName} />
    </div>
  );
}
