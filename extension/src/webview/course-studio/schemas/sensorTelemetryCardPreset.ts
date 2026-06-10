import { z } from "zod";
import type { SensorTelemetryCardId } from "../../bitstream-app/types/bitstreamWorkspaceTypes";

/** Telemetry deck card ids embeddable on course pages (excludes Meta diagnostics). */
export type CourseSensorTelemetryCardPreset = Exclude<SensorTelemetryCardId, "meta">;

export const courseSensorTelemetryCardPresetSchema = z.enum([
  "pressure",
  "dps368Temperature",
  "sht40Humidity",
  "sht40Temperature",
  "bmm350",
  "bmm350Temperature",
  "gyro",
  "accel",
  "temp",
  "quat",
  "euler",
]);

export const COURSE_SENSOR_TELEMETRY_CARD_PRESET_OPTIONS: ReadonlyArray<{
  value: CourseSensorTelemetryCardPreset;
  label: string;
}> = [
  { value: "euler", label: "BMI270 Euler Angles" },
  { value: "quat", label: "BMI270 Quaternion" },
  { value: "gyro", label: "BMI270 Gyroscope" },
  { value: "accel", label: "BMI270 Accelerometer" },
  { value: "temp", label: "BMI270 Temperature" },
  { value: "pressure", label: "DPS368 Pressure" },
  { value: "dps368Temperature", label: "DPS368 Temperature" },
  { value: "sht40Humidity", label: "SHT40 Humidity" },
  { value: "sht40Temperature", label: "SHT40 Temperature" },
  { value: "bmm350", label: "BMM350 Magnetic field" },
  { value: "bmm350Temperature", label: "BMM350 Temperature" },
];

export function courseSensorTelemetryCardPresetLabel(
  preset: CourseSensorTelemetryCardPreset,
): string {
  return (
    COURSE_SENSOR_TELEMETRY_CARD_PRESET_OPTIONS.find((entry) => entry.value === preset)?.label ??
    preset
  );
}

export const COURSE_SENSOR_TELEMETRY_CARD_PRESET_DEFAULT: CourseSensorTelemetryCardPreset =
  "euler";
