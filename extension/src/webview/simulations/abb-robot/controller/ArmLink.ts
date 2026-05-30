/*******************************************************************************
 * File Name : ArmLink.ts
 *
 * Description : Single ABB joint with GSAP angle animation.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { gsap } from "gsap";
import * as THREE from "three";

export class ArmLink
{
  public readonly name: string;
  public readonly object: THREE.Object3D;
  public readonly rotationAxis: THREE.Vector3;
  private currentAngle = 0;
  private animation: gsap.core.Tween | null = null;

  constructor(
    name: string,
    object: THREE.Object3D,
    rotationAxis: THREE.Vector3,
  )
  {
    this.name = name;
    this.object = object;
    this.rotationAxis = rotationAxis;
  }

  /**
   * Animates joint angle in degrees; callbacks receive rotation vector (rad).
   */
  rotateToAngle(
    angle: number,
    duration: number,
    ease: string,
    onUpdate: (rotation: THREE.Vector3) => void,
    onComplete: (rotation: THREE.Vector3) => void,
  ): void
  {
    if (this.animation != null)
    {
      this.animation.kill();
    }

    this.animation = gsap.to(this, {
      currentAngle: angle,
      duration,
      ease,
      onUpdate: () =>
      {
        const rot = this.rotationAxis
          .clone()
          .multiplyScalar((this.currentAngle * Math.PI) / 180);
        this.object.rotation.set(rot.x, rot.y, rot.z);
        onUpdate(rot);
      },
      onComplete: () =>
      {
        onComplete(this.rotationAxis);
      },
    });
  }

  /** Kills active GSAP tween. */
  dispose(): void
  {
    if (this.animation != null)
    {
      this.animation.kill();
      this.animation = null;
    }
  }
}
