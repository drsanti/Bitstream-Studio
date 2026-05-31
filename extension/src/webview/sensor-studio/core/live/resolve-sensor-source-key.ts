import type {
  BitstreamSensorSampleV2,
  BitstreamSensorSourceHint,
} from "../../../../bitstream/events/sensor-decoder";
import { pressureHpaFromWireSecondaryX100 } from "../../../bitstream-app/telemetry/pressureDisplay";

export const STUDIO_SENSOR_SOURCE_KEY_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "bmi270.accel.x", label: "BMI270 accel X (m/s²)" },
  { value: "bmi270.accel.y", label: "BMI270 accel Y (m/s²)" },
  { value: "bmi270.accel.z", label: "BMI270 accel Z (m/s²)" },
  { value: "bmi270.gyro.x", label: "BMI270 gyro X (rad/s)" },
  { value: "bmi270.gyro.y", label: "BMI270 gyro Y (rad/s)" },
  { value: "bmi270.gyro.z", label: "BMI270 gyro Z (rad/s)" },
  { value: "bmi270.temperature", label: "BMI270 temperature (°C)" },
  { value: "bmi270.fusion.heading", label: "BMI270 fusion heading (rad)" },
  { value: "bmi270.fusion.pitch", label: "BMI270 fusion pitch (rad)" },
  { value: "bmi270.fusion.roll", label: "BMI270 fusion roll (rad)" },
  { value: "bmm350.mag.x", label: "BMM350 mag X (µT)" },
  { value: "bmm350.mag.y", label: "BMM350 mag Y (µT)" },
  { value: "bmm350.mag.z", label: "BMM350 mag Z (µT)" },
  { value: "bmm350.temperature", label: "BMM350 temperature (°C)" },
  { value: "sht40.temperature", label: "SHT40 temperature (°C)" },
  { value: "sht40.humidity", label: "SHT40 humidity (%RH)" },
  { value: "dps368.pressure", label: "DPS368 pressure (hPa)" },
  { value: "dps368.temperature", label: "DPS368 temperature (°C)" },
];

/** Set of allowed `sourceKey` strings (same source as {@link STUDIO_SENSOR_SOURCE_KEY_OPTIONS}). */
export const STUDIO_SENSOR_SOURCE_KEY_VALUE_SET = new Set(
  STUDIO_SENSOR_SOURCE_KEY_OPTIONS.map((option) => option.value),
);

/** True when `value` is a non-empty trimmed string present in the studio allowlist. */
export function isValidStudioSensorSourceKey(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 && STUDIO_SENSOR_SOURCE_KEY_VALUE_SET.has(trimmed);
}

function scale100(value: number | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return value / 100;
}

function parseSourceKey(sourceKey: string): { hint: BitstreamSensorSourceHint; path: string } | null {
  const trimmed = sourceKey.trim();
  const parts = trimmed.split(".").filter((segment) => segment.length > 0);
  if (parts.length < 2) {
    return null;
  }
  const hint = parts[0] as BitstreamSensorSourceHint;
  if (hint !== "bmi270" && hint !== "bmm350" && hint !== "sht40" && hint !== "dps368" && hint !== "unknown") {
    return null;
  }
  const path = parts.slice(1).join(".");
  return { hint, path };
}

/**
 * Infer the {@link BitstreamSensorSourceHint} from a studio allowlisted `sourceKey` (e.g. `bmi270.accel.x`).
 * Returns null for unknown prefixes or malformed keys.
 */
export function inferSensorTelemetryHintFromSourceKey(sourceKey: string): BitstreamSensorSourceHint | null {
  const trimmed = sourceKey.trim();
  const parts = trimmed.split(".").filter((segment) => segment.length > 0);
  if (parts.length < 2) {
    return null;
  }
  const first = parts[0];
  if (
    first !== "bmi270" &&
    first !== "bmm350" &&
    first !== "sht40" &&
    first !== "dps368"
  ) {
    return null;
  }
  return first as BitstreamSensorSourceHint;
}

function extractNumericFromSample(sample: BitstreamSensorSampleV2, path: string): number | null {
  if (path === "temperature") {
    return scale100(sample.temperatureCx100);
  }

  if (path === "accel.x") {
    return scale100(sample.accelXMs2X100);
  }
  if (path === "accel.y") {
    return scale100(sample.accelYMs2X100);
  }
  if (path === "accel.z") {
    return scale100(sample.accelZMs2X100);
  }

  if (path === "gyro.x") {
    return scale100(sample.gyroXRadSX100);
  }
  if (path === "gyro.y") {
    return scale100(sample.gyroYRadSX100);
  }
  if (path === "gyro.z") {
    return scale100(sample.gyroZRadSX100);
  }

  if (path.startsWith("fusion.")) {
    if (!sample.isBmi270FusionPayload) {
      return null;
    }
    if (path === "fusion.heading") {
      return scale100(sample.fusionHeadingRadX100);
    }
    if (path === "fusion.pitch") {
      return scale100(sample.fusionPitchRadX100);
    }
    if (path === "fusion.roll") {
      return scale100(sample.fusionRollRadX100);
    }
    return null;
  }

  if (path === "mag.x") {
    return scale100(sample.magneticXUtX100);
  }
  if (path === "mag.y") {
    return scale100(sample.magneticYUtX100);
  }
  if (path === "mag.z") {
    return scale100(sample.magneticZUtX100);
  }

  if (path === "humidity") {
    return scale100(sample.secondaryX100);
  }

  if (path === "pressure") {
    if (typeof sample.secondaryX100 !== "number" || !Number.isFinite(sample.secondaryX100)) {
      return null;
    }
    return pressureHpaFromWireSecondaryX100(sample.secondaryX100);
  }

  return null;
}

export function resolveLiveNumericFromLatestByHint(
  latestByHint: Record<BitstreamSensorSourceHint, BitstreamSensorSampleV2 | null>,
  sourceKey: string,
): number | null {
  const parsed = parseSourceKey(sourceKey);
  if (parsed == null) {
    return null;
  }
  const sample = latestByHint[parsed.hint];
  if (sample == null) {
    return null;
  }
  return extractNumericFromSample(sample, parsed.path);
}
