import * as THREE from "three";

export type StageViewportSelectionHighlightRuntime = {
  setObjectPath: (objectPath: string | null) => void;
  sync: (resolveRoot: (objectPath: string) => THREE.Object3D | null) => void;
  dispose: () => void;
};

export function createStageViewportSelectionHighlightRuntime(
  scene: THREE.Scene,
): StageViewportSelectionHighlightRuntime {
  let selectedPath: string | null = null;
  let helper: THREE.BoxHelper | null = null;
  let attachedUuid: string | null = null;

  const disposeHelper = (): void => {
    if (helper != null) {
      scene.remove(helper);
      helper.geometry.dispose();
      (helper.material as THREE.Material).dispose();
      helper = null;
    }
    attachedUuid = null;
  };

  return {
    setObjectPath: (objectPath) => {
      selectedPath = objectPath;
      if (objectPath == null) {
        disposeHelper();
      }
    },
    sync: (resolveRoot) => {
      if (selectedPath == null) {
        disposeHelper();
        return;
      }
      const root = resolveRoot(selectedPath);
      if (root == null) {
        disposeHelper();
        return;
      }
      if (helper != null && attachedUuid === root.uuid) {
        helper.update();
        return;
      }
      disposeHelper();
      helper = new THREE.BoxHelper(root, 0x38bdf8);
      helper.material.depthTest = true;
      (helper.material as THREE.LineBasicMaterial).transparent = true;
      (helper.material as THREE.LineBasicMaterial).opacity = 0.95;
      scene.add(helper);
      attachedUuid = root.uuid;
      helper.update();
    },
    dispose: () => {
      selectedPath = null;
      disposeHelper();
    },
  };
}
