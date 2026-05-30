/*******************************************************************************
 * File Name : WelcomeBackground3DScene.tsx
 *
 * Description : R3F scene — glass cube floor + floating shapes (ported from T3D
 *               WelcomeBackground3D.tsx, no T3D engine dependency).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Environment } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import {
  WELCOME_BG3D_CAMERA_FROM,
  WELCOME_BG3D_CAMERA_LOOK_AT,
  WELCOME_BG3D_CUBE_BASE_Y,
  WELCOME_BG3D_CUBE_GAP,
  WELCOME_BG3D_CUBE_SCALE_Y,
  WELCOME_BG3D_CUBE_SIZE,
  WELCOME_BG3D_FLOOR_COLS,
  WELCOME_BG3D_FLOOR_ROWS,
  WELCOME_BG3D_SCENE_BACKGROUND,
} from "./welcomeBackground3DConstants.js";

export type WelcomeBackground3DSceneProps = {
  /** When false, camera is fixed and cube wave animation is skipped. */
  animate?: boolean;
};

type CubeAnimState = {
  mesh: THREE.Mesh;
  phase: number;
  speed: number;
  col: number;
};

/**
 * GSAP camera intro on first mount (matches v1 welcome framing).
 */
function WelcomeBackground3DCamera({ animate }: { animate: boolean })
{
  const { camera } = useThree();

  useEffect(() =>
  {
    camera.position.set(...WELCOME_BG3D_CAMERA_FROM);
    camera.lookAt(...WELCOME_BG3D_CAMERA_LOOK_AT);

    if (!animate)
    {
      return undefined;
    }

    const from = camera.position.clone();
    const to = new THREE.Vector3(...WELCOME_BG3D_CAMERA_FROM);
    let tween: gsap.core.Tween | null = null;
    const timeoutId = window.setTimeout(() =>
    {
      from.copy(camera.position);
      tween = gsap.to(from, {
        duration: 3,
        x: to.x,
        y: to.y,
        z: to.z,
        ease: "power2.out",
        onUpdate: () =>
        {
          camera.position.copy(from);
          camera.lookAt(...WELCOME_BG3D_CAMERA_LOOK_AT);
        },
      });
    }, 400);

    return () =>
    {
      window.clearTimeout(timeoutId);
      if (tween != null)
      {
        tween.kill();
      }
    };
  }, [animate, camera]);

  return null;
}

/**
 * Builds the welcome cube floor, floating shapes, and lights under one group ref.
 */
export function WelcomeBackground3DScene({ animate = true }: WelcomeBackground3DSceneProps)
{
  const rootRef = useRef<THREE.Group>(null);
  const animRef = useRef<{
    mesh1: THREE.Mesh;
    mesh2: THREE.Mesh;
    mesh3: THREE.Mesh;
    group: THREE.Group;
    p1: THREE.PointLight;
    p2: THREE.PointLight;
    p3: THREE.PointLight;
    cubes: CubeAnimState[];
    cols: number;
  } | null>(null);

  useEffect(() =>
  {
    const root = rootRef.current;
    if (root == null)
    {
      return undefined;
    }

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    const mkMat = (color: number) =>
    {
      const material = new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.05,
        metalness: 0,
        transmission: 0.92,
        thickness: 0.6,
        ior: 1.35,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        envMapIntensity: 1.2,
      });
      materials.push(material);
      return material;
    };

    const g1 = new THREE.TorusKnotGeometry(0.9, 0.28, 180, 20);
    const g2 = new THREE.IcosahedronGeometry(0.75, 2);
    const g3 = new THREE.TorusGeometry(1.05, 0.16, 24, 120);
    geometries.push(g1, g2, g3);

    const mesh1 = new THREE.Mesh(g1, mkMat(0x7c3aed));
    const mesh2 = new THREE.Mesh(g2, mkMat(0x22c55e));
    const mesh3 = new THREE.Mesh(g3, mkMat(0x06b6d4));
    mesh1.position.set(-1.6, 1.0, -2.5);
    mesh2.position.set(1.7, -0.4, -3.2);
    mesh3.position.set(0.2, -1.2, -2.0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    const p1 = new THREE.PointLight(0xff3ea5, 2.2, 30);
    const p2 = new THREE.PointLight(0x38bdf8, 2.0, 30);
    const p3 = new THREE.PointLight(0xa3e635, 1.8, 30);
    p1.position.set(-4, 3, 2);
    p2.position.set(4, -1, 3);
    p3.position.set(0, 4, -2);

    const floorGroup = new THREE.Group();
    floorGroup.name = "welcome-floor";
    floorGroup.position.set(0, -2.2, -3.2);
    floorGroup.rotation.x = -0.15;

    const cubeSpacing = Math.max(0, WELCOME_BG3D_CUBE_SIZE.x + WELCOME_BG3D_CUBE_GAP);
    const floorGeom = new THREE.BoxGeometry(
      WELCOME_BG3D_CUBE_SIZE.x,
      WELCOME_BG3D_CUBE_SIZE.y,
      WELCOME_BG3D_CUBE_SIZE.z,
    );
    geometries.push(floorGeom);

    const cols = WELCOME_BG3D_FLOOR_COLS;
    const rows = WELCOME_BG3D_FLOOR_ROWS;
    const cubes: CubeAnimState[] = [];
    const tmpColor = new THREE.Color();

    const rand = (() =>
    {
      if (
        typeof crypto !== "undefined" &&
        typeof crypto.getRandomValues === "function"
      )
      {
        const buf = new Uint32Array(1);
        return () =>
        {
          crypto.getRandomValues(buf);
          return buf[0] / 0xffffffff;
        };
      }
      return () => Math.random();
    })();

    for (let row = 0; row < rows; row += 1)
    {
      for (let col = 0; col < cols; col += 1)
      {
        const x = (col - (cols - 1) / 2) * cubeSpacing;
        const z = (row - (rows - 1) / 2) * cubeSpacing;
        const phase = (col * 0.35 + row * 0.22) * 0.9;
        const speed = 0.8 + ((col + row) % 5) * 0.08;

        tmpColor.setHSL(rand(), 0.95, 0.6);
        const floorMat = new THREE.MeshPhysicalMaterial({
          color: tmpColor.clone(),
          roughness: 0.06,
          metalness: 0,
          transmission: 0.92,
          thickness: 0.45,
          ior: 1.35,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
          clearcoat: 1,
          clearcoatRoughness: 0.08,
          envMapIntensity: 1.1,
          attenuationColor: tmpColor.clone(),
          attenuationDistance: 2.5,
        });
        materials.push(floorMat);

        const cube = new THREE.Mesh(floorGeom, floorMat);
        cube.position.set(x, WELCOME_BG3D_CUBE_BASE_Y, z);
        cube.scale.set(1, WELCOME_BG3D_CUBE_SCALE_Y, 1);
        floorGroup.add(cube);
        cubes.push({ mesh: cube, phase, speed, col });
      }
    }

    root.add(mesh1, mesh2, mesh3, ambient, p1, p2, p3, floorGroup);
    animRef.current = { mesh1, mesh2, mesh3, group: root, p1, p2, p3, cubes, cols };

    return () =>
    {
      animRef.current = null;
      root.clear();
      for (const geometry of geometries)
      {
        geometry.dispose();
      }
      for (const material of materials)
      {
        material.dispose();
      }
    };
  }, []);

  useFrame(({ clock }) =>
  {
    const anim = animRef.current;
    if (anim == null || !animate)
    {
      return;
    }

    const t = clock.getElapsedTime();
    anim.mesh1.rotation.x = t * 0.35;
    anim.mesh1.rotation.y = t * 0.55;
    anim.mesh2.rotation.x = t * 0.45;
    anim.mesh2.rotation.y = -t * 0.35;
    anim.mesh3.rotation.x = -t * 0.25;
    anim.mesh3.rotation.y = t * 0.4;
    anim.group.position.y = Math.sin(t * 0.6) * 0.1;
    anim.p1.intensity = 1.8 + Math.sin(t * 1.2) * 0.4;
    anim.p2.intensity = 1.7 + Math.sin(t * 0.9 + 1.0) * 0.4;
    anim.p3.intensity = 1.5 + Math.sin(t * 1.1 + 2.0) * 0.3;

    for (const entry of anim.cubes)
    {
      const y =
        WELCOME_BG3D_CUBE_BASE_Y +
        0.18 * Math.sin(t * entry.speed + entry.phase) +
        0.06 * Math.sin(t * 1.3 + entry.col * 0.15);
      entry.mesh.position.y = y;
      entry.mesh.scale.y = WELCOME_BG3D_CUBE_SCALE_Y;
    }
  });

  return (
    <>
      <color attach="background" args={[WELCOME_BG3D_SCENE_BACKGROUND]} />
      <Environment preset="city" />
      <WelcomeBackground3DCamera animate={animate} />
      <group ref={rootRef} name="welcome-background" />
    </>
  );
}
