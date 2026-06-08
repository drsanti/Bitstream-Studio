import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Box, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { PresentationStage } from "../../../../widgets/r3f/PresentationStage";
import { PresentationOrbitControls } from "../../../../widgets/r3f/PresentationOrbitControls";

function FloatingChip() {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) {
      return;
    }
    const t = state.clock.elapsedTime;
    ref.current.position.y = Math.sin(t * 0.9) * 0.06;
  });

  return (
    <group ref={ref}>
      <RoundedBox args={[1.6, 0.22, 1.1]} radius={0.04} smoothness={4}>
        <meshStandardMaterial color="#1a4a2a" roughness={0.55} metalness={0.35} />
      </RoundedBox>
      <Box args={[0.42, 0.14, 0.32]} position={[0, 0.18, 0]}>
        <meshStandardMaterial color="#111827" emissive="#FBBF24" emissiveIntensity={0.15} roughness={0.4} metalness={0.7} />
      </Box>
      <mesh position={[0.55, 0.2, 0.2]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#F87171" emissive="#F87171" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[-0.45, 0.2, -0.15]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#60A5FA" emissive="#60A5FA" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

/** Decorative 3D hero for chapter title slides. */
export function ImuChipHero3D() {
  return (
    <div className="h-full min-h-[240px] w-full">
      <Canvas camera={{ position: [2.4, 1.6, 2.6], fov: 40 }} className="h-full w-full" gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <PresentationStage />
          <FloatingChip />
          <PresentationOrbitControls />
        </Suspense>
      </Canvas>
    </div>
  );
}
