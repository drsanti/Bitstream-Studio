/*******************************************************************************
 * File Name : WebGLRouteTransitionSplash.tsx
 *
 * Description : Full-screen placeholder while waiting for WebGL teardown gap.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { BitstreamStudioLoadingScreen } from "../../bitstream-shell/ui/BitstreamStudioLoadingScreen.js";

export type WebGLRouteTransitionSplashProps = {
  label?: string;
  hint?: string;
};

/**
 * Shown between landing and simulation routes while the prior Canvas disposes.
 */
export function WebGLRouteTransitionSplash({
  label,
  hint,
}: WebGLRouteTransitionSplashProps) {
  return (
    <BitstreamStudioLoadingScreen layout="fullscreen" label={label} hint={hint} />
  );
}
