/*******************************************************************************
 * File Name : buildAbbArmLinks.ts
 *
 * Description : Finds Link1–Link6 in a cloned GLB scene and builds ArmLink array.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type * as THREE from "three";
import { ABB_LINK_DEFINITIONS } from "../config/abbLinkDefinitions.js";
import { ArmLink } from "./ArmLink.js";

/**
 * Returns null if any required link node is missing.
 */
export function buildAbbArmLinks(root: THREE.Object3D): ArmLink[] | null
{
  const links: ArmLink[] = [];

  for (const def of ABB_LINK_DEFINITIONS)
  {
    const object = root.getObjectByName(def.name);
    if (object == null)
    {
      return null;
    }
    links.push(new ArmLink(def.name, object, def.axis.clone()));
  }

  return links;
}
