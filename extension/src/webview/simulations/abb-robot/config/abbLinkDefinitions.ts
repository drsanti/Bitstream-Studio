/*******************************************************************************
 * File Name : abbLinkDefinitions.ts
 *
 * Description : Link names and rotation axes for ABB GLB (Link1–Link6).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import * as THREE from "three";

export type AbbLinkDefinition = {
  name: string;
  axis: THREE.Vector3;
};

/** Matches T3D app02-robot-arm ArmController.armLinksBuilder axes. */
export const ABB_LINK_DEFINITIONS: readonly AbbLinkDefinition[] = [
  { name: "Link1", axis: new THREE.Vector3(0, 1, 0) },
  { name: "Link2", axis: new THREE.Vector3(1, 0, 0) },
  { name: "Link3", axis: new THREE.Vector3(1, 0, 0) },
  { name: "Link4", axis: new THREE.Vector3(0, 0, 1) },
  { name: "Link5", axis: new THREE.Vector3(1, 0, 0) },
  { name: "Link6", axis: new THREE.Vector3(0, 0, 1) },
] as const;
