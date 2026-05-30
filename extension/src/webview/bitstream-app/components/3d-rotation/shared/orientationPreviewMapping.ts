/*******************************************************************************
 * File Name : orientationPreviewMapping.ts
 *
 * Description : Wire fusion quaternion → Three.js mesh orientation modes.
 *               "pcb-glb" aligns BSX axes to the PSoC GLB (X flip, Y/Z swap).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import * as THREE from "three";
import {
  applyBsxToPcbGlbMapping,
  applyFirmwareOrientationMapping,
} from "./firmwareOrientationMapping.js";

/** How decoded wire fusion quaternion is applied to the preview GLB. */
export type OrientationPreviewMappingMode =
  | "pcb-glb"
  | "wire-direct"
  | "streamsight-z-up"
  | "firmware-full";

export const ORIENTATION_PREVIEW_MAPPING_MODES: readonly OrientationPreviewMappingMode[] =
  ["pcb-glb", "wire-direct", "streamsight-z-up", "firmware-full"] as const;

/** Default: BSX wire quat with PCB ↔ GLB axis fix (visual match on rig). */
export const ORIENTATION_PREVIEW_MAPPING_DEFAULT: OrientationPreviewMappingMode =
  "pcb-glb";

const Q_FW_Z_UP_TO_Y_UP = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 0, 0),
  -Math.PI / 2,
);
const Q_FW_Z_UP_TO_Y_UP_INV = Q_FW_Z_UP_TO_Y_UP.clone().invert();

export function orientationPreviewMappingModeLabel(
  mode: OrientationPreviewMappingMode,
): string {
  switch (mode)
  {
    case "pcb-glb":
      return "PCB ↔ GLB";
    case "wire-direct":
      return "Wire direct";
    case "streamsight-z-up":
      return "Z-up → Y-up";
    case "firmware-full":
      return "Firmware full";
    default:
      return mode;
  }
}

/** Map body-frame fusion quaternion to Three.js mesh orientation. */
export function applyOrientationPreviewMapping(
  body: THREE.Quaternion,
  out: THREE.Quaternion,
  tmp: THREE.Quaternion,
  mode: OrientationPreviewMappingMode,
): void
{
  switch (mode)
  {
    case "pcb-glb":
      applyBsxToPcbGlbMapping(body, out, tmp);
      return;
    case "wire-direct":
      out.copy(body);
      return;
    case "streamsight-z-up":
      out.copy(body);
      out.premultiply(Q_FW_Z_UP_TO_Y_UP);
      out.multiply(Q_FW_Z_UP_TO_Y_UP_INV);
      out.normalize();
      return;
    case "firmware-full":
      applyFirmwareOrientationMapping(body, out, tmp);
      return;
    default:
      out.copy(body);
  }
}
