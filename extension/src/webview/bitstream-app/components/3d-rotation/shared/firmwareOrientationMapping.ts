/*******************************************************************************
 * File Name : firmwareOrientationMapping.ts
 *
 * Description : BSX / firmware body quaternion → Three.js mesh orientation
 *               (similarity transforms; no per-component quat swaps).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.1
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import * as THREE from "three";

/**
 * Body quaternion (firmware Z-up nav frame) → Three mesh orientation:
 * 1. Similarity R_x(-π/2) * q * R_x(-π/2)⁻¹ (StreamSight / IMUQuaternionViewer style).
 * 2. Conjugate by R_y(π) so X/Z twist matches this hardware path (Y unchanged).
 */
const Q_FW_Z_UP_TO_Y_UP = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 0, 0),
  -Math.PI / 2,
);
const Q_FW_Z_UP_TO_Y_UP_INV = Q_FW_Z_UP_TO_Y_UP.clone().invert();
const Q_FLIP_XZ_TWIST_SENSE = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0, 1, 0),
  Math.PI,
);
/** Must conjugate with q⁻¹ on the right; `q * R * q` is not an SO(3) basis change (distorts angle). */
const Q_FLIP_XZ_TWIST_SENSE_INV = Q_FLIP_XZ_TWIST_SENSE.clone().invert();

/**
 * BSX body basis → PSoC GLB mesh axes on the rig: X→−X, Y→Z, Z→Y.
 * Matches historical bench remap (−qx, qz, qy, qw) but uses similarity for stability.
 */
const M_BSX_TO_PCB_GLB = new THREE.Matrix4().set(
  -1, 0, 0, 0,
  0, 0, 1, 0,
  0, 1, 0, 0,
  0, 0, 0, 1,
);
const Q_BSX_TO_PCB_GLB = new THREE.Quaternion().setFromRotationMatrix(M_BSX_TO_PCB_GLB);
const Q_BSX_TO_PCB_GLB_INV = Q_BSX_TO_PCB_GLB.clone().invert();

/** Apply fixed PCB ↔ GLB axis alignment to a normalized body quaternion. */
export function applyBsxToPcbGlbMapping(
  body: THREE.Quaternion,
  out: THREE.Quaternion,
  _tmp: THREE.Quaternion,
): void
{
  out.copy(body);
  out.premultiply(Q_BSX_TO_PCB_GLB);
  out.multiply(Q_BSX_TO_PCB_GLB_INV);
  out.normalize();
}

export function applyFirmwareOrientationMapping(
  body: THREE.Quaternion,
  out: THREE.Quaternion,
  tmp: THREE.Quaternion,
): void {
  out.copy(body);
  out.premultiply(Q_FW_Z_UP_TO_Y_UP);
  out.multiply(Q_FW_Z_UP_TO_Y_UP_INV);
  out.normalize();
  tmp.copy(out);
  out.copy(Q_FLIP_XZ_TWIST_SENSE);
  out.multiply(tmp);
  out.multiply(Q_FLIP_XZ_TWIST_SENSE_INV);
  out.normalize();
}
