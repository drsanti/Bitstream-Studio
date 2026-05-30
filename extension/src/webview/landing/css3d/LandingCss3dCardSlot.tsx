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

import { useCallback, useLayoutEffect, useRef, type ReactNode } from "react";
import type { LandingCss3dSlotLayout } from "./landingCss3dLayout.js";
import { useLandingCss3dRegistryStore } from "./landingCss3dRegistry.store.js";

export type LandingCss3dCardSlotProps = {
  id: string;
  layout: LandingCss3dSlotLayout;
  css3dEnabled: boolean;
  children: ReactNode;
};

/** Stable dependency key for layout objects created inline in JSX. */
export function landingCss3dLayoutKey(layout: LandingCss3dSlotLayout): string
{
  return `${layout.row}:${layout.indexInRow}:${layout.countInRow}`;
}

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
  const elementRef = useRef<HTMLElement | null>(null);
  const registerCard = useLandingCss3dRegistryStore((s) => s.registerCard);
  const unregisterCard = useLandingCss3dRegistryStore((s) => s.unregisterCard);
  const layoutKey = landingCss3dLayoutKey(layout);

  const registerFromDom = useCallback(() =>
  {
    const anchor = anchorRef.current;
    const element = elementRef.current ?? anchor?.firstElementChild;
    if (!(anchor instanceof HTMLElement) || !(element instanceof HTMLElement))
    {
      return;
    }

    elementRef.current = element;
    registerCard({ id, element, anchor, layout });
  }, [id, layout, registerCard]);

  useLayoutEffect(() =>
  {
    if (!css3dEnabled)
    {
      return undefined;
    }

    registerFromDom();

    return () =>
    {
      const anchor = anchorRef.current;
      const element = elementRef.current;
      unregisterCard(id);
      if (anchor != null && element != null && element.parentElement !== anchor)
      {
        anchor.appendChild(element);
      }
      elementRef.current = null;
    };
  }, [css3dEnabled, id, layoutKey, registerFromDom, unregisterCard]);

  const handleAnchorRef = useCallback(
    (node: HTMLDivElement | null) =>
    {
      anchorRef.current = node;
      if (css3dEnabled && node != null)
      {
        registerFromDom();
      }
    },
    [css3dEnabled, registerFromDom],
  );

  if (!css3dEnabled)
  {
    return <>{children}</>;
  }

  return (
    <div
      ref={handleAnchorRef}
      className="landing-css3d-slot w-full"
      data-css3d-slot={id}
    >
      {children}
    </div>
  );
}
