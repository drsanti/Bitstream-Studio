import type * as THREE from "three";

/** CONTRACT_NAMES — see PROJECT_INFO.md § Robot GLB (object names). */
export const PROJECT4_CONTRACT_OBJECT_NAMES = [
  "Body",
  "Ultrasonic_F",
  "Ultrasonic_R",
  "Wheel_FL",
  "Wheel_FR",
  "Wheel_RL",
  "Wheel_RR",
  "Ground",
] as const;

export type Project4ContractObjectName = (typeof PROJECT4_CONTRACT_OBJECT_NAMES)[number];

export type Project4RigRefs = {
  body: THREE.Object3D | undefined;
  ultrasonicF: THREE.Object3D | undefined;
  ultrasonicR: THREE.Object3D | undefined;
  wheelFL: THREE.Object3D | undefined;
  wheelFR: THREE.Object3D | undefined;
  wheelRL: THREE.Object3D | undefined;
  wheelRR: THREE.Object3D | undefined;
  ground: THREE.Object3D | undefined;
};

export function collectProject4Rig(root: THREE.Object3D): Project4RigRefs {
  return {
    body: root.getObjectByName("Body") ?? undefined,
    ultrasonicF: root.getObjectByName("Ultrasonic_F") ?? undefined,
    ultrasonicR: root.getObjectByName("Ultrasonic_R") ?? undefined,
    wheelFL: root.getObjectByName("Wheel_FL") ?? undefined,
    wheelFR: root.getObjectByName("Wheel_FR") ?? undefined,
    wheelRL: root.getObjectByName("Wheel_RL") ?? undefined,
    wheelRR: root.getObjectByName("Wheel_RR") ?? undefined,
    ground: root.getObjectByName("Ground") ?? undefined,
  };
}
