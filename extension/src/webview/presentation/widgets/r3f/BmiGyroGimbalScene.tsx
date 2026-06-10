import { Suspense, useRef, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PresentationOrbitControls } from "./PresentationOrbitControls";
import * as THREE from "three";
import { presentationBmi270FrameRef } from "../../app/presentationBmi270FrameRef";
import { PresentationStage } from "./PresentationStage";
import { PresentationVisualPanel } from "../../chapters/_shared/visual/PresentationVisualPanel";
import { PresentationSceneControlsHint } from "./PresentationSceneControlsHint";

function GimbalScene() {
  const groupRef = useRef<THREE.Group>(null);
  const euler = useRef(new THREE.Euler());

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }
    const { gx, gy, gz } = presentationBmi270FrameRef.current;
    euler.current.x += gx * delta * (Math.PI / 180);
    euler.current.y += gy * delta * (Math.PI / 180);
    euler.current.z += gz * delta * (Math.PI / 180);
    groupRef.current.rotation.copy(euler.current);
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <torusGeometry args={[1.6, 0.04, 16, 64]} />
        <meshStandardMaterial color="#F87171" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.04, 16, 64]} />
        <meshStandardMaterial color="#34D399" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.8, 0.04, 16, 64]} />
        <meshStandardMaterial color="#60A5FA" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.8} />
      </mesh>
    </group>
  );
}

export function BmiGyroGimbalScene({
  className = "",
  framed = false,
  overlay,
  controlsHintClassName,
}: {
  className?: string;
  framed?: boolean;
  overlay?: ReactNode;
  controlsHintClassName?: string;
}) {
  const gimbalOrbitHint = "Drag to orbit · scroll to zoom · gimbal integrates live ω";
  const scene = (
    <div className={`relative flex h-full min-h-0 w-full flex-col bg-[var(--scene-bg)] ${framed ? "" : className}`}>
      <Canvas camera={{ position: [0, 0.4, 5], fov: 40 }} className="min-h-0 flex-1" shadows>
        <Suspense fallback={null}>
          <PresentationStage />
          <GimbalScene />
          <PresentationOrbitControls />
        </Suspense>
      </Canvas>
      {overlay ? <div className="presentation-scene-overlay-layer">{overlay}</div> : null}
      {framed || controlsHintClassName != null ? (
        <PresentationSceneControlsHint orbitHint={gimbalOrbitHint} className={controlsHintClassName} />
      ) : (
        <div className="border-t border-[var(--surface-border)] bg-[var(--surface-panel)] px-4 py-2 text-xs text-[var(--text-secondary)]">
          Rings integrate live ω (teaching visualization — drift without fusion). See Euler &amp; Quaternion chapter.
        </div>
      )}
    </div>
  );

  if (!framed) {
    return scene;
  }

  return (
    <PresentationVisualPanel label="Gimbal view" accent="amber" className={`h-full w-full min-h-0 min-w-0 ${className}`}>
      {scene}
    </PresentationVisualPanel>
  );
}
