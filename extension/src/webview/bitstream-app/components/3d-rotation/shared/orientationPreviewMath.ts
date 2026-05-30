/*******************************************************************************
 * File Name : orientationPreviewMath.ts
 *
 * Description : Wire fusion quaternion vs mapped Three.js mesh orientation
 *               (shared by OrientationMarkerMesh and viewport HUD).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import * as THREE from "three";
import type { FusionEulerHundredths } from "./bmi270FusionExtract.js";
import { fusionWireEulerHundredthsToThreeEulerRadComponents } from "./fusionEulerWireToThreeEulerRad.js";
import {
  fusionQuatAngleRad,
  hemisphereAlignFusionQuatToReference,
} from "./fusionQuatOutlierGate.js";
import { ORIENTATION_DISPLAY_MAX_STEP_DEG_PER_WIRE } from "./rotationPreviewConstants.js";
import {
  applyOrientationPreviewMapping,
  ORIENTATION_PREVIEW_MAPPING_DEFAULT,
  type OrientationPreviewMappingMode,
} from "./orientationPreviewMapping.js";
import { FUSION_EULER_ORDER } from "./rotationPreviewConstants.js";

/** Normalized fusion quaternion (scalar-first, BSX / wire convention). */
export type FusionQuat4 = {
  qw: number;
  qx: number;
  qy: number;
  qz: number;
};

const IDENTITY_QUAT: FusionQuat4 = { qw: 1, qx: 0, qy: 0, qz: 0 };

/** Rotation angle from identity to `q` (degrees), in [0, 180]. */
export function quaternionAngleDegFromIdentity(q: FusionQuat4): number {
  const dot = Math.min(
    1,
    Math.abs(
      q.qw * IDENTITY_QUAT.qw +
        q.qx * IDENTITY_QUAT.qx +
        q.qy * IDENTITY_QUAT.qy +
        q.qz * IDENTITY_QUAT.qz,
    ),
  );
  return (2 * Math.acos(dot) * 180) / Math.PI;
}

/** Rotation angle between two unit quaternions (degrees), in [0, 180]. */
export function quaternionAngleDegBetween(a: FusionQuat4, b: FusionQuat4): number {
  const dot = Math.min(
    1,
    Math.abs(a.qw * b.qw + a.qx * b.qx + a.qy * b.qy + a.qz * b.qz),
  );
  return (2 * Math.acos(dot) * 180) / Math.PI;
}

/** Intrinsic ZYX Euler (degrees) from a unit quaternion (Three.js convention). */
/** Wire fusion Euler (rad×100) → Three.js ZYX degrees (same axes as mesh Euler path). */
export function wireEulerZyxDegFromHundredths(e: FusionEulerHundredths): {
  pitchDeg: number;
  rollDeg: number;
  yawDeg: number;
} {
  const { ex, ey, ez } = fusionWireEulerHundredthsToThreeEulerRadComponents(e);
  const radToDeg = 180 / Math.PI;
  return {
    pitchDeg: ex * radToDeg,
    rollDeg: ey * radToDeg,
    yawDeg: ez * radToDeg,
  };
}

export function eulerZyxDegFromFusionQuat(q: FusionQuat4): {
  pitchDeg: number;
  rollDeg: number;
  yawDeg: number;
} {
  const threeQ = new THREE.Quaternion(q.qx, q.qy, q.qz, q.qw);
  const euler = new THREE.Euler().setFromQuaternion(threeQ, FUSION_EULER_ORDER);
  const radToDeg = 180 / Math.PI;
  return {
    pitchDeg: euler.x * radToDeg,
    rollDeg: euler.y * radToDeg,
    yawDeg: euler.z * radToDeg,
  };
}

export type MeshOrientationSceneInput = {
  qw: number;
  qx: number;
  qy: number;
  qz: number;
  fusionEulerHundredths: FusionEulerHundredths | null;
  meshOrientationFromEulerFallback: boolean;
  eulerOnly: boolean;
  orientationMappingMode?: OrientationPreviewMappingMode;
};

export type MeshOrientationScratch = {
  body: THREE.Quaternion;
  tmp: THREE.Quaternion;
  euler: THREE.Euler;
  out: THREE.Quaternion;
};

/** Allocate scratch quaternions for repeated mesh target computation. */
export function createMeshOrientationScratch(): MeshOrientationScratch {
  return {
    body: new THREE.Quaternion(),
    tmp: new THREE.Quaternion(),
    euler: new THREE.Euler(),
    out: new THREE.Quaternion(),
  };
}

/**
 * Keep mapped mesh quaternions on the short arc vs the last displayed pose.
 * Wire store may already hemisphere-align raw fusion; mapping can still flip ±q.
 */
export function alignMappedFusionQuatToDisplay(
  mapped: FusionQuat4,
  prevDisplay: FusionQuat4,
): FusionQuat4 {
  return hemisphereAlignFusionQuatToReference(mapped, prevDisplay);
}

/**
 * Limit how far the 3D display can rotate per wire packet (short-arc slerp cap).
 * Wire quat is still correct in the HUD; mesh uses this for calmer motion.
 */
export function capFusionQuatStepForDisplay(
  prevDisplay: FusionQuat4,
  incoming: FusionQuat4,
  maxStepDeg: number = ORIENTATION_DISPLAY_MAX_STEP_DEG_PER_WIRE,
): FusionQuat4
{
  const aligned = hemisphereAlignFusionQuatToReference(incoming, prevDisplay);
  const maxRad = (maxStepDeg * Math.PI) / 180;
  const angle = fusionQuatAngleRad(aligned, prevDisplay);
  if (angle <= maxRad)
  {
    return aligned;
  }
  const prevQ = new THREE.Quaternion(
    prevDisplay.qx,
    prevDisplay.qy,
    prevDisplay.qz,
    prevDisplay.qw,
  );
  const nextQ = new THREE.Quaternion(aligned.qx, aligned.qy, aligned.qz, aligned.qw);
  prevQ.slerp(nextQ, maxRad / angle);
  return {
    qw: prevQ.w,
    qx: prevQ.x,
    qy: prevQ.y,
    qz: prevQ.z,
  };
}

/** Same target quaternion as {@link OrientationMarkerMesh} (body → firmware mapping). */
export function computeMeshTargetFusionQuat(
  input: MeshOrientationSceneInput,
  scratch: MeshOrientationScratch,
): FusionQuat4 {
  const body = scratch.body;
  if (input.eulerOnly)
  {
    const e = input.fusionEulerHundredths ?? { roll: 0, pitch: 0, heading: 0 };
    const { ex, ey, ez } = fusionWireEulerHundredthsToThreeEulerRadComponents(e);
    scratch.euler.set(ex, ey, ez, FUSION_EULER_ORDER);
    body.setFromEuler(scratch.euler);
    body.invert();
  }
  else if (
    input.meshOrientationFromEulerFallback &&
    input.fusionEulerHundredths != null
  )
  {
    const e = input.fusionEulerHundredths;
    const { ex, ey, ez } = fusionWireEulerHundredthsToThreeEulerRadComponents(e);
    scratch.euler.set(ex, ey, ez, FUSION_EULER_ORDER);
    body.setFromEuler(scratch.euler);
    body.invert();
  }
  else
  {
    body.set(input.qx, input.qy, input.qz, input.qw);
  }
  const mappingMode =
    input.orientationMappingMode ?? ORIENTATION_PREVIEW_MAPPING_DEFAULT;
  applyOrientationPreviewMapping(body, scratch.out, scratch.tmp, mappingMode);
  return {
    qw: scratch.out.w,
    qx: scratch.out.x,
    qy: scratch.out.y,
    qz: scratch.out.z,
  };
}

/** Format normalized quaternion for HUD rows. */
export function formatFusionQuat4Compact(q: FusionQuat4): string {
  return `${q.qx.toFixed(2)}, ${q.qy.toFixed(2)}, ${q.qz.toFixed(2)}, ${q.qw.toFixed(2)}`;
}

/** Full-precision quaternion string for resizable viewport HUD (no ellipsis). */
export function formatFusionQuat4Hud(q: FusionQuat4): string {
  const f = (n: number) => (Number.isFinite(n) ? n.toFixed(3) : "—");
  return `${f(q.qx)}, ${f(q.qy)}, ${f(q.qz)}, ${f(q.qw)}`;
}

export function formatDeg1(value: number | null): string {
  if (value == null || !Number.isFinite(value))
  {
    return "—";
  }
  return `${value.toFixed(1)}°`;
}
