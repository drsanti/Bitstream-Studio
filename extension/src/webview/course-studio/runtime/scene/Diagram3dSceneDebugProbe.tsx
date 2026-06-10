import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { setCourseScene3dDebugSnapshot } from "./courseScene3dDebug";

function formatVec3(v: THREE.Vector3): string {
  return `${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)}`;
}

function describeBackground(background: THREE.Color | THREE.Texture | null): {
  label: string;
  mode: string;
} {
  if (background == null) {
    return { label: "null", mode: "none" };
  }
  if (background instanceof THREE.Color) {
    return { label: `#${background.getHexString()}`, mode: "solid" };
  }
  if (background instanceof THREE.CubeTexture) {
    return { label: "CubeTexture", mode: "cubemap" };
  }
  return { label: background.type ?? "texture", mode: "texture" };
}

function countSceneMeshes(scene: THREE.Scene): number {
  let count = 0;
  scene.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) {
      count += 1;
    }
  });
  return count;
}

function countSceneLights(scene: THREE.Scene): number {
  let count = 0;
  scene.traverse((object) => {
    if ((object as THREE.Light).isLight) {
      count += 1;
    }
  });
  return count;
}

/** Dev-only: samples R3F / Three state for the viewport debug HUD. */
export function Diagram3dSceneDebugProbe({
  modelCount,
  rootCount,
  projection,
  designTime,
}: {
  modelCount: number;
  rootCount: number;
  projection: string;
  designTime: boolean;
}) {
  const { camera, scene, gl, size, frameloop, controls } = useThree();
  const frameCountRef = useRef(0);

  useFrame(() => {
    frameCountRef.current += 1;
    if (frameCountRef.current % 12 !== 0) {
      return;
    }

    const canvas = gl.domElement;
    const hostRect = canvas.parentElement?.parentElement?.getBoundingClientRect();
    const hostW = hostRect != null ? Math.round(hostRect.width) : 0;
    const hostH = hostRect != null ? Math.round(hostRect.height) : 0;
    const context = gl.getContext();
    const orbitControls = controls as OrbitControlsImpl | null | undefined;
    const orbitTarget = orbitControls?.target ?? new THREE.Vector3();
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);

    const cameraFovOrZoom =
      camera instanceof THREE.PerspectiveCamera
        ? `fov ${camera.fov.toFixed(1)}`
        : camera instanceof THREE.OrthographicCamera
          ? `zoom ${camera.zoom.toFixed(3)}`
          : "—";

    setCourseScene3dDebugSnapshot({
      updatedAtMs: Date.now(),
      hostW,
      hostH,
      bufferW: canvas.width,
      bufferH: canvas.height,
      r3fW: size.width,
      r3fH: size.height,
      dpr: gl.getPixelRatio(),
      cameraType: camera.type,
      cameraPos: formatVec3(camera.position),
      cameraFovOrZoom,
      cameraForward: formatVec3(forward),
      orbitTarget: formatVec3(orbitTarget),
      controlsEnabled: orbitControls?.enabled ?? false,
      projection,
      sceneChildren: scene.children.length,
      meshCount: countSceneMeshes(scene),
      lightCount: countSceneLights(scene),
      ...(() => {
        const bg = describeBackground(scene.background);
        return { background: bg.label, backdropMode: bg.mode };
      })(),
      hasEnvironment: scene.environment != null,
      modelCount,
      rootCount,
      frameCount: frameCountRef.current,
      contextLost: context.isContextLost?.() === true,
      frameloop: String(frameloop),
      designTime,
      canvasCount: 1,
      canvasCss: `${Math.round(canvas.getBoundingClientRect().width)}×${Math.round(canvas.getBoundingClientRect().height)}`,
      canvasOpacity: getComputedStyle(canvas).opacity,
    });
  });

  return null;
}

/** Bright marker — if this is invisible, the render pipeline or camera is broken. */
export function Diagram3dDevSceneMarker() {
  return (
    <mesh position={[0, 0.6, 0]} frustumCulled={false} renderOrder={9999}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshBasicMaterial color="#22c55e" toneMapped={false} depthTest={false} />
    </mesh>
  );
}
