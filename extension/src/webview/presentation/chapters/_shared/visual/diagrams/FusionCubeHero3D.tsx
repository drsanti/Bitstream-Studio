import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Box } from "@react-three/drei";
import * as THREE from "three";
import { presentationBmi270FrameRef } from "../../../../app/presentationBmi270FrameRef";
import { PresentationStage } from "../../../../widgets/r3f/PresentationStage";
import { PresentationOrbitControls } from "../../../../widgets/r3f/PresentationOrbitControls";

function AttitudeCube() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) {
      return;
    }
    const { qw, qx, qy, qz, quatValid } = presentationBmi270FrameRef.current;
    if (quatValid) {
      ref.current.quaternion.set(qx, qy, qz, qw);
    } else {
      ref.current.rotation.y = state.clock.elapsedTime * 0.4;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <Box ref={ref} args={[0.9, 0.55, 1.2]}>
      <meshStandardMaterial color="#4c1d95" roughness={0.35} metalness={0.45} emissive="#A78BFA" emissiveIntensity={0.12} />
    </Box>
  );
}

/** Quaternion / fusion hero — uses live quaternion when available. */
export function FusionCubeHero3D() {
  return (
    <div className="h-full min-h-[240px] w-full">
      <Canvas camera={{ position: [2.2, 1.5, 2.8], fov: 42 }} className="h-full w-full" gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <PresentationStage />
          <AttitudeCube />
          <PresentationOrbitControls />
        </Suspense>
      </Canvas>
    </div>
  );
}
