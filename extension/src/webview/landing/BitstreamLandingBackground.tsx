/*******************************************************************************
 * File Name : BitstreamLandingBackground.tsx
 *
 * Description : Composable landing backdrop — 2D canvas, 3D cube floor, or blend.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { BitstreamLandingBackground2D } from "./BitstreamLandingBackground2D.js";
import { BitstreamLandingBackground3D } from "./BitstreamLandingBackground3D.js";
import {
  landingModeShows3d,
  landingOverlayShowsFlow,
  landingOverlayShowsNebula,
  useBitstreamLandingBackgroundModeStore,
} from "./bitstreamLandingBackgroundMode.store.js";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion.js";

/**
 * Animated shell backdrop: 2D canvas base, 3D cube floor on top, vignette.
 */
export function BitstreamLandingBackground()
{
  const mode = useBitstreamLandingBackgroundModeStore((s) => s.mode);
  const overlay = useBitstreamLandingBackgroundModeStore((s) => s.overlay);
  const prefersReducedMotion = usePrefersReducedMotion();

  const show3d = landingModeShows3d(mode) && !prefersReducedMotion;
  const showGradientBase =
    mode === "2d" ||
    mode === "blend" ||
    (prefersReducedMotion && landingModeShows3d(mode));
  const showNebula = landingOverlayShowsNebula(overlay);
  const showFlow = landingOverlayShowsFlow(overlay);
  const showAny2dLayer = showGradientBase || showNebula || showFlow;
  /** Let the 2D backdrop show through when cubes float over nebula / blend. */
  const transparent3dCanvas = show3d && showAny2dLayer;

  return (
    <>
      {showAny2dLayer ? (
        <BitstreamLandingBackground2D
          showBase={showGradientBase}
          showNebula={showNebula}
          showFlow={showFlow}
          nebulaOpacity={1}
          flowOpacity={1}
        />
      ) : null}

      {show3d ? (
        <BitstreamLandingBackground3D
          animate={!prefersReducedMotion}
          transparentCanvas={transparent3dCanvas}
        />
      ) : null}

      <div className="t3d-flow-canvas-bg__vignette pointer-events-none absolute inset-0 z-2" aria-hidden />
    </>
  );
}
