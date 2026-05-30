/*******************************************************************************
 * File Name : centerObject3DAtOrigin.ts
 *
 * Description : Shift a model so its world-space bounding-box center is at origin.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import * as THREE from "three";

/**
 * Moves root so the axis-aligned bounds center sits at (0,0,0).
 * Use once on the GLB root so physics colliders and R3F visuals share the same frame.
 */
export function centerObject3DAtOrigin(root: THREE.Object3D): THREE.Vector3
{
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.sub(center);
  root.updateMatrixWorld(true);
  return center;
}
