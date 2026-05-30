/*******************************************************************************
 * File Name : landingCss3dLayout.ts
 *
 * Description : Scene-space transforms for landing card CSS3DObjects.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

/** Pixel → world scale for CSS3DObject (tuned for ~320px-wide cards). */
export const LANDING_CSS3D_OBJECT_SCALE = 0.0042;

export type LandingCss3dSlotLayout = {
  /** 0 = workspace row, 1 = simulation row */
  row: number;
  indexInRow: number;
  countInRow: number;
};

export type LandingCss3dTransform = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
};

/**
 * Arranges cards on a shallow arc above the cube floor, facing the welcome camera.
 */
export function computeLandingCardCss3dTransform(
  layout: LandingCss3dSlotLayout,
): LandingCss3dTransform
{
  const { row, indexInRow, countInRow } = layout;
  const span = Math.max(countInRow - 1, 1);
  const t = countInRow <= 1 ? 0 : (indexInRow / span) * 2 - 1;
  const xSpread = row === 0 ? 2.4 : 3.1;
  const yBase = row === 0 ? 2.15 : 3.35;
  const zBase = row === 0 ? 4.6 : 5.15;
  const yaw = -t * 0.12;

  return {
    position: [t * xSpread, yBase, zBase + Math.abs(t) * 0.35],
    rotation: [0, yaw, 0],
    scale: LANDING_CSS3D_OBJECT_SCALE,
  };
}
