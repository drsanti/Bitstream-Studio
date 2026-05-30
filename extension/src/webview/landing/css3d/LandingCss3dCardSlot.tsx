/*******************************************************************************
 * File Name : LandingCss3dCardSlot.tsx
 *
 * Description : Wrapper that registers a card DOM node for CSS3D placement.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect, useRef, type ReactNode } from "react";
import type { LandingCss3dSlotLayout } from "./landingCss3dLayout.js";
import { useLandingCss3dRegistryStore } from "./landingCss3dRegistry.store.js";

export type LandingCss3dCardSlotProps = {
  id: string;
  layout: LandingCss3dSlotLayout;
  css3dEnabled: boolean;
  children: ReactNode;
};

/**
 * When CSS3D is active, the inner card element is reparented by {@link LandingCss3dOverlay}.
 */
export function LandingCss3dCardSlot({
  id,
  layout,
  css3dEnabled,
  children,
}: LandingCss3dCardSlotProps)
{
  const anchorRef = useRef<HTMLDivElement>(null);
  const registerCard = useLandingCss3dRegistryStore((s) => s.registerCard);
  const unregisterCard = useLandingCss3dRegistryStore((s) => s.unregisterCard);

  useEffect(() =>
  {
    if (!css3dEnabled)
    {
      return undefined;
    }

    const anchor = anchorRef.current;
    const element = anchor?.firstElementChild;
    if (!(anchor instanceof HTMLElement) || !(element instanceof HTMLElement))
    {
      return undefined;
    }

    registerCard({ id, element, anchor, layout });

    return () =>
    {
      unregisterCard(id);
      if (element.parentElement !== anchor)
      {
        anchor.appendChild(element);
      }
    };
  }, [css3dEnabled, id, layout, registerCard, unregisterCard]);

  if (!css3dEnabled)
  {
    return <>{children}</>;
  }

  return (
    <div ref={anchorRef} className="landing-css3d-slot min-h-[1px] w-full">
      {children}
    </div>
  );
}
