import type { BitstreamSensorSampleV2 } from "../../../../bitstream/events/sensor-decoder";

/** True when the latest slot holds a decoded BMI270 frame (any variant: IMU, fusion, or 8-byte). */
export function isBmi270WireSample(
  sample: unknown,
): sample is BitstreamSensorSampleV2 {
  return (
    sample != null &&
    typeof sample === "object" &&
    (sample as BitstreamSensorSampleV2).sourceHint === "bmi270"
  );
}

export type Bmi270LivePorts = {
  accel: { x: number; y: number; z: number };
  gyro: { x: number; y: number; z: number };
  tempC: number;
};

function scale100(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return value / 100;
}

/** Maps a decoded BMI270 sample to vec3 + scalar temp. Missing IMU fields yield zeros (caller may fall back to demo). */
export function livePortsFromBmi270Sample(sample: BitstreamSensorSampleV2): Bmi270LivePorts {
  return {
    accel: {
      x: scale100(sample.accelXMs2X100),
      y: scale100(sample.accelYMs2X100),
      z: scale100(sample.accelZMs2X100),
    },
    gyro: {
      x: scale100(sample.gyroXRadSX100),
      y: scale100(sample.gyroYRadSX100),
      z: scale100(sample.gyroZRadSX100),
    },
    tempC: scale100(sample.temperatureCx100),
  };
}

export function bmi270SampleHasImuTriples(sample: BitstreamSensorSampleV2): boolean {
  return (
    sample.accelXMs2X100 !== undefined &&
    sample.accelYMs2X100 !== undefined &&
    sample.accelZMs2X100 !== undefined
  );
}

/**
 * Fusion Euler angles in radians as a single `vector3` wire.
 * **Component order:** `x` = roll, `y` = pitch, `z` = heading (yaw), matching BSX fusion fields when present.
 */
export function fusionEulerRadVec3FromBmi270Sample(
  sample: BitstreamSensorSampleV2,
): { x: number; y: number; z: number } | null {
  if (
    sample.fusionRollRadX100 === undefined ||
    sample.fusionPitchRadX100 === undefined ||
    sample.fusionHeadingRadX100 === undefined
  ) {
    return null;
  }
  return {
    x: scale100(sample.fusionRollRadX100),
    y: scale100(sample.fusionPitchRadX100),
    z: scale100(sample.fusionHeadingRadX100),
  };
}
