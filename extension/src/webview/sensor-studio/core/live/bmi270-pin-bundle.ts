import {
  fusionEulerRadVec3FromBmi270Sample,
  isBmi270WireSample,
  livePortsFromBmi270Sample,
} from "./bmi270-live-ports";
import {
  fusionQuaternionFromBmi270Sample,
  hasFusionQuaternionWireFields,
} from "./bmi270-fusion-quat";
import type { FlowWireQuaternion, FlowWireVec3 } from "./flow-wire-types";

export type Bmi270PinBundle = {
  accel: FlowWireVec3;
  gyro: FlowWireVec3;
  temp: number;
  euler: FlowWireVec3;
  quaternion: FlowWireQuaternion;
  counter: number;
  /** True when a BMI270 wire sample is present (hardware path); otherwise synthesized zeros. */
  streamLive: boolean;
};

/** Shared BMI270 math for `bmi270-input` and single-pin tap nodes (hardware sample or synthesized). */
export function computeBmi270PinBundle(latestByHint: { bmi270: unknown }): Bmi270PinBundle {
  const sample = latestByHint.bmi270;
  const demoFusionQuat = (): FlowWireQuaternion => ({ x: 0, y: 0, z: 0, w: 1 });
  const demoEuler = (): FlowWireVec3 => ({ x: 0, y: 0, z: 0 });
  if (isBmi270WireSample(sample)) {
    const ports = livePortsFromBmi270Sample(sample);
    const eulerLive = fusionEulerRadVec3FromBmi270Sample(sample);
    return {
      accel: ports.accel,
      gyro: ports.gyro,
      temp: ports.tempC,
      euler: eulerLive != null ? eulerLive : demoEuler(),
      quaternion: hasFusionQuaternionWireFields(sample)
        ? fusionQuaternionFromBmi270Sample(sample)
        : demoFusionQuat(),
      counter: sample.counter,
      streamLive: true,
    };
  }
  return {
    accel: { x: 0, y: 0, z: 0 },
    gyro: { x: 0, y: 0, z: 0 },
    temp: 0,
    euler: demoEuler(),
    quaternion: demoFusionQuat(),
    counter: 0,
    streamLive: false,
  };
}
