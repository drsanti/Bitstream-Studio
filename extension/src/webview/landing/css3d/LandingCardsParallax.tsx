/*******************************************************************************
 * File Name : LandingCardsParallax.tsx
 *
 * Description : Subtle CSS perspective tilt on card grids when the 3D cube
 *               backdrop is active (flat HTML cards stay visible and clickable).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { type ReactNode } from "react";

export type LandingCardsParallaxProps = {
  enabled: boolean;
  children: ReactNode;
};

/**
 * Wraps a card grid. Subtle lift when 3D/blend backdrop is shown (no 3D CSS transform —
 * perspective/rotateX breaks button hit-testing over the WebGL layer).
 */
export function LandingCardsParallax({ enabled, children }: LandingCardsParallaxProps)
{
  if (!enabled)
  {
    return <>{children}</>;
  }

  return (
    <div className="landing-cards-parallax pointer-events-auto relative">
      {children}
    </div>
  );
}
