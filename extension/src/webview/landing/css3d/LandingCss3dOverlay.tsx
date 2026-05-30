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
import {
  computeLandingCardCss3dTransform,
  LANDING_CSS3D_CARD_WIDTH_PX,
} from "./landingCss3dLayout.js";
import {
  useLandingCss3dCameraStore,
  type LandingCss3dCameraSnapshot,
} from "./landingCss3dCamera.store.js";
import {
  useLandingCss3dRegistryStore,
  type LandingCss3dCardRegistration,
} from "./landingCss3dRegistry.store.js";
import {
  WELCOME_BG3D_CAMERA_FROM,
  WELCOME_BG3D_CAMERA_LOOK_AT,
} from "../welcomeBackground3DConstants.js";

export type LandingCss3dOverlayProps = {
  enabled: boolean;
};

type AttachedCard = {
  registration: LandingCss3dCardRegistration;
  object: CSS3DObject;
};

/**
 * Applies a stored R3F camera snapshot to the CSS3D camera (matrices, not just position).
 */
function applyCameraSnapshot(
  cssCamera: THREE.PerspectiveCamera,
  snapshot: LandingCss3dCameraSnapshot,
): void
{
  cssCamera.fov = snapshot.fov;
  cssCamera.aspect = snapshot.aspect;
  cssCamera.near = snapshot.near;
  cssCamera.far = snapshot.far;
  cssCamera.position.copy(snapshot.position);
  cssCamera.quaternion.copy(snapshot.quaternion);
  cssCamera.updateMatrixWorld(true);
  cssCamera.projectionMatrix.copy(snapshot.projectionMatrix);
  cssCamera.matrixWorldInverse.copy(snapshot.matrixWorldInverse);
}

/**
 * Fallback camera until the lazy-loaded R3F canvas publishes its first frame.
 */
function applyFallbackCamera(
  cssCamera: THREE.PerspectiveCamera,
  width: number,
  height: number,
): void
{
  cssCamera.fov = 45;
  cssCamera.aspect = width / Math.max(height, 1);
  cssCamera.near = 0.1;
  cssCamera.far = 200;
  cssCamera.position.set(...WELCOME_BG3D_CAMERA_FROM);
  cssCamera.lookAt(...WELCOME_BG3D_CAMERA_LOOK_AT);
  cssCamera.updateProjectionMatrix();
  cssCamera.updateMatrixWorld(true);
}

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
    cssRenderer.domElement.style.zIndex = "8";
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
        registration.element.style.width = `${LANDING_CSS3D_CARD_WIDTH_PX}px`;
        registration.element.style.maxWidth = "100%";
        registration.element.classList.add("landing-css3d-card");
        cssScene.add(object);
        attached.set(id, { registration, object });
      }

      for (const [id, entry] of attached)
      {
        if (cards[id] == null)
        {
          cssScene.remove(entry.object);
          const { element, anchor } = entry.registration;
          element.classList.remove("landing-css3d-card");
          element.style.removeProperty("width");
          element.style.removeProperty("max-width");
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

    /* --- Block: render loop (camera from R3F snapshot or fallback) --- */
    let frameId = 0;
    const render = (): void =>
    {
      const width = host.clientWidth || window.innerWidth;
      const height = host.clientHeight || window.innerHeight;
      const snapshot = useLandingCss3dCameraStore.getState().snapshot;

      if (snapshot != null)
      {
        applyCameraSnapshot(cssCamera, snapshot);
        cssRenderer.setSize(snapshot.width, snapshot.height);
      }
      else
      {
        applyFallbackCamera(cssCamera, width, height);
        cssRenderer.setSize(width, height);
      }

      cssRenderer.render(cssScene, cssCamera);
      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);

    const handleResize = (): void =>
    {
      const width = host.clientWidth || window.innerWidth;
      const height = host.clientHeight || window.innerHeight;
      cssRenderer.setSize(width, height);
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
        element.classList.remove("landing-css3d-card");
        element.style.removeProperty("width");
        element.style.removeProperty("max-width");
        if (element.parentElement !== anchor)
        {
          anchor.appendChild(element);
        }
      }
      attached.clear();

      cssRenderer.domElement.remove();
    };
  }, [enabled]);

  if (!enabled)
  {
    return null;
  }

  return (
    <div
      ref={hostRef}
      className="landing-css3d-host pointer-events-none fixed inset-0 z-[8]"
    />
  );
}
