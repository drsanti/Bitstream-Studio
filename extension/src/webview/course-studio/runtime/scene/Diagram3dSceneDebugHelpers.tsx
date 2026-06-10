import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

/** Dev-only: RGB axes at scene origin (X red, Y green, Z blue). */
function DebugAxesHelper() {
  const axes = useMemo(() => new THREE.AxesHelper(2.2), []);

  useEffect(() => {
    return () => {
      axes.geometry.dispose();
      (axes.material as THREE.Material).dispose();
    };
  }, [axes]);

  axes.frustumCulled = false;
  axes.renderOrder = 9998;
  return <primitive object={axes} />;
}

/** Dev-only: bright floor grid — confirms world-space Y-up and scale. */
function DebugGridHelper() {
  const grid = useMemo(() => {
    const helper = new THREE.GridHelper(16, 32, "#f59e0b", "#64748b");
    helper.position.y = -0.52;
    return helper;
  }, []);

  useEffect(() => {
    return () => {
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
    };
  }, [grid]);

  grid.frustumCulled = false;
  grid.renderOrder = 9997;
  return <primitive object={grid} />;
}

/** Dev-only: wireframe frustum for the active camera. */
function DebugCameraHelper() {
  const camera = useThree((state) => state.camera);
  const helper = useMemo(() => new THREE.CameraHelper(camera), [camera]);

  useEffect(() => {
    return () => {
      helper.dispose();
    };
  }, [helper]);

  useFrame(() => {
    helper.update();
  });

  helper.frustumCulled = false;
  helper.renderOrder = 9996;
  return <primitive object={helper} />;
}

/** Step-2 debug trio: axes + grid + camera frustum (dev builds only). */
export function Diagram3dSceneDebugHelpers() {
  return (
    <>
      <DebugAxesHelper />
      <DebugGridHelper />
      <DebugCameraHelper />
    </>
  );
}
