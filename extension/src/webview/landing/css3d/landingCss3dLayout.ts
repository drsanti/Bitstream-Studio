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
export const LANDING_CSS3D_OBJECT_SCALE = 0.011;

/** Fixed card width in CSS pixels once attached to CSS3DRenderer. */
export const LANDING_CSS3D_CARD_WIDTH_PX = 320;

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
  const xSpread = row === 0 ? 2.2 : 2.8;
  const yBase = row === 0 ? 1.35 : 2.05;
  const zBase = row === 0 ? 3.2 : 3.55;
  const yaw = -t * 0.14;

  return {
    position: [t * xSpread, yBase, zBase + Math.abs(t) * 0.25],
    rotation: [0, yaw, 0],
    scale: LANDING_CSS3D_OBJECT_SCALE,
  };
}
