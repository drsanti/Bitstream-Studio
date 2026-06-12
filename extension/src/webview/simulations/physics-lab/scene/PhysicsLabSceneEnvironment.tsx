"use no memo";

import { Grid } from "@react-three/drei";
import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { SIMULATION_SCENE_BACKGROUND } from "../../shared/canvas/simulationCanvasConstants.js";
import {
  applyPhysicsLabProjectionToggle,
  createPhysicsLabOrthographicCamera,
  updatePhysicsLabOrthographicCameraAspect,
  type PhysicsLabProjectionMode,
} from "../core/physicsLabViewportProjection.js";
import { usePhysicsLabStore } from "../store/physicsLabStore.js";
import { setPhysicsLabOrbitControls } from "./physicsLabOrbitControlsRef.js";

export function PhysicsLabSceneEnvironment() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const orthoCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const perspectiveCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const appliedProjectionRef = useRef<PhysicsLabProjectionMode | null>(null);
  const [controlsReady, setControlsReady] = useState(false);
  const projectionMode = usePhysicsLabStore((s) => s.projectionMode);
  const { camera, set, size } = useThree();

  useFrame(() => {
    controlsRef.current?.update();
  }, -2);

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) {
      return;
    }
    perspectiveCameraRef.current = camera;
  }, [camera]);

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    if (orthoCameraRef.current == null) {
      orthoCameraRef.current = createPhysicsLabOrthographicCamera(aspect);
      return;
    }
    updatePhysicsLabOrthographicCameraAspect(orthoCameraRef.current, aspect);
  }, [size.width, size.height]);

  useEffect(() => {
    const controls = controlsRef.current;
    const ortho = orthoCameraRef.current;
    const persp = perspectiveCameraRef.current;
    if (!controlsReady || controls == null || ortho == null || persp == null) {
      return;
    }

    const aspect = size.width / Math.max(1, size.height);
    updatePhysicsLabOrthographicCameraAspect(ortho, aspect);

    if (appliedProjectionRef.current === projectionMode) {
      controls.update();
      return;
    }

    applyPhysicsLabProjectionToggle({
      mode: projectionMode,
      previousMode: appliedProjectionRef.current,
      controls,
      perspective: persp,
      orthographic: ortho,
    });

    if (projectionMode === "orthographic" && camera !== ortho) {
      set({ camera: ortho });
    } else if (projectionMode === "perspective" && camera !== persp) {
      set({ camera: persp });
    }

    appliedProjectionRef.current = projectionMode;
    controls.update();
  }, [camera, controlsReady, projectionMode, set, size.width, size.height]);

  return (
    <>
      <color attach="background" args={[SIMULATION_SCENE_BACKGROUND]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 8, 6]} intensity={1.1} castShadow={false} />
      <directionalLight position={[-3, 4, -2]} intensity={0.35} />
      <Grid
        position={[0, 0, 0]}
        args={[12, 12]}
        cellSize={0.5}
        cellThickness={0.6}
        sectionSize={2}
        sectionThickness={1}
        fadeDistance={18}
        fadeStrength={1}
        infiniteGrid
      />
      <OrbitControls
        ref={(instance) => {
          controlsRef.current = instance;
          setPhysicsLabOrbitControls(instance);
          setControlsReady(instance != null);
        }}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={0.05}
        maxDistance={500}
        minZoom={0.02}
        maxZoom={200}
      />
    </>
  );
}
