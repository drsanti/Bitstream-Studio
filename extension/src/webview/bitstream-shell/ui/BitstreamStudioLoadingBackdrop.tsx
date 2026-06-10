/*******************************************************************************
 * File Name : BitstreamStudioLoadingBackdrop.tsx
 *
 * Description : Landing-style 2D nebula/flow backdrop for transient loading shells.
 *               Unmounts with the loading screen so canvas loops dispose cleanly.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { BitstreamLandingBackground2D } from "../../landing/BitstreamLandingBackground2D.js";
import { usePrefersReducedMotion } from "../../landing/usePrefersReducedMotion.js";

/** CSS class on the loading shell root — flow canvas pointer routing. */
export const BITSTREAM_STUDIO_LOADING_SHELL_CLASS = "bitstream-studio-loading-shell";

/**
 * Animated 2D backdrop (no WebGL). Tear down is automatic when the parent loading
 * screen unmounts after the route or workspace chunk is ready.
 */
export function BitstreamStudioLoadingBackdrop()
{
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <>
      <BitstreamLandingBackground2D
        showBase
        showNebula
        showFlow={!prefersReducedMotion}
        interactionRootClass={BITSTREAM_STUDIO_LOADING_SHELL_CLASS}
      />
      <div
        className="t3d-flow-canvas-bg__vignette pointer-events-none absolute inset-0 z-1"
        aria-hidden
      />
    </>
  );
}
