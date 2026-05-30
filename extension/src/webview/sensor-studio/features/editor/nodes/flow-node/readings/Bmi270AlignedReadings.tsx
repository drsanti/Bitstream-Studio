import { ReadingLabel } from "./ReadingLabel";
import { ReadingNumber } from "./ReadingNumber";
import { readingParamAxisValueClass } from "./param-axis-classes";

/** Wire snapshots passed from `tickSimulation` (same layout as graph pins). */
export type Bmi270Vec3Snapshot = { x: number; y: number; z: number };

export type Bmi270QuaternionSnapshot = { w: number; x: number; y: number; z: number };

export type Bmi270AlignedReadingsProps = {
  accel: Bmi270Vec3Snapshot;
  gyro: Bmi270Vec3Snapshot;
  euler: Bmi270Vec3Snapshot;
  quaternion: Bmi270QuaternionSnapshot;
  temp: number | null | undefined;
};

/**
 * BMI270 live panel: columns `[label | (w) | x | y | z]` so vec3 rows share x,y,z
 * columns with the quaternion row; `w` is only used on the Quaternion row.
 */
export function Bmi270AlignedReadings(props: Bmi270AlignedReadingsProps) {
  const { accel, gyro, euler, quaternion, temp } = props;

  return (
    <div className="min-w-0 space-y-1">
      <div
        className="grid w-max max-w-full items-baseline gap-x-2 gap-y-1 text-[10px]"
        style={{
          gridTemplateColumns:
            "minmax(0, max-content) minmax(2.25rem, max-content) repeat(3, minmax(2.75rem, max-content))",
        }}
      >
        <Vec3ReadingCells
          label="Accel (m/s²)"
          v={accel}
          fractionDigits={2}
        />
        <Vec3ReadingCells
          label="Gyro (rad/s)"
          v={gyro}
          fractionDigits={2}
        />
        <Vec3ReadingCells
          label="Euler (rad)"
          v={euler}
          fractionDigits={3}
        />
        <ReadingLabel className="min-w-0">Quaternion</ReadingLabel>
        <ReadingNumber
          value={quaternion.w}
          fractionDigits={3}
          className={`text-right ${readingParamAxisValueClass("w")}`}
        />
        <ReadingNumber
          value={quaternion.x}
          fractionDigits={3}
          className={`text-right ${readingParamAxisValueClass("x")}`}
        />
        <ReadingNumber
          value={quaternion.y}
          fractionDigits={3}
          className={`text-right ${readingParamAxisValueClass("y")}`}
        />
        <ReadingNumber
          value={quaternion.z}
          fractionDigits={3}
          className={`text-right ${readingParamAxisValueClass("z")}`}
        />
      </div>

      <div className="flex items-baseline justify-between gap-2 border-t border-zinc-700/50 pt-1.5 text-[10px]">
        <ReadingLabel>Temp (°C)</ReadingLabel>
        <ReadingNumber
          value={temp}
          fractionDigits={2}
          className="text-zinc-200/95"
        />
      </div>
    </div>
  );
}

function Vec3ReadingCells(props: {
  label: string;
  v: Bmi270Vec3Snapshot;
  fractionDigits: number;
}) {
  const { label, v, fractionDigits } = props;
  return (
    <div className="contents">
      <ReadingLabel className="min-w-0">{label}</ReadingLabel>
      <span className="min-w-9 shrink-0" aria-hidden />
      <ReadingNumber
        value={v.x}
        fractionDigits={fractionDigits}
        className={`text-right ${readingParamAxisValueClass("x")}`}
      />
      <ReadingNumber
        value={v.y}
        fractionDigits={fractionDigits}
        className={`text-right ${readingParamAxisValueClass("y")}`}
      />
      <ReadingNumber
        value={v.z}
        fractionDigits={fractionDigits}
        className={`text-right ${readingParamAxisValueClass("z")}`}
      />
    </div>
  );
}
