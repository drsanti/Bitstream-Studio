import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { applyUserPreviewTransportToClipActions } from "../../../../sensor-studio/features/editor/gltf/glb-preview-user-transport.js";
import { GlbPreviewModelRoot } from "./GlbPreviewModelRoot.js";
import { ROTATION_PREVIEW_MIN_MATERIAL_ENV_MAP_INTENSITY } from "./rotationPreviewConstants.js";
import { useRotationPreviewGlbAnimation } from "./rotation-preview-glb-animation-context.js";

function clipDisplayName(clip: THREE.AnimationClip, index: number): string {
  const nm = typeof clip.name === "string" ? clip.name.trim() : "";
  return nm.length > 0 ? nm : `clip-${index}`;
}

/** Ensures Standard/Physical materials pick up `scene.environment` (many GLBs set intensity to 0). */
function ensureEnvMapIntensityForSceneEnvironment(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) {
      return;
    }
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      if (
        mat instanceof THREE.MeshStandardMaterial ||
        mat instanceof THREE.MeshPhysicalMaterial
      ) {
        if (mat.envMapIntensity < 0.001) {
          mat.envMapIntensity = ROTATION_PREVIEW_MIN_MATERIAL_ENV_MAP_INTENSITY;
        }
        mat.needsUpdate = true;
      }
    }
  });
}

/**
 * Loads an arbitrary GLB URL as the rotation preview body (export transform, env-aware).
 * Uses the cached `useGLTF` scene graph directly (do not clone — clones break skinned clip bindings).
 */
export function RotationPreviewBodyGlb({ url }: { url: string }) {
  const animCtx = useRotationPreviewGlbAnimation();
  const { scene, animations } = useGLTF(url);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clipActionsRef = useRef<Map<string, THREE.AnimationAction>>(new Map());
  const transportRef = useRef(animCtx?.transport ?? "stopped");
  const flowOwnsRef = useRef(animCtx?.flowOwnsPlayback ?? false);
  const setRuntimeReportRef = useRef(animCtx?.setRuntimeReport);
  const envPatchedUrlRef = useRef<string | null>(null);

  transportRef.current = animCtx?.transport ?? "stopped";
  flowOwnsRef.current = animCtx?.flowOwnsPlayback ?? false;
  setRuntimeReportRef.current = animCtx?.setRuntimeReport;

  useEffect(() => {
    return () => {
      scene.parent?.remove(scene);
    };
  }, [scene]);

  useEffect(() => {
    if (envPatchedUrlRef.current === url) {
      return;
    }
    envPatchedUrlRef.current = url;
    ensureEnvMapIntensityForSceneEnvironment(scene);
  }, [scene, url]);

  useEffect(() => {
    const clips = animations ?? [];
    const clipNames: string[] = [];

    if (clips.length === 0) {
      mixerRef.current = null;
      clipActionsRef.current = new Map();
      setRuntimeReportRef.current?.({
        gltfClipCount: 0,
        clipNames: [],
        boundActionCount: 0,
      });
      return;
    }

    const mixer = new THREE.AnimationMixer(scene);
    const map = new Map<string, THREE.AnimationAction>();
    for (let i = 0; i < clips.length; i += 1) {
      const clip = clips[i]!;
      const nm = clipDisplayName(clip, i);
      if (nm.length === 0) {
        continue;
      }
      clipNames.push(nm);
      const ac = mixer.clipAction(clip);
      ac.clampWhenFinished = true;
      ac.setLoop(THREE.LoopRepeat, Infinity);
      ac.play();
      ac.paused = true;
      map.set(nm, ac);
    }
    mixerRef.current = mixer;
    clipActionsRef.current = map;
    setRuntimeReportRef.current?.({
      gltfClipCount: clips.length,
      clipNames,
      boundActionCount: map.size,
    });

    if (!flowOwnsRef.current) {
      applyUserPreviewTransportToClipActions({
        clipActions: map,
        transport: transportRef.current,
      });
    }

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
      mixerRef.current = null;
      clipActionsRef.current = new Map();
    };
  }, [animations, scene, url]);

  useFrame((_, delta) => {
    if (flowOwnsRef.current) {
      return;
    }
    const mixer = mixerRef.current;
    const actions = clipActionsRef.current;
    if (mixer == null || actions.size === 0) {
      return;
    }
    applyUserPreviewTransportToClipActions({
      clipActions: actions,
      transport: transportRef.current,
    });
    if (transportRef.current === "playing") {
      mixer.update(delta);
    }
  });

  return <GlbPreviewModelRoot scene={scene} />;
}
