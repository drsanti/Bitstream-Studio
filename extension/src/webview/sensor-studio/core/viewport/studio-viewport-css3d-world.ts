import * as THREE from "three";
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import type { Css3dCameraFeedSpec } from "../camera/studio-camera-css3d-feed";
import { studioCameraRuntime } from "../camera/studio-camera-runtime";

type WorldFeedAttachment = {
  object: CSS3DObject;
  videoEl: HTMLVideoElement;
  feedNodeId: string;
  cameraNodeId: string;
};

export type StudioViewportCss3dWorldRuntime = {
  render: () => void;
  syncFeeds: (feeds: Css3dCameraFeedSpec[]) => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
};

export function createStudioViewportCss3dWorldRuntime(args: {
  host: HTMLElement;
  getCamera: () => THREE.Camera | null;
}): StudioViewportCss3dWorldRuntime {
  const cssScene = new THREE.Scene();
  const cssCamera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
  const cssRenderer = new CSS3DRenderer();
  cssRenderer.domElement.className = "studio-viewport-css3d-renderer";
  cssRenderer.domElement.style.position = "absolute";
  cssRenderer.domElement.style.inset = "0";
  cssRenderer.domElement.style.pointerEvents = "none";
  cssRenderer.domElement.style.zIndex = "11";
  args.host.appendChild(cssRenderer.domElement);

  const attached = new Map<string, WorldFeedAttachment>();

  const syncVideoEl = (videoEl: HTMLVideoElement, cameraNodeId: string): void => {
    const source = studioCameraRuntime.getVideoElement(cameraNodeId);
    if (source?.srcObject != null) {
      if (videoEl.srcObject !== source.srcObject) {
        videoEl.srcObject = source.srcObject;
      }
      void videoEl.play().catch(() => undefined);
    } else {
      videoEl.srcObject = null;
    }
  };

  const syncFeeds = (feeds: Css3dCameraFeedSpec[]): void => {
    const worldFeeds = feeds.filter(
      (feed) => feed.anchorMode === "world" && feed.visible && feed.opacity > 0,
    );
    const nextIds = new Set(worldFeeds.map((f) => f.feedNodeId));

    for (const [id, entry] of attached.entries()) {
      if (!nextIds.has(id)) {
        cssScene.remove(entry.object);
        entry.videoEl.remove();
        attached.delete(id);
      }
    }

    for (const feed of worldFeeds) {
      let entry = attached.get(feed.feedNodeId);
      if (entry == null) {
        const videoEl = document.createElement("video");
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.autoplay = true;
        videoEl.style.width = `${feed.sizePx.w}px`;
        videoEl.style.height = `${feed.sizePx.h}px`;
        videoEl.style.objectFit = "cover";
        videoEl.style.borderRadius = `${feed.borderRadiusPx}px`;
        videoEl.style.opacity = String(feed.opacity);
        videoEl.style.background = "rgba(0,0,0,0.85)";
        videoEl.style.border = "1px solid rgba(113,113,122,0.7)";

        const object = new CSS3DObject(videoEl);
        cssScene.add(object);
        entry = {
          object,
          videoEl,
          feedNodeId: feed.feedNodeId,
          cameraNodeId: feed.cameraNodeId,
        };
        attached.set(feed.feedNodeId, entry);
      }

      entry.videoEl.style.opacity = String(feed.opacity);
      entry.videoEl.style.width = `${feed.sizePx.w}px`;
      entry.videoEl.style.height = `${feed.sizePx.h}px`;
      entry.object.position.set(feed.anchor.x, feed.anchor.y, feed.anchor.z);
      entry.object.scale.setScalar(0.0025);
      if (entry.cameraNodeId !== feed.cameraNodeId) {
        entry.cameraNodeId = feed.cameraNodeId;
      }
      syncVideoEl(entry.videoEl, feed.cameraNodeId);
    }
  };

  const render = (): void => {
    const cam = args.getCamera();
    if (cam == null) {
      return;
    }
    if (cam instanceof THREE.PerspectiveCamera) {
      cssCamera.fov = cam.fov;
      cssCamera.aspect = cam.aspect;
    } else if (cam instanceof THREE.OrthographicCamera) {
      cssCamera.fov = 55;
      cssCamera.aspect =
        cam.right > cam.left ? (cam.right - cam.left) / (cam.top - cam.bottom) : 1;
    }
    cssCamera.near = cam.near;
    cssCamera.far = cam.far;
    cssCamera.position.copy(cam.position);
    cssCamera.quaternion.copy(cam.quaternion);
    cssCamera.updateMatrixWorld(true);
    cssCamera.projectionMatrix.copy(cam.projectionMatrix);
    cssCamera.matrixWorldInverse.copy(cam.matrixWorldInverse);
    cssRenderer.render(cssScene, cssCamera);
  };

  const resize = (width: number, height: number): void => {
    cssRenderer.setSize(width, height);
  };

  const dispose = (): void => {
    for (const entry of attached.values()) {
      cssScene.remove(entry.object);
      entry.videoEl.remove();
    }
    attached.clear();
    cssRenderer.domElement.remove();
  };

  return { render, syncFeeds, resize, dispose };
}
