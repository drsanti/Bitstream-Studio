/*******************************************************************************
 * File Name : E84RotationScene.tsx
 *
 * Description : R3F scene — load E84 GLB and apply rotation simulation.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

"use no memo";

import { Center, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { gsap } from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SimulationSceneEnvironment } from "../../shared/canvas/SimulationSceneEnvironment.js";
import { computeE84RotationRad } from "../simulation/e84RotationDriver.js";
import { useE84MovementStore } from "../store/e84Movement.store.js";
import { E84TransformControls } from "./E84TransformControls.js";
import { findE84Target } from "./findE84Target.js";

export type E84RotationSceneProps = {
  modelUrl: string;
};

/**
 * Renders the PSoC E84 model and drives target rotation when simulating.
 */
export function E84RotationScene({ modelUrl }: E84RotationSceneProps)
{
  const gltf = useGLTF(modelUrl);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const targetRef = useRef<THREE.Object3D | null>(null);
  const [targetObject, setTargetObject] = useState<THREE.Object3D | null>(null);
  const startTimeRef = useRef(performance.now() / 1000);
  const resetTweenRef = useRef<gsap.core.Tween | null>(null);

  const uiMode = useE84MovementStore((s) => s.uiMode);
  const isSimulating = useE84MovementStore((s) => s.isSimulating);
  const settings = useE84MovementStore((s) => s.settings);
  const setLiveRotationDeg = useE84MovementStore((s) => s.setLiveRotationDeg);
  const setTargetReady = useE84MovementStore((s) => s.setTargetReady);
  const resetTransformNonce = useE84MovementStore((s) => s.resetTransformNonce);
  const skipInitialResetRef = useRef(true);

  useEffect(() =>
  {
    const found = findE84Target(scene);
    targetRef.current = found;
    setTargetObject(found);
    setTargetReady(found != null);
    return () =>
    {
      setTargetObject(null);
      setTargetReady(false);
    };
  }, [scene, setTargetReady]);

  useEffect(() =>
  {
    if (skipInitialResetRef.current)
    {
      skipInitialResetRef.current = false;
      return;
    }

    const target = targetRef.current;
    if (target == null)
    {
      return;
    }

    if (resetTweenRef.current != null)
    {
      resetTweenRef.current.kill();
    }

    const tweenTarget = {
      px: target.position.x,
      py: target.position.y,
      pz: target.position.z,
      rx: target.rotation.x,
      ry: target.rotation.y,
      rz: target.rotation.z,
      sx: target.scale.x,
      sy: target.scale.y,
      sz: target.scale.z,
    };

    resetTweenRef.current = gsap.to(tweenTarget, {
      px: 0,
      py: 0,
      pz: 0,
      rx: 0,
      ry: 0,
      rz: 0,
      sx: 1,
      sy: 1,
      sz: 1,
      duration: 1,
      ease: "power2.out",
      onUpdate: () =>
      {
        target.position.set(tweenTarget.px, tweenTarget.py, tweenTarget.pz);
        target.rotation.set(tweenTarget.rx, tweenTarget.ry, tweenTarget.rz);
        target.scale.set(tweenTarget.sx, tweenTarget.sy, tweenTarget.sz);
      },
      onComplete: () =>
      {
        resetTweenRef.current = null;
      },
    });
  }, [resetTransformNonce]);

  useEffect(() =>
  {
    if (isSimulating)
    {
      startTimeRef.current = performance.now() / 1000;
    }
  }, [isSimulating]);

  useFrame(() =>
  {
    const target = targetRef.current;
    if (target == null)
    {
      return;
    }

    if (uiMode === "simulation" && isSimulating)
    {
      const elapsed = performance.now() / 1000 - startTimeRef.current;
      const rot = computeE84RotationRad(settings, elapsed);
      target.rotation.set(rot.x, rot.y, rot.z);
    }

    setLiveRotationDeg({
      x: THREE.MathUtils.radToDeg(target.rotation.x),
      y: THREE.MathUtils.radToDeg(target.rotation.y),
      z: THREE.MathUtils.radToDeg(target.rotation.z),
    });
  });

  return (
    <>
      <SimulationSceneEnvironment />
      <Center>
        <primitive object={scene} />
      </Center>
      <E84TransformControls target={targetObject} />
    </>
  );
}
