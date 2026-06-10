import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/** Keeps a solid scene background when cubemap backdrop is disabled. */
export function CourseSceneSolidBackground({
  colorHex,
  active,
}: {
  colorHex: string;
  active: boolean;
}) {
  const { scene } = useThree();

  useFrame(() => {
    if (!active) {
      return;
    }
    if (!(scene.background instanceof THREE.Color)) {
      scene.background = new THREE.Color(colorHex);
      return;
    }
    scene.background.set(colorHex);
  });

  return null;
}
