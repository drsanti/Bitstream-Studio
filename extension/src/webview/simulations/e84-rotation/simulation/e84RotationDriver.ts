/*******************************************************************************
 * File Name : e84RotationDriver.ts
 *
 * Description : Pure rotation math for E84 oscillation (radians).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import * as THREE from "three";
import type { E84RotationSettings } from "../store/e84Movement.store.js";

export type E84RotationRad = {
  x: number;
  y: number;
  z: number;
};

/**
 * Compute clamped Euler rotation (radians) for elapsed simulation time.
 */
export function computeE84RotationRad(
  settings: E84RotationSettings,
  elapsedSeconds: number,
): E84RotationRad
{
  const maxRotationX = THREE.MathUtils.degToRad(settings.limitX);
  const maxRotationY = THREE.MathUtils.degToRad(settings.limitY);
  const maxRotationZ = THREE.MathUtils.degToRad(settings.limitZ);

  const phaseX = 0;
  const phaseY = Math.PI / 3;
  const phaseZ = (Math.PI * 2) / 3;

  const baseX =
    Math.sin(elapsedSeconds * settings.speedX * Math.PI * 2 + phaseX) * maxRotationX;
  const baseY =
    Math.sin(elapsedSeconds * settings.speedY * Math.PI * 2 + phaseY) * maxRotationY;
  const baseZ =
    Math.sin(elapsedSeconds * settings.speedZ * Math.PI * 2 + phaseZ) * maxRotationZ;

  const noiseMaxRadX = THREE.MathUtils.degToRad(settings.noiseScaleX);
  const noiseMaxRadY = THREE.MathUtils.degToRad(settings.noiseScaleY);
  const noiseMaxRadZ = THREE.MathUtils.degToRad(settings.noiseScaleZ);

  const noiseX =
    Math.sin(elapsedSeconds * settings.noiseFreqX * Math.PI * 2) * noiseMaxRadX;
  const noiseY =
    Math.sin(elapsedSeconds * settings.noiseFreqY * Math.PI * 2 + Math.PI / 3) *
    noiseMaxRadY;
  const noiseZ =
    Math.sin(elapsedSeconds * settings.noiseFreqZ * Math.PI * 2 + (Math.PI * 2) / 3) *
    noiseMaxRadZ;

  return {
    x: THREE.MathUtils.clamp(baseX + noiseX, -maxRotationX, maxRotationX),
    y: THREE.MathUtils.clamp(baseY + noiseY, -maxRotationY, maxRotationY),
    z: THREE.MathUtils.clamp(baseZ + noiseZ, -maxRotationZ, maxRotationZ),
  };
}
