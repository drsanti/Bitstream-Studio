import { useFrame } from "@react-three/fiber";
import { useEffect } from "react";
import { useAnimationLabCss3dCameraStore } from "./animation-lab-css3d-camera.store.js";

/** Publish R3F camera matrices for the animation lab CSS3D overlay. */
export function AnimationLabCss3dCameraSync() {
  const setSnapshot = useAnimationLabCss3dCameraStore((s) => s.setSnapshot);
  const clearSnapshot = useAnimationLabCss3dCameraStore((s) => s.clearSnapshot);

  useFrame(({ camera, size }) => {
    setSnapshot(camera, size.width, size.height);
  });

  useEffect(() => () => clearSnapshot(), [clearSnapshot]);

  return null;
}
