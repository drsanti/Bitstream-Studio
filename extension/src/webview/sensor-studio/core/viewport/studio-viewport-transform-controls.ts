import * as THREE from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import type { StudioViewportGizmoMode } from "./studio-viewport-gizmo-mode";

export type StageViewportTransformControlsRuntime = {
  setEnabled: (enabled: boolean) => void;
  setMode: (mode: StudioViewportGizmoMode) => void;
  setCamera: (camera: THREE.Camera) => void;
  sync: (resolveObject: () => THREE.Object3D | null) => void;
  isDragging: () => boolean;
  dispose: () => void;
};

export function createStageViewportTransformControlsRuntime(params: {
  camera: THREE.Camera;
  domElement: HTMLElement;
  scene: THREE.Scene;
  orbitControls: OrbitControls;
  onBeginDrag?: () => void;
  onLiveChange?: (object: THREE.Object3D) => void;
  onCommit: (object: THREE.Object3D) => void;
}): StageViewportTransformControlsRuntime {
  const controls = new TransformControls(params.camera, params.domElement);
  const helper = controls.getHelper();
  params.scene.add(helper);

  let enabled = false;
  helper.visible = false;
  let attachedUuid: string | null = null;
  let dragActive = false;

  const onChange = (): void => {
    if (!dragActive || !enabled) {
      return;
    }
    const obj = controls.object;
    if (obj != null) {
      params.onLiveChange?.(obj);
    }
  };

  const onMouseDown = (): void => {
    dragActive = true;
    params.orbitControls.enabled = false;
    params.onBeginDrag?.();
  };

  const onMouseUp = (): void => {
    if (dragActive && enabled) {
      const obj = controls.object;
      if (obj != null) {
        params.onCommit(obj);
      }
    }
    dragActive = false;
    params.orbitControls.enabled = true;
  };

  controls.addEventListener("change", onChange);
  controls.addEventListener("mouseDown", onMouseDown);
  controls.addEventListener("mouseUp", onMouseUp);

  return {
    setEnabled: (nextEnabled) => {
      enabled = nextEnabled;
      controls.enabled = nextEnabled;
      helper.visible = nextEnabled;
      if (!enabled) {
        controls.detach();
        attachedUuid = null;
      }
    },
    setMode: (mode) => {
      controls.setMode(mode);
    },
    setCamera: (camera) => {
      controls.camera = camera;
    },
    sync: (resolveObject) => {
      if (!enabled) {
        controls.detach();
        attachedUuid = null;
        return;
      }
      if (dragActive) {
        return;
      }
      const obj = resolveObject();
      if (obj == null) {
        controls.detach();
        attachedUuid = null;
        return;
      }
      if (attachedUuid !== obj.uuid) {
        controls.attach(obj);
        attachedUuid = obj.uuid;
      }
    },
    isDragging: () => dragActive,
    dispose: () => {
      controls.removeEventListener("change", onChange);
      controls.removeEventListener("mouseDown", onMouseDown);
      controls.removeEventListener("mouseUp", onMouseUp);
      controls.detach();
      params.scene.remove(helper);
      controls.dispose();
      params.orbitControls.enabled = true;
    },
  };
}
