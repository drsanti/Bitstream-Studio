import { Text3D } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";

/** three.js sample typeface (HTTPS); used only when the board GLB fails to load. */
const HELVETIKER_BOLD_TYPEFACE_JSON =
  "https://threejs.org/examples/fonts/helvetiker_bold.typeface.json";

const LABEL = "TESAIoT";

/** Radians per second for idle spin around local +Y. */
const Y_SPIN_SPEED = 0.85;

/**
 * Shown inside {@link OrientationMarkerMesh} when the PSOC GLB throws (e.g. missing in VSIX).
 * Extruded red label + continuous Y rotation.
 */
export function GlbMissingTesaiotFallback() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      const mesh = meshRef.current;
      if (cancelled || mesh == null || mesh.geometry == null) {
        return;
      }
      const geom = mesh.geometry;
      if (geom.getAttribute("position") == null) {
        return;
      }
      geom.computeBoundingBox();
      const box = geom.boundingBox;
      if (box == null || box.isEmpty()) {
        return;
      }
      const center = new THREE.Vector3();
      box.getCenter(center);
      mesh.position.sub(center);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, []);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (g != null) {
      g.rotation.y += delta * Y_SPIN_SPEED;
    }
  });

  return (
    <group ref={groupRef}>
      <Text3D
        ref={meshRef}
        bevelEnabled
        bevelSegments={3}
        bevelSize={0.003}
        bevelThickness={0.008}
        curveSegments={12}
        font={HELVETIKER_BOLD_TYPEFACE_JSON}
        height={0.038}
        letterSpacing={0.01}
        lineHeight={1}
        size={0.13}
      >
        {LABEL}
        <meshStandardMaterial
          color="#dc2626"
          envMapIntensity={1}
          metalness={0.12}
          roughness={0.38}
          side={THREE.DoubleSide}
        />
      </Text3D>
    </group>
  );
}
