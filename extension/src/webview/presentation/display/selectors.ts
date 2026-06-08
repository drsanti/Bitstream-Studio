import type { BitstreamSensorSampleV2 } from "../../../bitstream/events/sensor-decoder";
import { dps368PressureToAltitudeM } from "../core/dps368-altitude";

const G = 9.80665;
const RAD2DEG = 180 / Math.PI;

export type PresentationBmi270Frame = {
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
  temp: number;
  heading: number;
  pitch: number;
  roll: number;
  qw: number;
  qx: number;
  qy: number;
  qz: number;
  accValid: boolean;
  gyrValid: boolean;
  tempValid: boolean;
  eulerValid: boolean;
  quatValid: boolean;
  hasSample: boolean;
};

const EMPTY_BMI270: PresentationBmi270Frame = {
  ax: 0,
  ay: 0,
  az: 1,
  gx: 0,
  gy: 0,
  gz: 0,
  temp: 25,
  heading: 0,
  pitch: 0,
  roll: 0,
  qw: 1,
  qx: 0,
  qy: 0,
  qz: 0,
  accValid: false,
  gyrValid: false,
  tempValid: false,
  eulerValid: false,
  quatValid: false,
  hasSample: false,
};

/** Map live store BMI270 sample → slide-friendly units (g, °/s, °C, degrees). */
export function presentationBmi270FromSample(
  sample: BitstreamSensorSampleV2 | null | undefined,
): PresentationBmi270Frame {
  if (sample == null || sample.sourceHint !== "bmi270") {
    return EMPTY_BMI270;
  }

  const frame: PresentationBmi270Frame = { ...EMPTY_BMI270, hasSample: true };

  if (sample.accelXMs2X100 != null) {
    frame.ax = sample.accelXMs2X100 / 100 / G;
    frame.ay = (sample.accelYMs2X100 ?? 0) / 100 / G;
    frame.az = (sample.accelZMs2X100 ?? 0) / 100 / G;
    frame.accValid = true;
  }

  if (sample.gyroXRadSX100 != null) {
    frame.gx = sample.gyroXRadSX100 / 100 * RAD2DEG;
    frame.gy = (sample.gyroYRadSX100 ?? 0) / 100 * RAD2DEG;
    frame.gz = (sample.gyroZRadSX100 ?? 0) / 100 * RAD2DEG;
    frame.gyrValid = true;
  }

  if (sample.temperatureCx100 != null) {
    frame.temp = sample.temperatureCx100 / 100;
    frame.tempValid = true;
  }

  if (sample.fusionHeadingRadX100 != null) {
    frame.heading = sample.fusionHeadingRadX100 / 100 * RAD2DEG;
    frame.pitch = (sample.fusionPitchRadX100 ?? 0) / 100 * RAD2DEG;
    frame.roll = (sample.fusionRollRadX100 ?? 0) / 100 * RAD2DEG;
    frame.eulerValid = true;
  }

  if (sample.fusionQuatWBucketX10000 != null) {
    frame.qw = (sample.fusionQuatWBucketX10000 - 10000) / 10000;
    frame.qx = (sample.fusionQuatXX10000 ?? 0) / 10000;
    frame.qy = (sample.fusionQuatYX10000 ?? 0) / 10000;
    frame.qz = (sample.fusionQuatZX10000 ?? 0) / 10000;
    frame.quatValid = true;
  }

  return frame;
}

export type PresentationBmm350Frame = {
  bx: number;
  by: number;
  bz: number;
  magnitude: number;
  headingDeg: number;
  temp: number;
  magValid: boolean;
  tempValid: boolean;
  hasSample: boolean;
};

const EMPTY_BMM350: PresentationBmm350Frame = {
  bx: 0,
  by: 0,
  bz: 0,
  magnitude: 0,
  headingDeg: 0,
  temp: 25,
  magValid: false,
  tempValid: false,
  hasSample: false,
};

/** Map live store BMM350 sample → µT, °C, level heading (deg). */
export function presentationBmm350FromSample(
  sample: BitstreamSensorSampleV2 | null | undefined,
): PresentationBmm350Frame {
  if (sample == null || sample.sourceHint !== "bmm350") {
    return EMPTY_BMM350;
  }

  const frame: PresentationBmm350Frame = { ...EMPTY_BMM350, hasSample: true };

  if (sample.magneticXUtX100 != null) {
    frame.bx = sample.magneticXUtX100 / 100;
    frame.by = (sample.magneticYUtX100 ?? 0) / 100;
    frame.bz = (sample.magneticZUtX100 ?? 0) / 100;
    frame.magnitude = Math.sqrt(frame.bx ** 2 + frame.by ** 2 + frame.bz ** 2);
    frame.headingDeg = (Math.atan2(frame.by, frame.bx) * 180) / Math.PI;
    frame.magValid = true;
  }

  if (sample.temperatureCx100 != null) {
    frame.temp = sample.temperatureCx100 / 100;
    frame.tempValid = true;
  }

  return frame;
}

export type PresentationDps368Frame = {
  pressureHpa: number;
  temp: number;
  altitudeM: number;
  pressureValid: boolean;
  tempValid: boolean;
  hasSample: boolean;
};

const EMPTY_DPS368: PresentationDps368Frame = {
  pressureHpa: 1013.25,
  temp: 25,
  altitudeM: 0,
  pressureValid: false,
  tempValid: false,
  hasSample: false,
};

/** Map live store DPS368 sample → hPa, °C, derived altitude (m). */
export function presentationDps368FromSample(
  sample: BitstreamSensorSampleV2 | null | undefined,
  seaLevelHpa = 1013.25,
): PresentationDps368Frame {
  if (sample == null || sample.sourceHint !== "dps368") {
    return EMPTY_DPS368;
  }

  const frame: PresentationDps368Frame = { ...EMPTY_DPS368, hasSample: true };

  if (sample.secondaryX100 != null) {
    frame.pressureHpa = sample.secondaryX100 / 10;
    frame.pressureValid = true;
    frame.altitudeM = dps368PressureToAltitudeM(frame.pressureHpa, seaLevelHpa);
  }

  if (sample.temperatureCx100 != null) {
    frame.temp = sample.temperatureCx100 / 100;
    frame.tempValid = true;
  }

  return frame;
}

export type PresentationSht40Frame = {
  temp: number;
  rh: number;
  tempValid: boolean;
  rhValid: boolean;
  hasSample: boolean;
};

const EMPTY_SHT40: PresentationSht40Frame = {
  temp: 25,
  rh: 50,
  tempValid: false,
  rhValid: false,
  hasSample: false,
};

/** Map live store SHT40 sample → °C and %RH. */
export function presentationSht40FromSample(
  sample: BitstreamSensorSampleV2 | null | undefined,
): PresentationSht40Frame {
  if (sample == null || sample.sourceHint !== "sht40") {
    return EMPTY_SHT40;
  }

  const frame: PresentationSht40Frame = { ...EMPTY_SHT40, hasSample: true };

  if (sample.temperatureCx100 != null) {
    frame.temp = sample.temperatureCx100 / 100;
    frame.tempValid = true;
  }

  if (sample.secondaryX100 != null) {
    frame.rh = sample.secondaryX100 / 100;
    frame.rhValid = true;
  }

  return frame;
}
