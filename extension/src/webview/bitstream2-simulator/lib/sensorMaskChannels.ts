import { BMI270_MASK } from "../../../bitstream2/domains/sensors/bmi270";
import { BMM350_MASK } from "../../../bitstream2/domains/sensors/bmm350";
import { SHT40_MASK } from "../../../bitstream2/domains/sensors/sht40";
import { DPS368_MASK } from "../../../bitstream2/domains/sensors/dps368";
import { BS2_SENSOR_ID } from "../../../bitstream2/domains/sensors/sensor-ids";

export type SensorMaskChannelDef = {
  bit: number;
  label: string;
};

export type SensorMaskPreset = {
  id: string;
  label: string;
  mask: number;
};

export type SensorMaskUiSpec = {
  channels: SensorMaskChannelDef[];
  presets: SensorMaskPreset[];
};

const BMI270_SPEC: SensorMaskUiSpec = {
  channels: [
    { bit: BMI270_MASK.ACC, label: "Accel" },
    { bit: BMI270_MASK.GYR, label: "Gyro" },
    { bit: BMI270_MASK.TMP, label: "Temp" },
    { bit: BMI270_MASK.EULER, label: "Euler" },
    { bit: BMI270_MASK.QUAT, label: "Quaternion" },
  ],
  presets: [
    { id: "all", label: "All", mask: 0x1f },
    { id: "imu", label: "IMU raw", mask: BMI270_MASK.ACC | BMI270_MASK.GYR | BMI270_MASK.TMP },
    { id: "motion", label: "Motion", mask: BMI270_MASK.ACC | BMI270_MASK.GYR },
  ],
};

const BMM350_SPEC: SensorMaskUiSpec = {
  channels: [
    { bit: BMM350_MASK.MAG, label: "Magnetometer" },
    { bit: BMM350_MASK.TMP, label: "Temp" },
  ],
  presets: [
    { id: "all", label: "All", mask: 0x03 },
    { id: "mag", label: "Mag only", mask: BMM350_MASK.MAG },
  ],
};

const SHT40_SPEC: SensorMaskUiSpec = {
  channels: [
    { bit: SHT40_MASK.TEMP, label: "Temp" },
    { bit: SHT40_MASK.HUM, label: "Humidity" },
  ],
  presets: [
    { id: "all", label: "All", mask: 0x03 },
    { id: "temp", label: "Temp only", mask: SHT40_MASK.TEMP },
  ],
};

const DPS368_SPEC: SensorMaskUiSpec = {
  channels: [
    { bit: DPS368_MASK.PRESS, label: "Pressure" },
    { bit: DPS368_MASK.TMP, label: "Temp" },
  ],
  presets: [
    { id: "all", label: "All", mask: 0x03 },
    { id: "press", label: "Pressure only", mask: DPS368_MASK.PRESS },
  ],
};

const SPECS: Record<number, SensorMaskUiSpec> = {
  [BS2_SENSOR_ID.BMI270]: BMI270_SPEC,
  [BS2_SENSOR_ID.BMM350]: BMM350_SPEC,
  [BS2_SENSOR_ID.SHT40]: SHT40_SPEC,
  [BS2_SENSOR_ID.DPS368]: DPS368_SPEC,
};

export function getSensorMaskUiSpec(sensorId: number): SensorMaskUiSpec | null {
  return SPECS[sensorId] ?? null;
}

export function toggleMaskBit(mask: number, bit: number, on: boolean): number {
  if (on) {
    return (mask | bit) & 0xff;
  }
  return mask & ~bit & 0xff;
}
