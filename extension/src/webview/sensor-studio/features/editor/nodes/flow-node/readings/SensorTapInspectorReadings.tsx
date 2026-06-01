import type { StudioNodeData } from "../../../store/flow-editor.store";
import { ReadingLabel } from "./ReadingLabel";
import { ReadingNumber } from "./ReadingNumber";
import { ReadingsGridAxisHeader } from "./ReadingsGridAxisHeader";
import {
  INSPECTOR_READINGS_GRID_4,
  INSPECTOR_READINGS_GRID_5,
  INSPECTOR_READINGS_ROW_CLASS,
  INSPECTOR_READINGS_VALUE_CELL,
} from "./inspector-readings-grid";
import { readingParamAxisValueClass } from "./param-axis-classes";
import { SENSOR_TEMPERATURE_PORT_LABEL } from "../../../../../core/sensor-port-labels";

export type SensorTapInspectorReadingsProps = {
  nodeId: string;
  data: StudioNodeData;
};

/** Compact live readout for single-output sensor tap nodes (inspector Live tab). */
export function SensorTapInspectorReadings(props: SensorTapInspectorReadingsProps) {
  const { nodeId, data } = props;
  const quat = data.liveQuaternionWire ?? { w: 1, x: 0, y: 0, z: 0 };
  const vec3 = data.liveVector3Wire ?? { x: 0, y: 0, z: 0 };
  const scalar = typeof data.liveValue === "number" ? data.liveValue : undefined;

  switch (nodeId) {
    case "bmi270-tap-quaternion":
      return (
        <div className="min-w-0 w-full">
          <ReadingsGridAxisHeader
            gridTemplateColumns={INSPECTOR_READINGS_GRID_5}
            axes={["w", "x", "y", "z"]}
          />
          <div
            className={INSPECTOR_READINGS_ROW_CLASS}
            style={{ gridTemplateColumns: INSPECTOR_READINGS_GRID_5 }}
          >
            <ReadingLabel className="min-w-0 self-center">Quaternion</ReadingLabel>
            <ReadingNumber
              value={quat.w}
              fractionDigits={3}
              className={`${INSPECTOR_READINGS_VALUE_CELL} ${readingParamAxisValueClass("w")}`}
            />
            <ReadingNumber
              value={quat.x}
              fractionDigits={3}
              className={`${INSPECTOR_READINGS_VALUE_CELL} ${readingParamAxisValueClass("x")}`}
            />
            <ReadingNumber
              value={quat.y}
              fractionDigits={3}
              className={`${INSPECTOR_READINGS_VALUE_CELL} ${readingParamAxisValueClass("y")}`}
            />
            <ReadingNumber
              value={quat.z}
              fractionDigits={3}
              className={`${INSPECTOR_READINGS_VALUE_CELL} ${readingParamAxisValueClass("z")}`}
            />
          </div>
        </div>
      );
    case "bmi270-tap-euler":
      return (
        <Vec3TapRow label="Euler (rad)" vector={vec3} fractionDigits={3} />
      );
    case "bmi270-tap-accel":
      return (
        <Vec3TapRow label="Accel (m/s²)" vector={vec3} fractionDigits={2} />
      );
    case "bmi270-tap-gyro":
      return (
        <Vec3TapRow label="Gyro (rad/s)" vector={vec3} fractionDigits={2} />
      );
    case "bmi270-tap-temp":
      return <ScalarTapRow label={SENSOR_TEMPERATURE_PORT_LABEL} value={scalar} fractionDigits={2} />;
    case "bmm350-tap-magnetic":
      return (
        <Vec3TapRow label="Magnetic (µT)" vector={vec3} fractionDigits={2} />
      );
    case "bmm350-tap-temp":
      return <ScalarTapRow label={SENSOR_TEMPERATURE_PORT_LABEL} value={scalar} fractionDigits={2} />;
    case "dps368-tap-pressure":
      return (
        <ScalarTapRow label="Pressure (hPa)" value={scalar} fractionDigits={1} />
      );
    case "dps368-tap-temp":
      return <ScalarTapRow label={SENSOR_TEMPERATURE_PORT_LABEL} value={scalar} fractionDigits={2} />;
    case "sht40-tap-humidity":
      return (
        <ScalarTapRow label="Humidity (%RH)" value={scalar} fractionDigits={2} />
      );
    case "sht40-tap-temp":
      return <ScalarTapRow label={SENSOR_TEMPERATURE_PORT_LABEL} value={scalar} fractionDigits={2} />;
    default:
      return null;
  }
}

function Vec3TapRow(props: {
  label: string;
  vector: { x: number; y: number; z: number };
  fractionDigits: number;
}) {
  const { label, vector, fractionDigits } = props;
  return (
    <div className="min-w-0 w-full">
      <ReadingsGridAxisHeader
        gridTemplateColumns={INSPECTOR_READINGS_GRID_4}
        axes={["x", "y", "z"]}
      />
      <div
        className={INSPECTOR_READINGS_ROW_CLASS}
        style={{ gridTemplateColumns: INSPECTOR_READINGS_GRID_4 }}
      >
        <ReadingLabel className="min-w-0 self-center">{label}</ReadingLabel>
        <ReadingNumber
          value={vector.x}
          fractionDigits={fractionDigits}
          className={`${INSPECTOR_READINGS_VALUE_CELL} ${readingParamAxisValueClass("x")}`}
        />
        <ReadingNumber
          value={vector.y}
          fractionDigits={fractionDigits}
          className={`${INSPECTOR_READINGS_VALUE_CELL} ${readingParamAxisValueClass("y")}`}
        />
        <ReadingNumber
          value={vector.z}
          fractionDigits={fractionDigits}
          className={`${INSPECTOR_READINGS_VALUE_CELL} ${readingParamAxisValueClass("z")}`}
        />
      </div>
    </div>
  );
}

function ScalarTapRow(props: {
  label: string;
  value: number | undefined;
  fractionDigits: number;
}) {
  const { label, value, fractionDigits } = props;
  return (
    <div className="min-w-0 w-full">
      <div
        className={INSPECTOR_READINGS_ROW_CLASS}
        style={{ gridTemplateColumns: INSPECTOR_READINGS_GRID_4 }}
      >
        <ReadingLabel className="min-w-0 self-center">{label}</ReadingLabel>
        <ReadingNumber
          value={value}
          fractionDigits={fractionDigits}
          signedPositive={false}
          className={`col-span-3 ${INSPECTOR_READINGS_VALUE_CELL} text-zinc-100`}
        />
      </div>
    </div>
  );
}
