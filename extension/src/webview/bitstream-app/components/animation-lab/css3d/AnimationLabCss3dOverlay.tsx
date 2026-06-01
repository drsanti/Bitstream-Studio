import { useEffect, useRef } from "react";
import * as THREE from "three";
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { ROTATION_PREVIEW_CAMERA_POSITION } from "../../3d-rotation/shared/rotationPreviewConstants.js";
import { useAnimationLabCss3dAnchorStore } from "./animation-lab-css3d-anchor.store.js";
import {
  useAnimationLabCss3dCameraStore,
  type AnimationLabCss3dCameraSnapshot,
} from "./animation-lab-css3d-camera.store.js";
import { useAnimationLabTwinTagStyleStore } from "../animation-lab-twin-tag-style.store.js";
import { resolveCss3dHiresScale } from "../animation-lab-twin-graphics.js";
import { DEFAULT_TWIN_TAG_WORLD_SCALE } from "../animation-lab-twin-tag-style.types.js";
import { restoreAnimationLabTwinTagElement } from "./animation-lab-css3d-tag-dom.js";
import { useAnimationLabCss3dTagRegistryStore } from "./animation-lab-css3d-tag-registry.store.js";

type AttachedTag = {
  object: CSS3DObject;
  anchor: HTMLElement;
  element: HTMLElement;
};

function applyCameraSnapshot(
  cssCamera: THREE.PerspectiveCamera,
  snapshot: AnimationLabCss3dCameraSnapshot,
): void {
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

function applyFallbackCamera(
  cssCamera: THREE.PerspectiveCamera,
  width: number,
  height: number,
): void {
  cssCamera.fov = 55;
  cssCamera.aspect = width / Math.max(height, 1);
  cssCamera.near = 0.1;
  cssCamera.far = 200;
  cssCamera.position.set(...ROTATION_PREVIEW_CAMERA_POSITION);
  cssCamera.lookAt(0, 0, 0);
  cssCamera.updateProjectionMatrix();
  cssCamera.updateMatrixWorld(true);
}

export function AnimationLabCss3dOverlay(props: { enabled: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!props.enabled) {
      return undefined;
    }

    const host = hostRef.current;
    if (host == null) {
      return undefined;
    }

    const cssScene = new THREE.Scene();
    const cssCamera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    const cssRenderer = new CSS3DRenderer();
    cssRenderer.domElement.className = "animation-lab-css3d-renderer";
    cssRenderer.domElement.style.position = "absolute";
    cssRenderer.domElement.style.inset = "0";
    cssRenderer.domElement.style.pointerEvents = "none";
    cssRenderer.domElement.style.zIndex = "12";
    host.appendChild(cssRenderer.domElement);

    const attached = new Map<string, AttachedTag>();

    const syncRegistry = (): void => {
      const tags = useAnimationLabCss3dTagRegistryStore.getState().tags;

      for (const [id, registration] of Object.entries(tags)) {
        if (attached.has(id)) {
          continue;
        }
        const object = new CSS3DObject(registration.element);
        const globalScale = useAnimationLabTwinTagStyleStore.getState().global.worldScale;
        const baseScale =
          typeof globalScale === "number" && Number.isFinite(globalScale)
            ? globalScale
            : DEFAULT_TWIN_TAG_WORLD_SCALE;
        const globalStyle = useAnimationLabTwinTagStyleStore.getState().global;
        const hires = resolveCss3dHiresScale(globalStyle.css3dHiresMode);
        object.scale.setScalar(baseScale / hires);
        registration.element.style.pointerEvents = "auto";
        cssScene.add(object);
        attached.set(id, {
          object,
          anchor: registration.anchor,
          element: registration.element,
        });
      }

      for (const [id, entry] of attached) {
        if (tags[id] == null) {
          cssScene.remove(entry.object);
          entry.element.style.removeProperty("pointer-events");
          restoreAnimationLabTwinTagElement(entry.anchor, entry.element);
          attached.delete(id);
        }
      }
    };

    syncRegistry();
    const unsubRegistry = useAnimationLabCss3dTagRegistryStore.subscribe(syncRegistry);

    let frameId = 0;
    const render = (): void => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;
      const snapshot = useAnimationLabCss3dCameraStore.getState().snapshot;
      const positions = useAnimationLabCss3dAnchorStore.getState().positions;

      if (snapshot != null) {
        applyCameraSnapshot(cssCamera, snapshot);
        cssRenderer.setSize(snapshot.width, snapshot.height);
      } else {
        applyFallbackCamera(cssCamera, width, height);
        cssRenderer.setSize(width, height);
      }

      const globalScale = useAnimationLabTwinTagStyleStore.getState().global.worldScale;
      const baseScale =
        typeof globalScale === "number" && Number.isFinite(globalScale)
          ? globalScale
          : DEFAULT_TWIN_TAG_WORLD_SCALE;
      const globalStyle = useAnimationLabTwinTagStyleStore.getState().global;
      const hires = resolveCss3dHiresScale(globalStyle.css3dHiresMode);
      const scale = baseScale / hires;
      const cameraPos = cssCamera.position;
      for (const [id, entry] of attached) {
        const pos = positions[id];
        if (pos != null) {
          entry.object.position.copy(pos);
          entry.object.lookAt(cameraPos);
        }
        entry.object.scale.setScalar(scale);
      }

      cssRenderer.render(cssScene, cssCamera);
      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);

    const onResize = (): void => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;
      cssRenderer.setSize(width, height);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      unsubRegistry();
      for (const entry of attached.values()) {
        cssScene.remove(entry.object);
        restoreAnimationLabTwinTagElement(entry.anchor, entry.element);
      }
      attached.clear();
      useAnimationLabCss3dTagRegistryStore.getState().clearTags();
      cssRenderer.domElement.remove();
    };
  }, [props.enabled]);

  if (!props.enabled) {
    return null;
  }

  return (
    <div
      ref={hostRef}
      className="pointer-events-none absolute inset-0 z-[12] overflow-hidden"
      aria-hidden
    />
  );
}
