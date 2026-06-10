import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import type {
  Scene3dSelectionHighlightStyle,
  Scene3dSelectionRoleAppearance,
} from "./diagram3dSelectionAppearance";
import { hexToThreeColor } from "./diagram3dSelectionAppearance";

function useBoxHighlight(
  targetRef: RefObject<THREE.Object3D | null>,
  appearance: Scene3dSelectionRoleAppearance | null,
  enabled: boolean,
): void {
  const { scene } = useThree();
  const helperRef = useRef<THREE.BoxHelper | null>(null);

  useEffect(() => {
    return () => {
      const helper = helperRef.current;
      if (helper == null) {
        return;
      }
      scene.remove(helper);
      helper.geometry.dispose();
      (helper.material as THREE.Material).dispose();
      helperRef.current = null;
    };
  }, [scene]);

  useFrame(() => {
    const target = targetRef.current;
    const helper = helperRef.current;

    if (!enabled || appearance == null || target == null) {
      if (helper != null) {
        scene.remove(helper);
        helper.geometry.dispose();
        (helper.material as THREE.Material).dispose();
        helperRef.current = null;
      }
      return;
    }

    const color = hexToThreeColor(appearance.color);
    if (helper == null || helper.object !== target) {
      if (helper != null) {
        scene.remove(helper);
        helper.geometry.dispose();
        (helper.material as THREE.Material).dispose();
      }
      const next = new THREE.BoxHelper(target, color);
      const material = next.material as THREE.LineBasicMaterial;
      material.transparent = true;
      material.opacity = appearance.opacity;
      material.depthTest = true;
      scene.add(next);
      helperRef.current = next;
      next.update();
      return;
    }

    const material = helper.material as THREE.LineBasicMaterial;
    material.color.setHex(color);
    material.opacity = appearance.opacity;
    helper.update();
  });
}

function Diagram3dBoxHighlight({
  targetRef,
  appearance,
}: {
  targetRef: RefObject<THREE.Object3D | null>;
  appearance: Scene3dSelectionRoleAppearance;
}) {
  useBoxHighlight(targetRef, appearance, true);
  return null;
}

export function Diagram3dNodeHighlightShell({
  targetRef,
  highlightStyle,
  appearance,
  children,
}: {
  targetRef: RefObject<THREE.Object3D | null>;
  highlightStyle: Scene3dSelectionHighlightStyle;
  appearance: Scene3dSelectionRoleAppearance;
  children: ReactNode;
}) {
  // Box bounds work for Groups + multi-mesh procedural presets. drei <Outlines> expects a
  // single parent Mesh and crashes (applyProps mesh.material undefined) on PCB/triad groups.
  const showBox =
    highlightStyle === "box" ||
    highlightStyle === "silhouette" ||
    highlightStyle === "both";

  return (
    <>
      {children}
      {showBox ? <Diagram3dBoxHighlight targetRef={targetRef} appearance={appearance} /> : null}
    </>
  );
}
