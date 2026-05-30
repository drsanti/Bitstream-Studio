/*******************************************************************************
 * File Name : shouldUseLandingCss3d.ts
 *
 * Description : When landing card grids use CSS perspective parallax (3D/blend backdrop).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { LandingBackgroundMode } from "../bitstreamLandingBackgroundMode.store.js";
import { landingModeShows3d } from "../bitstreamLandingBackgroundMode.store.js";

/**
 * Card parallax requires the WebGL cube backdrop (3D or blend), not reduced motion.
 */
export function shouldUseLandingCss3d(
  mode: LandingBackgroundMode,
  prefersReducedMotion: boolean,
): boolean
{
  return landingModeShows3d(mode) && !prefersReducedMotion;
}
