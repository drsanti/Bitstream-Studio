/*******************************************************************************
 * File Name : LandingCss3dOverlay.tsx
 *
 * Description : CSS3DRenderer overlay synced to the welcome backdrop camera.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { computeLandingCardCss3dTransform } from "./landingCss3dLayout.js";
import { useLandingCss3dCameraStore } from "./landingCss3dCamera.store.js";
import {
  useLandingCss3dRegistryStore,
  type LandingCss3dCardRegistration,
} from "./landingCss3dRegistry.store.js";

export type LandingCss3dOverlayProps = {
  enabled: boolean;
};

type AttachedCard = {
  registration: LandingCss3dCardRegistration;
  object: CSS3DObject;
};

/**
 * Full-viewport CSS3D layer between WebGL backdrop and flat hero copy.
 */
export function LandingCss3dOverlay({ enabled }: LandingCss3dOverlayProps)
{
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() =>
  {
    if (!enabled)
    {
      return undefined;
    }

    const host = hostRef.current;
    if (!host)
    {
      return undefined;
    }

    const cssScene = new THREE.Scene();
    const cssCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    const cssRenderer = new CSS3DRenderer();
    cssRenderer.domElement.className = "landing-css3d-renderer";
    cssRenderer.domElement.style.position = "absolute";
    cssRenderer.domElement.style.inset = "0";
    cssRenderer.domElement.style.pointerEvents = "none";
    host.appendChild(cssRenderer.domElement);

    const attached = new Map<string, AttachedCard>();

    /* --- Block: attach / detach CSS3DObjects from registry --- */
    const syncRegistry = (): void =>
    {
      const cards = useLandingCss3dRegistryStore.getState().cards;

      for (const [id, registration] of Object.entries(cards))
      {
        if (attached.has(id))
        {
          continue;
        }

        const { position, rotation, scale } = computeLandingCardCss3dTransform(
          registration.layout,
        );
        const object = new CSS3DObject(registration.element);
        object.position.set(...position);
        object.rotation.set(...rotation);
        object.scale.setScalar(scale);
        registration.element.style.pointerEvents = "auto";
        cssScene.add(object);
        attached.set(id, { registration, object });
      }

      for (const [id, entry] of attached)
      {
        if (cards[id] == null)
        {
          cssScene.remove(entry.object);
          const { element, anchor } = entry.registration;
          if (element.parentElement !== anchor)
          {
            anchor.appendChild(element);
          }
          attached.delete(id);
        }
      }
    };

    syncRegistry();
    const unsubRegistry = useLandingCss3dRegistryStore.subscribe(syncRegistry);

    /* --- Block: render loop (camera from R3F snapshot) --- */
    let frameId = 0;
    const render = (): void =>
    {
      const snapshot = useLandingCss3dCameraStore.getState().snapshot;
      if (snapshot != null)
      {
        cssCamera.aspect = snapshot.width / Math.max(snapshot.height, 1);
        cssCamera.projectionMatrix.copy(snapshot.projectionMatrix);
        cssCamera.position.copy(snapshot.position);
        cssCamera.quaternion.copy(snapshot.quaternion);
        cssCamera.updateMatrixWorld(true);
        cssRenderer.setSize(snapshot.width, snapshot.height);
        cssRenderer.render(cssScene, cssCamera);
      }

      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);

    const handleResize = (): void =>
    {
      const snapshot = useLandingCss3dCameraStore.getState().snapshot;
      if (snapshot != null)
      {
        cssRenderer.setSize(snapshot.width, snapshot.height);
      }
    };

    window.addEventListener("resize", handleResize);

    return () =>
    {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      unsubRegistry();

      for (const entry of attached.values())
      {
        cssScene.remove(entry.object);
        const { element, anchor } = entry.registration;
        if (element.parentElement !== anchor)
        {
          anchor.appendChild(element);
        }
      }
      attached.clear();

      cssRenderer.domElement.remove();
      useLandingCss3dRegistryStore.getState().clearCards();
    };
  }, [enabled]);

  if (!enabled)
  {
    return null;
  }

  return (
    <div
      ref={hostRef}
      className="landing-css3d-host pointer-events-none absolute inset-0 z-[5]"
      aria-hidden
    />
  );
}
