import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { PresentationStage } from "./PresentationStage";
import { PresentationOrbitControls } from "./PresentationOrbitControls";

function AxisTriad() {
  const groupRef = useRef<THREE.Group>(null);

  const axes: Array<{ dir: [number, number, number]; color: string; label: string }> = [
    { dir: [1, 0, 0], color: "#F87171", label: "X" },
    { dir: [0, 0, -1], color: "#34D399", label: "Y" },
    { dir: [0, 1, 0], color: "#60A5FA", label: "Z" },
  ];

  return (
    <group ref={groupRef} position={[0, 0.1, 0]}>
      {axes.map(({ dir, color, label }) => {
        const [dx, dy, dz] = dir;
        const len = 1.1;
        return (
          <group key={label}>
            <arrowHelper
              args={[new THREE.Vector3(...dir).normalize(), new THREE.Vector3(0, 0, 0), len, color, 0.2, 0.1]}
            />
            <Text
              position={[dx * (len + 0.22), dy * (len + 0.22) + 0.05, dz * (len + 0.22)]}
              fontSize={0.22}
              color={color}
              anchorX="center"
              anchorY="middle"
            >
              {label}
            </Text>
          </group>
        );
      })}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 0.08, 0.35]} />
        <meshStandardMaterial color="#1a4a2a" roughness={0.65} metalness={0.25} />
      </mesh>
    </group>
  );
}

export function AxisTriad3DScene({ className = "" }: { className?: string }) {
  return (
    <div className={`h-full w-full bg-[var(--scene-bg)] ${className}`}>
      <Canvas camera={{ position: [2.2, 1.8, 2.8], fov: 42 }} className="h-full w-full" gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <PresentationStage />
          <AxisTriad />
          <PresentationOrbitControls />
        </Suspense>
      </Canvas>
    </div>
  );
}
