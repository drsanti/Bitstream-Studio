import React, { Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  getEngineEnvironmentCubeMaps,
  getEngineEnvironmentCubeMapPresetAt,
  getEngineEnvironmentDefaultCubeMapIndex,
  getEngineEnvironmentIntensity,
} from "@/engine-environment/t3dEngineEnvironment";
import { buildCubeMapFaceUrls } from "../../model-catalog/model-preview-utils";
import { buildGlobalDirectoryFallbackOptions } from "../../asset-resolution/global-directory-online-fallback";
import { preflightModelPreviewUrlWithGlobalDirectoryFallback } from "./preflightModelPreviewUrl.js";
import { usePreviewMeshMissingUiStore } from "../../bitstream-app/state/previewMeshMissingUi.store.js";

const CAMERA_FOV = 75;
const CAMERA_ELEVATION_DEG = 15;
const FALLBACK_BACKGROUND_COLOR = "#0f1720";

function SceneEnvironmentSetup({
  envPresetIndex,
  envIntensity,
  envEnableHDRI,
  envEnablePBR,
}: {
  envPresetIndex: number;
  envIntensity: number;
  envEnableHDRI: boolean;
  envEnablePBR: boolean;
}) {
  const { scene } = useThree();
  const environmentTextureRef = React.useRef<THREE.CubeTexture | null>(null);
  const [envLoadError, setEnvLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const previousBackground = scene.background;
    const previousEnvironment = scene.environment;
    const previousEnvironmentIntensity = scene.environmentIntensity;
    return () => {
      const texture = environmentTextureRef.current;
      if (texture) {
        texture.dispose();
        environmentTextureRef.current = null;
      }
      scene.background = previousBackground;
      scene.environment = previousEnvironment;
      scene.environmentIntensity = previousEnvironmentIntensity;
    };
  }, [scene]);

  React.useEffect(() => {
    const preset = getEngineEnvironmentCubeMapPresetAt(envPresetIndex);
    if (!preset) {
      return () => undefined;
    }
    let cancelled = false;
    setEnvLoadError(null);
    const urls = buildCubeMapFaceUrls(preset.path);
    const loader = new THREE.CubeTextureLoader();
    loader.load(
      urls,
      (cubeTexture) => {
        if (cancelled) {
          cubeTexture.dispose();
          return;
        }
        setEnvLoadError(null);
        const previous = environmentTextureRef.current;
        environmentTextureRef.current = cubeTexture;
        if (previous && previous !== cubeTexture) {
          previous.dispose();
        }
        scene.background = envEnableHDRI
          ? cubeTexture
          : new THREE.Color(FALLBACK_BACKGROUND_COLOR);
        scene.environment = envEnablePBR ? cubeTexture : null;
      },
      undefined,
      (err) => {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Environment cubemap failed to load (missing files or wrong asset base URI).";
        setEnvLoadError(msg);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [envEnableHDRI, envEnablePBR, envPresetIndex, scene]);

  React.useEffect(() => {
    const texture = environmentTextureRef.current;
    scene.environmentIntensity = Math.max(0, envIntensity);
    scene.background = envEnableHDRI ? texture : new THREE.Color(FALLBACK_BACKGROUND_COLOR);
    scene.environment = envEnablePBR ? texture : null;
    return () => undefined;
  }, [envEnableHDRI, envEnablePBR, envIntensity, scene]);

  if (!envEnableHDRI || !envLoadError) {
    return null;
  }

  return (
    <Html fullscreen>
      <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[420px] rounded-md border border-amber-300/25 bg-black/55 px-3 py-2 text-[11px] text-amber-100 backdrop-blur-sm">
        <div className="font-medium">Environment map not loaded</div>
        <div className="mt-0.5 text-amber-100/80">{envLoadError}</div>
        <div className="mt-1 text-amber-100/70">
          In browser mode, sync cubemap textures via Free Loader and ensure files
          exist under{" "}
          <span className="font-mono">src/assets/textures/cubemap/</span>.
        </div>
      </div>
    </Html>
  );
}

class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error): {
    hasError: boolean;
    errorMessage: string;
  } {
    return { hasError: true, errorMessage: error.message };
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      /** Must not use drei's `<Html>` here — it requires a {@link Canvas} context and crashes with "Hooks can only be used within Canvas". */
      return (
        <div className="flex h-full min-h-[140px] w-full flex-col items-center justify-center gap-1 bg-neutral-950/90 px-3 py-4 text-center">
          <div className="text-xs text-amber-300/90">Failed to load 3D model preview.</div>
          {this.state.errorMessage ? (
            <div className="max-h-28 overflow-auto break-all text-[10px] text-zinc-500">
              {this.state.errorMessage}
            </div>
          ) : null}
          <div className="max-w-md text-[10px] leading-snug text-zinc-500">
            If the URL returns HTML (often a missing file under{" "}
            <span className="font-mono">src/assets</span> in Vite dev), ensure the GLB exists or run
            with the model-downloader bridge so previews resolve to real files.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function FitCameraToModel({
  object,
  controlsRef,
}: {
  object: THREE.Object3D;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera, size } = useThree();

  React.useLayoutEffect(() => {
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) {
      return () => undefined;
    }

    const center = new THREE.Vector3();
    const modelSize = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(modelSize);

    const verticalFov = THREE.MathUtils.degToRad(CAMERA_FOV);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * (size.width / size.height));
    const distanceForHeight = (modelSize.y * 0.5) / Math.tan(verticalFov / 2);
    const distanceForWidth = (modelSize.x * 0.5) / Math.tan(horizontalFov / 2);
    const distanceForDepth = modelSize.z * 0.65;
    const fitDistance = Math.max(distanceForHeight, distanceForWidth, distanceForDepth, 0.2) * 1.25;

    const elevationRad = THREE.MathUtils.degToRad(CAMERA_ELEVATION_DEG);
    const viewDirection = new THREE.Vector3(0, Math.sin(elevationRad), Math.cos(elevationRad))
      .normalize();
    camera.position.copy(center).addScaledVector(viewDirection, fitDistance);
    camera.up.set(0, 1, 0);
    camera.lookAt(center);

    camera.near = Math.max(0.01, fitDistance / 200);
    camera.far = Math.max(100, fitDistance * 30);
    camera.updateProjectionMatrix();

    const controls = controlsRef.current;
    if (controls) {
      controls.target.copy(center);
      controls.update();
    }

    return () => undefined;
  }, [camera, controlsRef, object, size.height, size.width]);

  return null;
}

function PreviewScene({
  modelUrl,
  animationMode,
  activeClipIndex,
  isPlaying,
  onAnimationMetaChange,
}: {
  modelUrl: string;
  animationMode: "single" | "blend";
  activeClipIndex: number;
  isPlaying: boolean;
  onAnimationMetaChange: (clipNames: string[]) => void;
}) {
  const controlsRef = React.useRef<OrbitControlsImpl | null>(null);
  const [autoRotate, setAutoRotate] = React.useState(true);
  const mixerRef = React.useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = React.useRef<THREE.AnimationAction[]>([]);
  // Use the cached scene from useGLTF (do not skeleton-clone: clone can throw on some GLBs and
  // manual dispose fights the loader cache). Standard drei pattern: <primitive object={scene} />.
  const { scene, animations } = useGLTF(modelUrl);

  React.useEffect(() => {
    return () => {
      const mixer = mixerRef.current;
      if (mixer) {
        mixer.stopAllAction();
        mixer.uncacheRoot(scene);
        mixerRef.current = null;
      }
    };
  }, [scene]);

  React.useEffect(() => {
    onAnimationMetaChange(
      animations.map((clip, index) => {
        const trimmed = clip.name?.trim();
        return trimmed && trimmed.length > 0 ? trimmed : `Clip ${index + 1}`;
      })
    );
    return () => undefined;
  }, [animations, onAnimationMetaChange]);

  React.useEffect(() => {
    if (!animations || animations.length === 0) {
      actionsRef.current = [];
      return () => undefined;
    }
    const mixer = new THREE.AnimationMixer(scene);
    mixerRef.current = mixer;
    actionsRef.current = animations.map((clip) => mixer.clipAction(clip));
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
      actionsRef.current = [];
      if (mixerRef.current === mixer) {
        mixerRef.current = null;
      }
    };
  }, [animations, scene]);

  React.useEffect(() => {
    const actions = actionsRef.current;
    if (actions.length === 0) {
      return () => undefined;
    }
    for (const action of actions) {
      action.stop();
      action.enabled = false;
      action.setEffectiveWeight(0);
      action.setEffectiveTimeScale(1);
    }
    if (!isPlaying) {
      return () => undefined;
    }
    if (animationMode === "blend") {
      for (const action of actions) {
        action.enabled = true;
        action.reset();
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.setEffectiveWeight(1);
        action.setEffectiveTimeScale(1);
        action.fadeIn(0.12);
        action.play();
      }
      return () => undefined;
    }
    const safeIndex = Math.min(Math.max(0, activeClipIndex), actions.length - 1);
    const action = actions[safeIndex];
    if (!action) {
      return () => undefined;
    }
    action.enabled = true;
    action.reset();
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.setEffectiveWeight(1);
    action.setEffectiveTimeScale(1);
    action.fadeIn(0.12);
    action.play();
    return () => undefined;
  }, [activeClipIndex, animationMode, isPlaying]);

  React.useEffect(() => {
    setAutoRotate(true);
    return () => undefined;
  }, [modelUrl]);

  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 6, 4]} intensity={1.0} />
      <directionalLight position={[-4, 2, -3]} intensity={0.55} />
      <primitive object={scene} />
      <FitCameraToModel object={scene} controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        enablePan
        enableDamping
        dampingFactor={0.08}
        minDistance={0.05}
        autoRotate={autoRotate}
        autoRotateSpeed={0.9}
        onStart={() => setAutoRotate(false)}
      />
    </>
  );
}

export interface ModelLoaderR3FPreviewProps {
  modelUrl?: string;
  className?: string;
}

export function ModelLoaderR3FPreview({
  modelUrl,
  className = "",
}: ModelLoaderR3FPreviewProps) {
  const containerStyle: React.CSSProperties = { aspectRatio: "2 / 1" };
  type PreviewGate =
    | { kind: "checking" }
    | { kind: "ready"; url: string }
    | { kind: "blocked"; message: string };

  const [previewGate, setPreviewGate] = React.useState<PreviewGate>({
    kind: "checking",
  });

  React.useEffect(() => {
    const trimmed = modelUrl?.trim();
    if (!trimmed) {
      return;
    }
    const ac = new AbortController();
    setPreviewGate({ kind: "checking" });
    void preflightModelPreviewUrlWithGlobalDirectoryFallback(
      trimmed,
      buildGlobalDirectoryFallbackOptions(trimmed),
      ac.signal,
    ).then((r) => {
      if (ac.signal.aborted) {
        return;
      }
      if (r.ok) {
        setPreviewGate({ kind: "ready", url: r.url });
      } else {
        setPreviewGate({ kind: "blocked", message: r.message });
      }
    });
    return () => {
      ac.abort();
    };
  }, [modelUrl]);

  React.useEffect(() => {
    if (previewGate.kind !== "blocked") {
      return;
    }
    const trimmed = modelUrl?.trim();
    if (!trimmed) {
      return;
    }
    usePreviewMeshMissingUiStore.getState().notifyMissingAsset({
      dedupeKey: `model-loader-preview:${trimmed}`,
      title: "Preview model not available",
      description: `${previewGate.message}\n\nURL:\n${trimmed}\n\nModel Loader is opening so you can download or fix catalog paths.`,
      autoOpenModelLoader: true,
    });
  }, [previewGate, modelUrl]);

  const [envPresetIndex, setEnvPresetIndex] = React.useState(
    getEngineEnvironmentDefaultCubeMapIndex()
  );
  const [envIntensity, setEnvIntensity] = React.useState(
    Math.max(0, getEngineEnvironmentIntensity())
  );
  const [envEnableHDRI, setEnvEnableHDRI] = React.useState(true);
  const [envEnablePBR, setEnvEnablePBR] = React.useState(true);
  const [clipNames, setClipNames] = React.useState<string[]>([]);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [animationMode, setAnimationMode] = React.useState<"single" | "blend">("blend");
  const [activeClipIndex, setActiveClipIndex] = React.useState(0);

  React.useEffect(() => {
    setClipNames([]);
    setIsPlaying(true);
    setAnimationMode("blend");
    setActiveClipIndex(0);
    return () => undefined;
  }, [modelUrl]);

  if (!modelUrl) {
    return (
      <div
        className={`w-full rounded border border-white/10 bg-neutral-950/50 flex items-center justify-center px-3 text-xs text-gray-400 ${className}`}
        style={containerStyle}
      >
        3D preview unavailable for this row.
      </div>
    );
  }

  if (previewGate.kind === "checking") {
    return (
      <div
        className={`w-full rounded border border-white/10 bg-neutral-950/50 flex items-center justify-center px-3 text-xs text-zinc-500 ${className}`}
        style={containerStyle}
      >
        Verifying preview URL…
      </div>
    );
  }

  if (previewGate.kind === "blocked") {
    return (
      <div
        className={`w-full rounded border border-amber-800/50 bg-neutral-950/80 flex flex-col items-center justify-center gap-1 px-3 py-4 text-center ${className}`}
        style={containerStyle}
      >
        <div className="text-xs font-medium text-amber-300/90">Preview unavailable</div>
        <div className="max-h-28 overflow-auto text-[10px] leading-snug text-zinc-500">
          {previewGate.message}
        </div>
      </div>
    );
  }

  const validatedUrl = previewGate.url;

  return (
    <div
      className={`w-full rounded border border-white/10 bg-neutral-950/50 overflow-hidden relative ${className}`}
      style={containerStyle}
    >
      {clipNames.length > 0 && (
        <div className="absolute top-2 left-2 z-10 rounded border border-white/20 bg-black/55 backdrop-blur-sm px-2 py-1.5 text-[10px] text-gray-100 flex items-center gap-2">
          <span className="text-gray-300">{clipNames.length} clips</span>
          <button
            type="button"
            className="rounded border border-white/25 px-1.5 py-0.5 hover:bg-white/10"
            onClick={() => setIsPlaying((prev) => !prev)}
            title={isPlaying ? "Pause animation" : "Play animation"}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            className="rounded border border-white/25 px-1.5 py-0.5 hover:bg-white/10"
            onClick={() =>
              setAnimationMode((prev) => (prev === "blend" ? "single" : "blend"))
            }
            title="Toggle blend/single clip mode"
          >
            {animationMode === "blend" ? "Blend" : "Single"}
          </button>
          {animationMode === "single" && clipNames.length > 1 && (
            <select
              className="rounded border border-white/25 bg-black/40 px-1 py-0.5 text-[10px]"
              value={String(activeClipIndex)}
              onChange={(e) => setActiveClipIndex(Number(e.target.value))}
              title="Select animation clip"
            >
              {clipNames.map((name, index) => (
                <option key={`${name}-${index}`} value={String(index)}>
                  {name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
      <div className="absolute top-2 right-2 z-10 rounded border border-white/20 bg-black/55 backdrop-blur-sm px-2 py-1.5 text-[10px] text-gray-100 flex items-center gap-2">
        <label className="flex items-center gap-1 text-gray-300">
          Env
          <select
            className="rounded border border-white/25 bg-black/40 px-1 py-0.5 text-[10px]"
            value={String(envPresetIndex)}
            onChange={(e) => setEnvPresetIndex(Number(e.target.value))}
            title="Environment preset"
          >
            {getEngineEnvironmentCubeMaps().map((preset, idx) => (
              <option key={`${preset.title}-${idx}`} value={String(idx)}>
                {preset.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1 text-gray-300">
          Int
          <input
            type="range"
            min="0"
            max="3"
            step="0.05"
            value={envIntensity}
            onChange={(e) => setEnvIntensity(Number(e.target.value))}
            title="Environment intensity"
            className="w-16"
          />
          <span className="w-8 text-right">{envIntensity.toFixed(2)}</span>
        </label>
        <label className="flex items-center gap-1 text-gray-300">
          <input
            type="checkbox"
            checked={envEnableHDRI}
            onChange={(e) => setEnvEnableHDRI(e.target.checked)}
          />
          HDRI
        </label>
        <label className="flex items-center gap-1 text-gray-300">
          <input
            type="checkbox"
            checked={envEnablePBR}
            onChange={(e) => setEnvEnablePBR(e.target.checked)}
          />
          PBR
        </label>
      </div>
      <PreviewErrorBoundary>
        <Canvas key={validatedUrl} camera={{ fov: CAMERA_FOV, position: [0, 0.2, 2] }}>
          <color attach="background" args={[FALLBACK_BACKGROUND_COLOR]} />
          <SceneEnvironmentSetup
            envPresetIndex={envPresetIndex}
            envIntensity={envIntensity}
            envEnableHDRI={envEnableHDRI}
            envEnablePBR={envEnablePBR}
          />
          <Suspense fallback={null}>
            <PreviewScene
              key={validatedUrl}
              modelUrl={validatedUrl}
              animationMode={animationMode}
              activeClipIndex={activeClipIndex}
              isPlaying={isPlaying}
              onAnimationMetaChange={setClipNames}
            />
          </Suspense>
        </Canvas>
      </PreviewErrorBoundary>
    </div>
  );
}
