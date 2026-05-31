import { ReadingLabel } from "./ReadingLabel";
import { ReadingNumber } from "./ReadingNumber";
import { ReadingsGridAxisHeader } from "./ReadingsGridAxisHeader";
import {
  INSPECTOR_READINGS_EMPTY_CELL,
  INSPECTOR_READINGS_GRID_5,
  INSPECTOR_READINGS_ROW_CLASS,
  INSPECTOR_READINGS_VALUE_CELL,
} from "./inspector-readings-grid";
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
 * BMI270 inspector matrix — five columns: `[label | w | x | y | z]`.
 * Vec3 rows leave `w` empty so columns stay aligned with the quaternion row.
 */
export function Bmi270AlignedReadings(props: Bmi270AlignedReadingsProps) {
  const { accel, gyro, euler, quaternion, temp } = props;

  return (
    <div className="min-w-0 w-full">
      <ReadingsGridAxisHeader
        gridTemplateColumns={INSPECTOR_READINGS_GRID_5}
        axes={["w", "x", "y", "z"]}
      />
      <Vec3ReadingRow label="Accel (m/s²)" v={accel} fractionDigits={2} />
      <Vec3ReadingRow label="Gyro (rad/s)" v={gyro} fractionDigits={2} />
      <Vec3ReadingRow label="Euler (rad)" v={euler} fractionDigits={3} />
      <QuaternionReadingRow quaternion={quaternion} />
      <ScalarFooterRow label="Temp (°C)" value={temp} fractionDigits={2} />
    </div>
  );
}

function Vec3ReadingRow(props: {
  label: string;
  v: Bmi270Vec3Snapshot;
  fractionDigits: number;
}) {
  const { label, v, fractionDigits } = props;
  return (
    <div
      className={INSPECTOR_READINGS_ROW_CLASS}
      style={{ gridTemplateColumns: INSPECTOR_READINGS_GRID_5 }}
    >
      <ReadingLabel className="min-w-0 self-center">{label}</ReadingLabel>
      <span className={INSPECTOR_READINGS_EMPTY_CELL} aria-hidden />
      <ReadingNumber
        value={v.x}
        fractionDigits={fractionDigits}
        className={`${INSPECTOR_READINGS_VALUE_CELL} ${readingParamAxisValueClass("x")}`}
      />
      <ReadingNumber
        value={v.y}
        fractionDigits={fractionDigits}
        className={`${INSPECTOR_READINGS_VALUE_CELL} ${readingParamAxisValueClass("y")}`}
      />
      <ReadingNumber
        value={v.z}
        fractionDigits={fractionDigits}
        className={`${INSPECTOR_READINGS_VALUE_CELL} ${readingParamAxisValueClass("z")}`}
      />
    </div>
  );
}

function QuaternionReadingRow(props: { quaternion: Bmi270QuaternionSnapshot }) {
  const { quaternion } = props;
  return (
    <div
      className={INSPECTOR_READINGS_ROW_CLASS}
      style={{ gridTemplateColumns: INSPECTOR_READINGS_GRID_5 }}
    >
      <ReadingLabel className="min-w-0 self-center">Quaternion</ReadingLabel>
      <ReadingNumber
        value={quaternion.w}
        fractionDigits={3}
        className={`${INSPECTOR_READINGS_VALUE_CELL} ${readingParamAxisValueClass("w")}`}
      />
      <ReadingNumber
        value={quaternion.x}
        fractionDigits={3}
        className={`${INSPECTOR_READINGS_VALUE_CELL} ${readingParamAxisValueClass("x")}`}
      />
      <ReadingNumber
        value={quaternion.y}
        fractionDigits={3}
        className={`${INSPECTOR_READINGS_VALUE_CELL} ${readingParamAxisValueClass("y")}`}
      />
      <ReadingNumber
        value={quaternion.z}
        fractionDigits={3}
        className={`${INSPECTOR_READINGS_VALUE_CELL} ${readingParamAxisValueClass("z")}`}
      />
    </div>
  );
}

function ScalarFooterRow(props: {
  label: string;
  value: number | null | undefined;
  fractionDigits: number;
}) {
  const { label, value, fractionDigits } = props;
  return (
    <div
      className={`${INSPECTOR_READINGS_ROW_CLASS} border-zinc-700/45 pt-2`}
      style={{ gridTemplateColumns: INSPECTOR_READINGS_GRID_5 }}
    >
      <ReadingLabel className="min-w-0 self-center">{label}</ReadingLabel>
      <ReadingNumber
        value={value}
        fractionDigits={fractionDigits}
        signedPositive={false}
        className={`col-span-4 ${INSPECTOR_READINGS_VALUE_CELL} text-zinc-100`}
      />
    </div>
  );
}
