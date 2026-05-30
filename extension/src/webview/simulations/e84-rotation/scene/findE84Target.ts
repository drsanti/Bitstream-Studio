/*******************************************************************************
 * File Name : findE84Target.ts
 *
 * Description : Locate E84 rotation target object inside a loaded GLB scene.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type * as THREE from "three";
import { E84_TARGET_NODE_NAME } from "../config/e84SceneNodes.js";

/**
 * Finds E84_1 or first object whose name contains "e84" (case-insensitive).
 */
export function findE84Target(root: THREE.Object3D): THREE.Object3D
{
  const exact = root.getObjectByName(E84_TARGET_NODE_NAME);
  if (exact != null)
  {
    return exact;
  }

  let fallback: THREE.Object3D | null = null;
  root.traverse((child) =>
  {
    if (fallback != null)
    {
      return;
    }
    if (child.name.toLowerCase().includes("e84"))
    {
      fallback = child;
    }
  });

  return fallback ?? root;
}
