import { Suspense, useRef, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Box, Text } from "@react-three/drei";
import { PresentationOrbitControls } from "./PresentationOrbitControls";
import * as THREE from "three";
import { presentationBmi270FrameRef } from "../../app/presentationBmi270FrameRef";
import { PresentationStage } from "./PresentationStage";
import { PresentationVisualPanel } from "../../chapters/_shared/visual/PresentationVisualPanel";
import { PresentationSceneControlsHint } from "./PresentationSceneControlsHint";

function AxisArrow({ dir, color, label }: { dir: [number, number, number]; color: string; label: string }) {
  const length = 0.9;
  const [dx, dy, dz] = dir;
  return (
    <group>
      <arrowHelper
        args={[new THREE.Vector3(...dir).normalize(), new THREE.Vector3(0, 0.05, 0), length, color, 0.18, 0.08]}
      />
      <Text
        position={[dx * (length + 0.2), dy * (length + 0.2) + 0.05, dz * (length + 0.2)]}
        fontSize={0.18}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

function PCBModel() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) {
      return;
    }
    const { qw, qx, qy, qz, quatValid, pitch, roll } = presentationBmi270FrameRef.current;
    if (quatValid) {
      groupRef.current.quaternion.set(qx, qy, qz, qw);
    } else if (presentationBmi270FrameRef.current.eulerValid) {
      const p = (pitch * Math.PI) / 180;
      const r = (roll * Math.PI) / 180;
      groupRef.current.rotation.set(p, groupRef.current.rotation.y + 0.003, r);
    }
  });

  return (
    <group ref={groupRef}>
      <Box args={[2.4, 0.08, 1.6]} castShadow receiveShadow>
        <meshStandardMaterial color="#1a4a2a" roughness={0.7} metalness={0.2} />
      </Box>
      <Box args={[0.35, 0.12, 0.3]} position={[0, 0.1, 0]} castShadow>
        <meshStandardMaterial color="#222222" emissive="#34D399" emissiveIntensity={0.08} roughness={0.5} metalness={0.6} />
      </Box>
      <AxisArrow dir={[1, 0, 0]} color="#F87171" label="X" />
      <AxisArrow dir={[0, 0, -1]} color="#34D399" label="Y" />
      <AxisArrow dir={[0, 1, 0]} color="#60A5FA" label="Z" />
    </group>
  );
}

export function BmiPcbOrientationScene({
  className = "",
  framed = false,
  overlay,
  controlsHintClassName,
}: {
  className?: string;
  framed?: boolean;
  /** Live parameters HUD — rendered over the canvas (orbit still works). */
  overlay?: ReactNode;
  controlsHintClassName?: string;
}) {
  const scene = (
    <div className={`relative flex h-full min-h-0 w-full flex-col bg-[var(--scene-bg)] ${framed ? "" : className}`}>
      <Canvas camera={{ position: [3, 2.5, 4], fov: 45 }} className="min-h-0 flex-1" gl={{ antialias: true }} shadows>
        <Suspense fallback={null}>
          <PresentationStage />
          <PCBModel />
          <PresentationOrbitControls />
        </Suspense>
      </Canvas>
      {overlay ? <div className="presentation-scene-overlay-layer">{overlay}</div> : null}
      <PresentationSceneControlsHint
        orbitHint="Drag to orbit · scroll to zoom · follows live quaternion when published"
        className={controlsHintClassName}
      />
    </div>
  );

  if (!framed) {
    return scene;
  }

  return (
    <PresentationVisualPanel label="3D viewport" accent="amber" className={`h-full w-full min-h-0 min-w-0 ${className}`}>
      {scene}
    </PresentationVisualPanel>
  );
}
