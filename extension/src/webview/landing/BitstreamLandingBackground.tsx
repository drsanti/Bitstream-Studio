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

import { Suspense, lazy } from "react";
import { BitstreamLandingBackground2D } from "./BitstreamLandingBackground2D.js";
import {
  landingModeShows3d,
  landingOverlayShowsFlow,
  landingOverlayShowsNebula,
  useBitstreamLandingBackgroundModeStore,
} from "./bitstreamLandingBackgroundMode.store.js";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion.js";

const LazyBitstreamLandingBackground3D = lazy(async () =>
{
  const mod = await import("./BitstreamLandingBackground3D.js");
  return { default: mod.BitstreamLandingBackground3D };
});

/** Nebula / flow opacity when composited over the 3D cube floor (blend mode). */
const BLEND_NEBULA_OPACITY = 0.65;
const BLEND_FLOW_OPACITY = 0.35;

/** Lighter overlays when stacked on 3D-only (Shift+double-click presets). */
const OVERLAY_ON_3D_NEBULA_OPACITY = 0.55;
const OVERLAY_ON_3D_FLOW_OPACITY = 0.3;

/**
 * Animated shell backdrop: optional 3D cube floor + optional 2D nebula/flow + vignette.
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

  const nebulaOpacity =
    mode === "blend" && show3d
      ? BLEND_NEBULA_OPACITY
      : mode === "3d"
        ? OVERLAY_ON_3D_NEBULA_OPACITY
        : 1;

  const flowOpacity =
    mode === "blend" && show3d
      ? BLEND_FLOW_OPACITY
      : mode === "3d"
        ? OVERLAY_ON_3D_FLOW_OPACITY
        : 1;

  return (
    <>
      {show3d ? (
        <Suspense fallback={null}>
          <LazyBitstreamLandingBackground3D animate={!prefersReducedMotion} />
        </Suspense>
      ) : null}

      {showAny2dLayer ? (
        <BitstreamLandingBackground2D
          showBase={showGradientBase}
          showNebula={showNebula}
          showFlow={showFlow}
          nebulaOpacity={showNebula ? nebulaOpacity : 1}
          flowOpacity={showFlow ? flowOpacity : 1}
        />
      ) : null}

      <div className="t3d-flow-canvas-bg__vignette pointer-events-none absolute inset-0 z-2" aria-hidden />
    </>
  );
}
