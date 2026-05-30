/*******************************************************************************
 * File Name : shouldUseLandingCss3d.ts
 *
 * Description : When landing cards render via CSS3DRenderer vs flat HTML.
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
 * CSS3D parallax requires the WebGL cube backdrop (3D or blend), not reduced motion.
 */
export function shouldUseLandingCss3d(
  mode: LandingBackgroundMode,
  prefersReducedMotion: boolean,
): boolean
{
  return landingModeShows3d(mode) && !prefersReducedMotion;
}
