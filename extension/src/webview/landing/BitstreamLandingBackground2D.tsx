/*******************************************************************************
 * File Name : BitstreamLandingBackground2D.tsx
 *
 * Description : 2D nebula + flow canvas layers for the landing shell.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { FlowCanvasBackground } from "../ui/flow-canvas-background/FlowCanvasBackground.js";
import { BitstreamLandingNebulaLayer } from "./BitstreamLandingNebulaLayer.js";

export type BitstreamLandingBackground2DProps = {
  showBase?: boolean;
  showNebula?: boolean;
  showFlow?: boolean;
  nebulaOpacity?: number;
  flowOpacity?: number;
  className?: string;
};

/**
 * Canvas nebula / particle backdrop (composable sub-layers).
 */
export function BitstreamLandingBackground2D({
  showBase = true,
  showNebula = true,
  showFlow = true,
  nebulaOpacity = 1,
  flowOpacity = 1,
  className,
}: BitstreamLandingBackground2DProps)
{
  if (!showBase && !showNebula && !showFlow)
  {
    return null;
  }

  return (
    <div
      className={[
        "t3d-flow-canvas-bg webview-launcher-bg-2d pointer-events-none absolute inset-0 z-0 overflow-hidden",
        className ?? "",
      ].join(" ")}
      aria-hidden
    >
      {showBase ? <div className="t3d-flow-canvas-bg__base absolute inset-0" /> : null}
      {showNebula ? (
        <div
          className="webview-launcher-bg-nebula absolute inset-0 transition-opacity duration-500"
          style={{ opacity: nebulaOpacity }}
        >
          <BitstreamLandingNebulaLayer />
        </div>
      ) : null}
      {showFlow ? (
        <div
          className="webview-launcher-bg-flow absolute inset-0 transition-opacity duration-500"
          style={{ opacity: flowOpacity }}
        >
          <FlowCanvasBackground
            interactionRootClass="webview-launcher"
            particleDensity={1.85}
            className="t3d-flow-canvas-bg__canvas pointer-events-none absolute inset-0 z-2 h-full w-full"
          />
        </div>
      ) : null}
    </div>
  );
}
