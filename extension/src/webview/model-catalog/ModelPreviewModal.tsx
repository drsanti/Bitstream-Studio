import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, ImageIcon, Menu, MonitorPlay, X } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { toast } from 'react-toastify';
import { getEngineEnvironmentCubeMapPresetAt } from "@/engine-environment/t3dEngineEnvironment";
import {
  SETTINGS_KEYS,
  getModelPreviewDefaults,
  loadPersistedSettings,
  savePersistedSettings,
  type ModelPreviewSettings,
  type PreviewClickTargetMode,
  type PreviewFovSourceMode,
  type AnimationBlendMode,
  type AnimationClipLoop,
} from './persisted-settings';
import {
  disposeObject3D,
  computeMeshBounds,
  buildCubeMapFaceUrls,
  applyLoopToAction,
} from './model-preview-utils';
import { useModelPreviewAnimationCallbacks } from './hooks';
import { Button } from '../ui/components/Button';
import { IconMenu, type IconMenuItem } from '../ui/components/IconMenu';
import {
  CollapsiblePanelCard,
  ModelPreviewSettingsCards,
  PreviewDebugPanel,
  type CameraDebugSnapshot,
} from './components';
import { buildGlobalDirectoryFallbackOptions } from '../asset-resolution/global-directory-online-fallback';
import { preflightModelPreviewUrlWithGlobalDirectoryFallback } from '../model-loader/ui/preflightModelPreviewUrl.js';

export interface ModelPreviewModalProps {
  open: boolean;
  onClose: () => void;
  modelUrl?: string | null;
  modelName?: string | null;
  onCaptureThumbnail?: (dataUrl: string) => Promise<void> | void;
}

type ViewStatus =
  | { status: 'loading'; message?: string }
  | { status: 'ready' }
  | { status: 'error'; message: string };

export function ModelPreviewModal({
  open,
  onClose,
  modelUrl,
  modelName,
  onCaptureThumbnail,
}: ModelPreviewModalProps) {
  const initialPreviewSettings = useRef<ModelPreviewSettings>(
    loadPersistedSettings<ModelPreviewSettings>(
      SETTINGS_KEYS.modelPreview,
      getModelPreviewDefaults()
    )
  ).current;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewStatus, setViewStatus] = useState<ViewStatus>({
    status: 'loading',
  });

  const [cameraDebug, setCameraDebug] = useState<CameraDebugSnapshot | null>(
    null
  );
  const [selectedObjectName, setSelectedObjectName] = useState<string | null>(
    null
  );
  const [referenceObjectName, setReferenceObjectName] = useState<string | null>(
    null
  );
  const [leftPanelOpen, setLeftPanelOpen] = useState(
    initialPreviewSettings.leftPanelOpen
  );
  const [rightPanelOpen, setRightPanelOpen] = useState(
    initialPreviewSettings.rightPanelOpen
  );
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  /** Viewer: full-area canvas. Thumbnail: square canvas for framing captures. */
  const [previewUIMode, setPreviewUIMode] = useState<'viewer' | 'thumbnail'>(
    'viewer',
  );
  const previewUIModeRef = useRef<'viewer' | 'thumbnail'>('viewer');
  previewUIModeRef.current = previewUIMode;
  const resizePreviewRef = useRef<(() => void) | null>(null);
  const [pivotRetargetDurationMs, setPivotRetargetDurationMs] = useState(
    initialPreviewSettings.pivotRetargetDurationMs
  );
  const pivotRetargetDurationMsRef = useRef(
    initialPreviewSettings.pivotRetargetDurationMs
  );
  const [clickTargetMode, setClickTargetMode] =
    useState<PreviewClickTargetMode>(initialPreviewSettings.clickTargetMode);
  const clickTargetModeRef = useRef<PreviewClickTargetMode>(
    initialPreviewSettings.clickTargetMode
  );
  const [lastHitPoint, setLastHitPoint] = useState<THREE.Vector3 | null>(null);
  const [lastObjectOrigin, setLastObjectOrigin] = useState<THREE.Vector3 | null>(
    null
  );
  const [envPresetIndex, setEnvPresetIndex] = useState(
    initialPreviewSettings.envPresetIndex
  );
  const [envIntensity, setEnvIntensity] = useState(
    initialPreviewSettings.envIntensity
  );
  const [envEnableHDRI, setEnvEnableHDRI] = useState(
    initialPreviewSettings.envEnableHDRI
  );
  const [envEnablePBR, setEnvEnablePBR] = useState(
    initialPreviewSettings.envEnablePBR
  );
  const [solidBackgroundColor, setSolidBackgroundColor] = useState(
    initialPreviewSettings.solidBackgroundColor
  );
  const envPresetIndexRef = useRef(initialPreviewSettings.envPresetIndex);
  const envIntensityRef = useRef(initialPreviewSettings.envIntensity);
  const envEnableHDRIRef = useRef(initialPreviewSettings.envEnableHDRI);
  const envEnablePBRRef = useRef(initialPreviewSettings.envEnablePBR);
  const solidBackgroundColorRef = useRef(initialPreviewSettings.solidBackgroundColor);
  const [previewFov, setPreviewFov] = useState(initialPreviewSettings.previewFov);
  const previewFovRef = useRef(initialPreviewSettings.previewFov);
  const modelFovRef = useRef<number>(40);
  /** Holds the last explicitly saved FOV; only updated when user changes slider in saved mode. Never overwritten when switching to model. */
  const savedFovRef = useRef(initialPreviewSettings.previewFov);
  const [previewFovSource, setPreviewFovSource] = useState<PreviewFovSourceMode>(
    initialPreviewSettings.previewFovSource
  );
  const previewFovSourceRef = useRef<PreviewFovSourceMode>(
    initialPreviewSettings.previewFovSource
  );
  const applyEnvironmentToSceneRef = useRef<(() => void) | null>(null);
  const reloadEnvironmentRef = useRef<(() => void) | null>(null);
  const applyPreviewFovRef = useRef<(() => void) | null>(null);
  const captureRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const captureSceneRef = useRef<THREE.Scene | null>(null);
  const captureCameraRef = useRef<THREE.Camera | null>(null);

  // Animation controller (when model has embedded animations)
  const [hasAnimations, setHasAnimations] = useState(false);
  const [animationClipNames, setAnimationClipNames] = useState<string[]>([]);
  const [animationClipDurations, setAnimationClipDurations] = useState<number[]>([]);
  const [currentAnimationClipIndex, setCurrentAnimationClipIndex] = useState(0);
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false);
  const [animationBlendMode, setAnimationBlendMode] = useState<AnimationBlendMode>(
    initialPreviewSettings.animationBlendMode
  );
  const [animationClipWeights, setAnimationClipWeights] = useState<number[]>(
    initialPreviewSettings.animationClipWeights
  );
  const [animationClipSpeeds, setAnimationClipSpeeds] = useState<number[]>(
    initialPreviewSettings.animationClipSpeeds
  );
  const [animationClipLoops, setAnimationClipLoops] = useState<AnimationClipLoop[]>(
    initialPreviewSettings.animationClipLoops
  );
  const [animationCrossfadeDuration, setAnimationCrossfadeDuration] = useState(
    initialPreviewSettings.animationCrossfadeDuration
  );
  const [animationScrubTime, setAnimationScrubTime] = useState<number | null>(null);
  const [animationClipScrubTimes, setAnimationClipScrubTimes] = useState<
    number[]
  >([]);
  const [animationBlendCompactView, setAnimationBlendCompactView] = useState(
    initialPreviewSettings.animationBlendCompactView
  );
  const animationMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const animationClipsRef = useRef<THREE.AnimationClip[]>([]);
  const currentAnimationActionRef = useRef<THREE.AnimationAction | null>(null);
  const animationActionsRef = useRef<Map<number, THREE.AnimationAction>>(new Map());
  const scrubActiveRef = useRef(false);
  const animationBlendModeRef = useRef(animationBlendMode);

  // Persist target pose/projection loaded from the model's camera.
  const targetPosRef = useRef<THREE.Vector3 | null>(null);
  const targetQuatRef = useRef<THREE.Quaternion | null>(null);
  const targetEulerRef = useRef<THREE.Euler | null>(null);
  const targetFovRef = useRef<number | null>(null);
  const targetNearRef = useRef<number | null>(null);
  const targetFarRef = useRef<number | null>(null);
  const targetAspectRef = useRef<number | null>(null);

  // Throttle overlay updates to avoid re-rendering every frame.
  const lastDebugUpdateRef = useRef<number>(0);
  const triggerCaptureThumbnail = useCallback(async () => {
    if (!onCaptureThumbnail) {
      return;
    }
    const renderer = captureRendererRef.current;
    const scene = captureSceneRef.current;
    const camera = captureCameraRef.current;
    if (!renderer || !scene || !camera || viewStatus.status !== 'ready') {
      toast.info('Preview is not ready for capture.');
      return;
    }
    try {
      renderer.render(scene, camera);
      const sourceCanvas = renderer.domElement;
      const squareSize = Math.max(
        1,
        Math.min(sourceCanvas.width || 1, sourceCanvas.height || 1)
      );
      const cropX = Math.max(0, Math.floor((sourceCanvas.width - squareSize) / 2));
      const cropY = Math.max(
        0,
        Math.floor((sourceCanvas.height - squareSize) / 2)
      );
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = squareSize;
      outputCanvas.height = squareSize;
      const outputCtx = outputCanvas.getContext('2d');
      if (!outputCtx) {
        throw new Error('Unable to get image context');
      }
      outputCtx.drawImage(
        sourceCanvas,
        cropX,
        cropY,
        squareSize,
        squareSize,
        0,
        0,
        squareSize,
        squareSize
      );
      const dataUrl = outputCanvas.toDataURL('image/png');
      await onCaptureThumbnail(dataUrl);
      toast.success('Thumbnail captured.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Capture failed';
      toast.error(`Capture failed: ${message}`);
    }
  }, [onCaptureThumbnail, viewStatus.status]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 's') return;
      const withMod = event.ctrlKey || event.metaKey;
      if (!withMod || !event.shiftKey) return;
      const activeEl = document.activeElement as HTMLElement | null;
      const tagName = activeEl?.tagName?.toLowerCase();
      const isEditable =
        tagName === 'input' ||
        tagName === 'textarea' ||
        activeEl?.isContentEditable === true;
      if (isEditable) return;
      event.preventDefault();
      void triggerCaptureThumbnail();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, triggerCaptureThumbnail]);

  useEffect(() => {
    if (!open) {
      setHeaderMenuOpen(false);
      setPreviewUIMode('viewer');
    }
  }, [open]);

  useEffect(() => {
    resizePreviewRef.current?.();
  }, [previewUIMode]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (headerMenuOpen) {
        setHeaderMenuOpen(false);
        return;
      }
      onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, headerMenuOpen, onClose]);

  // Projection tuning UI (FOV/aspect modes) removed; we track canvas sizing only.
  useEffect(() => {
    pivotRetargetDurationMsRef.current = pivotRetargetDurationMs;
  }, [pivotRetargetDurationMs]);
  useEffect(() => {
    clickTargetModeRef.current = clickTargetMode;
  }, [clickTargetMode]);
  useEffect(() => {
    envPresetIndexRef.current = envPresetIndex;
    reloadEnvironmentRef.current?.();
  }, [envPresetIndex]);
  useEffect(() => {
    envIntensityRef.current = envIntensity;
    applyEnvironmentToSceneRef.current?.();
  }, [envIntensity]);
  useEffect(() => {
    envEnableHDRIRef.current = envEnableHDRI;
    applyEnvironmentToSceneRef.current?.();
  }, [envEnableHDRI]);
  useEffect(() => {
    envEnablePBRRef.current = envEnablePBR;
    applyEnvironmentToSceneRef.current?.();
  }, [envEnablePBR]);
  useEffect(() => {
    solidBackgroundColorRef.current = solidBackgroundColor;
    applyEnvironmentToSceneRef.current?.();
  }, [solidBackgroundColor]);
  useEffect(() => {
    previewFovRef.current = previewFov;
    applyPreviewFovRef.current?.();
  }, [previewFov]);
  useEffect(() => {
    previewFovSourceRef.current = previewFovSource;
    applyPreviewFovRef.current?.();
  }, [previewFovSource]);
  useEffect(() => {
    animationBlendModeRef.current = animationBlendMode;
  }, [animationBlendMode]);
  useEffect(() => {
    // Persist saved FOV only from savedFovRef so it's never overwritten when in model mode.
    const fovToPersist =
      previewFovSource === 'saved' ? previewFov : savedFovRef.current;
    savePersistedSettings<ModelPreviewSettings>(SETTINGS_KEYS.modelPreview, {
      previewFov: fovToPersist,
      previewFovSource,
      clickTargetMode,
      leftPanelOpen,
      rightPanelOpen,
      pivotRetargetDurationMs,
      envPresetIndex,
      envIntensity,
      envEnableHDRI,
      envEnablePBR,
      solidBackgroundColor,
      animationBlendMode,
      animationClipWeights,
      animationClipSpeeds,
      animationClipLoops,
      animationCrossfadeDuration,
      animationBlendCompactView,
    });
  }, [
    previewFov,
    previewFovSource,
    clickTargetMode,
    leftPanelOpen,
    rightPanelOpen,
    pivotRetargetDurationMs,
    envPresetIndex,
    envIntensity,
    envEnableHDRI,
    envEnablePBR,
    solidBackgroundColor,
    animationBlendMode,
    animationClipWeights,
    animationClipSpeeds,
    animationClipLoops,
    animationCrossfadeDuration,
    animationBlendCompactView,
  ]);

  useEffect(() => {
    if (!open) {
      setLastHitPoint(null);
      setLastObjectOrigin(null);
      applyEnvironmentToSceneRef.current = null;
      reloadEnvironmentRef.current = null;
      applyPreviewFovRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (!modelUrl) {
      setViewStatus({ status: 'error', message: 'No model selected' });
      return;
    }

    let effectAborted = false;
    const abortPreflight = new AbortController();
    let disposeThreeViewer: (() => void) | undefined;

    const fetchUrl = modelUrl.trim();

    void (async () => {
      setViewStatus({ status: 'loading', message: 'Verifying model URL…' });
      const pf = await preflightModelPreviewUrlWithGlobalDirectoryFallback(
        fetchUrl,
        buildGlobalDirectoryFallbackOptions(fetchUrl),
        abortPreflight.signal,
      );
      if (effectAborted) return;
      if (!pf.ok) {
        setViewStatus({ status: 'error', message: pf.message });
        return;
      }
      const validatedUrl = pf.url;

      const container = containerRef.current;
      if (!container || effectAborted) return;

      disposeThreeViewer = (() => {
    let cancelled = false;
    let animationFrameId: number | null = null;

    // Reset debug overlay state/refs for the newly loaded model.
    targetPosRef.current = null;
    targetQuatRef.current = null;
    targetEulerRef.current = null;
    targetFovRef.current = null;
    targetNearRef.current = null;
    targetFarRef.current = null;
    targetAspectRef.current = null;
    setCameraDebug(null);
    lastDebugUpdateRef.current = 0;

    // Reset animation state for new model.
    setHasAnimations(false);
    setAnimationClipNames([]);
    setAnimationClipDurations([]);
    setCurrentAnimationClipIndex(0);
    setIsAnimationPlaying(false);
    setAnimationScrubTime(null);
    setAnimationClipScrubTimes([]);
    scrubActiveRef.current = false;
    animationMixerRef.current = null;
    animationClipsRef.current = [];
    currentAnimationActionRef.current = null;
    animationActionsRef.current.clear();

    const scene = new THREE.Scene();
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(2.5, 3.5, 2.0);
    scene.add(dir);
    let environmentTexture: THREE.CubeTexture | null = null;
    let envRequestId = 0;

    const applyEnvironmentToScene = () => {
      scene.environmentIntensity = Math.max(0, envIntensityRef.current);
      scene.background = envEnableHDRIRef.current
        ? environmentTexture
        : new THREE.Color(solidBackgroundColorRef.current);
      scene.environment = envEnablePBRRef.current ? environmentTexture : null;
    };

    const reloadEnvironment = () => {
      const preset = getEngineEnvironmentCubeMapPresetAt(envPresetIndexRef.current);
      if (!preset) return;

      const urls = buildCubeMapFaceUrls(preset.path);
      const requestId = ++envRequestId;
      const cubeLoader = new THREE.CubeTextureLoader();
      cubeLoader.load(
        urls,
        (cubeTexture) => {
          if (cancelled || requestId !== envRequestId) {
            cubeTexture.dispose();
            return;
          }
          if (environmentTexture && environmentTexture !== cubeTexture) {
            environmentTexture.dispose();
          }
          environmentTexture = cubeTexture;
          applyEnvironmentToScene();
        },
        undefined,
        (error) => {
          if (cancelled || requestId !== envRequestId) return;
          console.warn('[ModelPreviewModal] Failed to load env map preset', {
            preset: preset.title,
            path: preset.path,
            error,
          });
          if (environmentTexture) {
            environmentTexture.dispose();
            environmentTexture = null;
          }
          applyEnvironmentToScene();
        }
      );
    };

    applyEnvironmentToSceneRef.current = applyEnvironmentToScene;
    reloadEnvironmentRef.current = reloadEnvironment;
    reloadEnvironment();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(container.clientWidth, container.clientHeight, false);

    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.01,
      1000
    );
    camera.position.set(0, 2, 4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0, 0);
    controls.update();
    captureRendererRef.current = renderer;
    captureSceneRef.current = scene;
    captureCameraRef.current = camera;

    let currentRoot: THREE.Object3D | null = null;
    let lastAnimationTime = performance.now();
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let clickStart: { x: number; y: number; t: number } | null = null;
    let pivotTweenRaf: number | null = null;
    let pivotTweenPrevControlsEnabled: boolean | null = null;

    const cancelPivotTween = () => {
      if (pivotTweenRaf !== null) {
        cancelAnimationFrame(pivotTweenRaf);
        pivotTweenRaf = null;
      }
      if (pivotTweenPrevControlsEnabled !== null) {
        (controls as unknown as { enabled?: boolean }).enabled =
          pivotTweenPrevControlsEnabled;
        pivotTweenPrevControlsEnabled = null;
      }
    };

    const tweenOrbitPivotTo = (
      nextTarget: THREE.Vector3,
      opts?: { durationMs?: number }
    ) => {
      cancelPivotTween();

      const durationMs = Math.max(0, opts?.durationMs ?? 280);
      const startTime = performance.now();

      const startTarget = controls.target.clone();
      const startCamPos = camera.position.clone();
      const offset = startCamPos.clone().sub(startTarget);
      const endCamPos = nextTarget.clone().add(offset);

      pivotTweenPrevControlsEnabled =
        (controls as unknown as { enabled?: boolean }).enabled ?? true;
      (controls as unknown as { enabled?: boolean }).enabled = false;

      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

      const tick = (now: number) => {
        if (cancelled) return;
        const tRaw = durationMs === 0 ? 1 : (now - startTime) / durationMs;
        const t = Math.min(1, Math.max(0, tRaw));
        const k = easeOutCubic(t);

        controls.target.lerpVectors(startTarget, nextTarget, k);
        camera.position.lerpVectors(startCamPos, endCamPos, k);
        controls.update();

        if (t < 1) {
          pivotTweenRaf = requestAnimationFrame(tick);
          return;
        }

        pivotTweenRaf = null;
        if (pivotTweenPrevControlsEnabled !== null) {
          (controls as unknown as { enabled?: boolean }).enabled =
            pivotTweenPrevControlsEnabled;
          pivotTweenPrevControlsEnabled = null;
        }
      };

      pivotTweenRaf = requestAnimationFrame(tick);
    };

    const applyProjectionTuning = (canvasW: number, canvasH: number) => {
      const canvasAspect = canvasW / Math.max(1, canvasH);
      camera.aspect = Math.max(0.0001, canvasAspect);
      camera.updateProjectionMatrix();
    };
    const applyPreviewFov = () => {
      if (previewFovSourceRef.current === 'saved') {
        camera.fov = THREE.MathUtils.clamp(previewFovRef.current, 5, 140);
      } else {
        camera.fov = THREE.MathUtils.clamp(modelFovRef.current, 5, 140);
      }
      camera.updateProjectionMatrix();
    };
    applyPreviewFovRef.current = applyPreviewFov;

    const applySize = () => {
      const parentEl = container.parentElement;

      if (previewUIModeRef.current === 'thumbnail' && parentEl) {
        // Largest square that fits inside the padded preview area (explicit px so canvas + buffer stay 1:1).
        const cs = window.getComputedStyle(parentEl);
        const padL = parseFloat(cs.paddingLeft) || 0;
        const padR = parseFloat(cs.paddingRight) || 0;
        const padT = parseFloat(cs.paddingTop) || 0;
        const padB = parseFloat(cs.paddingBottom) || 0;
        const innerW = Math.max(0, parentEl.clientWidth - padL - padR);
        const innerH = Math.max(0, parentEl.clientHeight - padT - padB);
        const side = Math.max(1, Math.floor(Math.min(innerW, innerH)));
        container.style.width = `${side}px`;
        container.style.height = `${side}px`;
        container.style.maxWidth = '100%';
        container.style.maxHeight = '100%';
        container.style.marginLeft = 'auto';
        container.style.marginRight = 'auto';
        renderer.setSize(side, side, false);
        applyProjectionTuning(side, side);
        return { w: side, h: side };
      }

      container.style.width = '';
      container.style.height = '';
      container.style.maxWidth = '';
      container.style.maxHeight = '';
      container.style.marginLeft = '';
      container.style.marginRight = '';

      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      renderer.setSize(w, h, false);
      applyProjectionTuning(w, h);
      return { w, h };
    };

    const resize = () => {
      if (!container) return;
      applySize();
    };

    resizePreviewRef.current = resize;

    // Initial size sync and resize tracking: this is critical for 4K/UI scaling.
    applySize();
    const ro = new ResizeObserver(() => {
      if (cancelled) return;
      applySize();
    });
    ro.observe(container);
    if (container.parentElement) {
      ro.observe(container.parentElement);
    }

    setViewStatus({ status: 'loading', message: 'Loading model…' });

    const loader = new GLTFLoader();
    loader
      .loadAsync(validatedUrl)
      .then((gltf) => {
        if (cancelled) return;

        const root = gltf.scene;
        currentRoot = root;
        scene.add(root);

        scene.updateMatrixWorld(true);

        const meshBounds = computeMeshBounds(root);
        const modelBbox = meshBounds ?? new THREE.Box3().setFromObject(root);

        // Pick a reference object to orbit around:
        // - Prefer an object whose name matches the model display name
        // - Otherwise fall back to world origin (0,0,0)
        const normalizeName = (v: string) =>
          v
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-') // spaces, underscores, etc.
            .replace(/^-+|-+$/g, '');

        const fileBaseName = (() => {
          const rawUrl = (modelUrl ?? '').split(/[?#]/)[0] ?? '';
          const tail = rawUrl.split('/').pop() ?? rawUrl;
          if (!tail) return null;
          const withoutExt = tail.replace(/\.(glb|gltf)$/i, '');
          return withoutExt || null;
        })();

        // Prefer matching by file name, then fallback to model display name.
        const targetNames = [
          fileBaseName ? normalizeName(fileBaseName) : null,
          modelName ? normalizeName(modelName) : null,
        ].filter((v): v is string => Boolean(v));

        let referenceObject: THREE.Object3D | null = null;
        if (targetNames.length) {
          // Avoid traverse callback type-narrowing oddities by doing our own walk.
          const stack: THREE.Object3D[] = [root];
          while (stack.length) {
            const obj = stack.pop();
            if (!obj) continue;
            if (
              obj.name &&
              targetNames.includes(normalizeName(obj.name))
            ) {
              referenceObject = obj;
              break;
            }
            for (const child of obj.children) stack.push(child);
          }
        }

        const referenceTarget = new THREE.Vector3(0, 0, 0);
        if (referenceObject) {
          referenceObject.getWorldPosition(referenceTarget);
          setReferenceObjectName(referenceObject.name || referenceObject.type);
        } else {
          setReferenceObjectName('(origin 0,0,0)');
        }

        controls.target.copy(referenceTarget);
        controls.update();

        // If the GLB/GLTF contains a camera node, initialize our preview
        // camera to that same world pose (so the preview starts from the
        // same angle as the thumbnail renderer).
        const gltfCameras = (gltf as { cameras?: THREE.Camera[] }).cameras;
        const desiredCamera = gltfCameras?.[0] ?? null;

        let cameraNode: THREE.Camera | null = null;
        let firstCameraNode: THREE.Camera | null = null;
        root.traverse((obj) => {
          if (obj === null) return;
          const objMaybeCamera = obj as unknown as { isCamera?: boolean };
          if (!objMaybeCamera.isCamera) return;

          const camNode = obj as THREE.Camera;
          if (!firstCameraNode) firstCameraNode = camNode;

          if (
            desiredCamera &&
            (obj === desiredCamera || camNode.uuid === desiredCamera.uuid)
          ) {
            cameraNode = camNode;
          }
        });

        cameraNode = cameraNode ?? firstCameraNode;

        if (cameraNode) {
          const camNode = cameraNode as THREE.Camera;
          camNode.updateMatrixWorld(true);

          const worldPos = new THREE.Vector3();
          const worldQuat = new THREE.Quaternion();
          camNode.getWorldPosition(worldPos);
          camNode.getWorldQuaternion(worldQuat);

          camera.position.copy(worldPos);
          camera.quaternion.copy(worldQuat);

          // Keep authored camera projection params as a starting point.
          if (camNode instanceof THREE.PerspectiveCamera) {
            camera.fov = camNode.fov;
            camera.near = camNode.near;
            camera.far = camNode.far;
            modelFovRef.current = camNode.fov;
          } else {
            modelFovRef.current = camera.fov;
          }

          camera.updateProjectionMatrix();
          applyPreviewFov();

          // Match T3D behavior: derive look target from camera forward direction.
          // (Use a stable distance so OrbitControls has a sensible target.)
          const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
            camera.quaternion
          );
          const lookAtPoint = new THREE.Vector3(
            camera.position.x + forward.x * 10,
            camera.position.y + forward.y * 10,
            camera.position.z + forward.z * 10
          );
          // Use reference target if present; otherwise use camera-derived lookAt.
          if (referenceObject) {
            controls.target.copy(referenceTarget);
          } else {
            controls.target.copy(lookAtPoint);
          }
          controls.update();

          const targetPos = camera.position.clone();
          const targetQuat = camera.quaternion.clone();

          // Persist target pose/projection for debug overlay.
          targetPosRef.current = targetPos.clone();
          targetQuatRef.current = targetQuat.clone();
          targetEulerRef.current = new THREE.Euler().setFromQuaternion(
            targetQuat,
            'XYZ'
          );
          targetFovRef.current = camera.fov;
          targetNearRef.current = camera.near;
          targetFarRef.current = camera.far;
          targetAspectRef.current = camera.aspect;

          // IMPORTANT: don't override the initial OrbitControls target here.
          // We already chose between referenceTarget vs lookAtPoint above.
        } else {
          // No camera in file: frame the model using its bounding sphere.
          const sphere = modelBbox.getBoundingSphere(new THREE.Sphere());
          const radius = sphere.radius || 1;
          const dist =
            radius / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

          const dir = new THREE.Vector3(0, 0, 1); // pull back along +Z by default
          // Default behavior: look at reference target if available; otherwise origin.
          camera.position.copy(controls.target).addScaledVector(dir, dist * 1.1);
          controls.update();

          // Persist a target snapshot for overlay as well.
          targetPosRef.current = camera.position.clone();
          targetQuatRef.current = camera.quaternion.clone();
          targetEulerRef.current = new THREE.Euler().setFromQuaternion(
            camera.quaternion,
            'XYZ'
          );
          targetFovRef.current = camera.fov;
          targetNearRef.current = camera.near;
          targetFarRef.current = camera.far;
          targetAspectRef.current = camera.aspect;
          modelFovRef.current = camera.fov;
          applyPreviewFov();
        }

        // Detect and setup embedded animations.
        const gltfAnimations = (gltf as { animations?: THREE.AnimationClip[] })
          .animations;
        if (gltfAnimations?.length) {
          const mixer = new THREE.AnimationMixer(root);
          animationMixerRef.current = mixer;
          animationClipsRef.current = gltfAnimations;
          const names = gltfAnimations.map((c, i) => c.name || `Clip ${i + 1}`);
          const durations = gltfAnimations.map((c) => c.duration ?? 0);
          setAnimationClipNames(names);
          setAnimationClipDurations(durations);
          setHasAnimations(true);
          setCurrentAnimationClipIndex(0);
          setAnimationBlendMode('blend');
          animationBlendModeRef.current = 'blend';
          setIsAnimationPlaying(true);
          setAnimationScrubTime(null);
          setAnimationClipScrubTimes([]);
          scrubActiveRef.current = false;
          const n = gltfAnimations.length;
          const saved = initialPreviewSettings;
          const initialWeights =
            saved.animationClipWeights?.length === n
              ? [...saved.animationClipWeights]
              : Array(n).fill(1);
          const initialSpeeds =
            saved.animationClipSpeeds?.length === n
              ? [...saved.animationClipSpeeds]
              : Array(n).fill(1);
          const initialLoops =
            saved.animationClipLoops?.length === n
              ? [...saved.animationClipLoops]
              : Array(n).fill('loop' as AnimationClipLoop);

          setAnimationClipWeights(initialWeights);
          setAnimationClipSpeeds(initialSpeeds);
          setAnimationClipLoops(initialLoops);
          setAnimationClipScrubTimes(Array(n).fill(0));

          // Autoplay in blend mode by default on load.
          animationActionsRef.current.forEach((action) => action.stop());
          animationActionsRef.current.clear();
          currentAnimationActionRef.current = null;

          gltfAnimations.forEach((clip, i) => {
            const action = mixer.clipAction(clip);
            action.play();
            applyLoopToAction(action, initialLoops[i] ?? 'loop');
            action.timeScale = initialSpeeds[i] ?? 1;
            action.setEffectiveWeight(initialWeights[i] ?? 1);
            animationActionsRef.current.set(i, action);
          });
          mixer.timeScale = 1;
        }

        setViewStatus({ status: 'ready' });
      })
      .catch((err) => {
        if (cancelled) return;
        let message = err instanceof Error ? err.message : 'Load failed';
        if (
          /Unexpected token.*not valid JSON/i.test(message) ||
          /<!DOCTYPE/i.test(message)
        ) {
          message =
            'The server returned a web page instead of a model file (missing GLB on disk, wrong path, or dev server SPA fallback).';
        }
        setViewStatus({ status: 'error', message });
      });

    const animate = () => {
      if (cancelled) return;

      const now = performance.now();
      const deltaTime = (now - lastAnimationTime) / 1000;
      lastAnimationTime = now;

      // Update animation mixer if model has embedded animations.
      const mixer = animationMixerRef.current;
      if (mixer) {
        if (scrubActiveRef.current) {
          mixer.timeScale = 0;
        }
        mixer.update(deltaTime);
      }

      // Apply user tuning continuously (FOV + aspect behavior).
      const { w, h } = applySize();

      // --- Camera debug overlay + animation playback time (throttled) ---
      const debugEveryMs = 100;
      if (now - lastDebugUpdateRef.current >= debugEveryMs) {
        lastDebugUpdateRef.current = now;
        if (
          !scrubActiveRef.current &&
          animationBlendModeRef.current === 'single' &&
          currentAnimationActionRef.current
        ) {
          const action = currentAnimationActionRef.current;
          const clip = action.getClip();
          const dur = clip?.duration ?? 0;
          if (dur > 0) {
            const norm = Math.min(1, Math.max(0, action.time / dur));
            setAnimationScrubTime(norm);
          }
        }

          if (
            !scrubActiveRef.current &&
            animationBlendModeRef.current === 'blend'
          ) {
            const clips = animationClipsRef.current;
            const times: number[] = Array(clips.length).fill(0);
            if (clips.length) {
              for (let i = 0; i < clips.length; i++) {
                const action = animationActionsRef.current.get(i);
                const dur = clips[i]?.duration ?? 0;
                if (!action || !(dur > 0)) continue;

                // action.time can move past the duration when looping;
                // normalize it back into [0, duration).
                const t = ((action.time % dur) + dur) % dur;
                times[i] = Math.min(1, Math.max(0, t / dur));
              }
              setAnimationClipScrubTimes(times);
            }
          }

        const tPos = targetPosRef.current;
        const tQuat = targetQuatRef.current;
        const tEuler = targetEulerRef.current;
        const tFov = targetFovRef.current;
        const tNear = targetNearRef.current;
        const tFar = targetFarRef.current;
        const tAspect = targetAspectRef.current;

        if (
          tPos &&
          tQuat &&
          tEuler &&
          tFov !== null &&
          tNear !== null &&
          tFar !== null &&
          tAspect !== null
        ) {
          const currentEuler = new THREE.Euler().setFromQuaternion(
            camera.quaternion,
            'XYZ'
          );

          const posDiff = camera.position.distanceTo(tPos);
          const quatDiffDeg = THREE.MathUtils.radToDeg(
            tQuat.angleTo(camera.quaternion)
          );

          const posOk = posDiff < 0.001;
          const quatOk = quatDiffDeg < 0.1;

          const toPoseNumbers = (
            pos: THREE.Vector3,
            quat: THREE.Quaternion,
            euler: THREE.Euler,
            fov: number,
            near: number,
            far: number,
            aspect: number,
            target: THREE.Vector3
          ) => ({
            px: pos.x,
            py: pos.y,
            pz: pos.z,
            qx: quat.x,
            qy: quat.y,
            qz: quat.z,
            qw: quat.w,
            exDeg: THREE.MathUtils.radToDeg(euler.x),
            eyDeg: THREE.MathUtils.radToDeg(euler.y),
            ezDeg: THREE.MathUtils.radToDeg(euler.z),
            fov,
            near,
            far,
            aspect,
            tx: target.x,
            ty: target.y,
            tz: target.z,
          });

          const targetPose = toPoseNumbers(
            tPos,
            tQuat,
            tEuler,
            tFov,
            tNear,
            tFar,
            tAspect,
            controls.target
          );
          const currentPose = toPoseNumbers(
            camera.position,
            camera.quaternion,
            currentEuler,
            camera.fov,
            camera.near,
            camera.far,
            camera.aspect,
            controls.target
          );

          setCameraDebug({
            target: targetPose,
            current: currentPose,
            posDiff,
            quatDiffDeg,
            posOk,
            quatOk,
            canvasW: w,
            canvasH: h,
            canvasAspect: w / Math.max(1, h),
          });
        }
      }

      const controlsEnabled =
        (controls as unknown as { enabled?: boolean }).enabled ?? true;
      if (controlsEnabled) controls.update();
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    function onPointerDown(ev: PointerEvent) {
      clickStart = { x: ev.clientX, y: ev.clientY, t: performance.now() };

      // If a pivot tween is currently running, stop it on any pointer down.
      // Keep the current in-flight target point as-is.
      if (pivotTweenRaf !== null) {
        cancelPivotTween();
        controls.update();
      }
    }

    function onPointerUp(ev: PointerEvent) {
      if (cancelled) return;
      const root = currentRoot;
      if (!root) return;
      if (!clickStart) return;

      const dt = performance.now() - clickStart.t;
      const dx = ev.clientX - clickStart.x;
      const dy = ev.clientY - clickStart.y;
      clickStart = null;

      // Treat as a click only if the pointer didn't move (avoid fighting OrbitControls drag).
      const movedPx = Math.hypot(dx, dy);
      const isClick = movedPx < 3 && dt < 300;
      if (!isClick) return;

      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 1 || rect.height <= 1) return;

      pointerNdc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -(((ev.clientY - rect.top) / rect.height) * 2 - 1);

      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObject(root, true);
      if (hits.length === 0) {
        // Empty-space click: stop any in-progress pivot animation.
        cancelPivotTween();
        return;
      }

      const hit = hits[0];
      const obj = hit.object;
      setSelectedObjectName(obj.name?.trim() ? obj.name : obj.type);
      setLastHitPoint(hit.point.clone());

      const objectOrigin = new THREE.Vector3();
      obj.getWorldPosition(objectOrigin);
      setLastObjectOrigin(objectOrigin.clone());

      // Do not start a new animation; only stop if one was playing (handled in onPointerDown).
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelled = true;
      ro.disconnect();
      resizePreviewRef.current = null;
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      cancelPivotTween();
      applyEnvironmentToSceneRef.current = null;
      reloadEnvironmentRef.current = null;
      applyPreviewFovRef.current = null;
      if (environmentTexture) {
        environmentTexture.dispose();
        environmentTexture = null;
      }
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      controls.dispose?.();
      animationMixerRef.current = null;
      animationClipsRef.current = [];
      currentAnimationActionRef.current = null;
      animationActionsRef.current.forEach((a) => a.stop());
      animationActionsRef.current.clear();
      if (currentRoot) {
        try {
          disposeObject3D(currentRoot);
        } catch {
          // ignore cleanup failures
        }
        scene.remove(currentRoot);
      }

      renderer.dispose();
      if (captureRendererRef.current === renderer) {
        captureRendererRef.current = null;
      }
      if (captureSceneRef.current === scene) {
        captureSceneRef.current = null;
      }
      if (captureCameraRef.current === camera) {
        captureCameraRef.current = null;
      }
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
      })();
    })();

    return () => {
      effectAborted = true;
      abortPreflight.abort();
      disposeThreeViewer?.();
    };
  }, [open, modelUrl]);

  const animationCallbacks = useModelPreviewAnimationCallbacks({
    animationMixerRef,
    animationClipsRef,
    currentAnimationActionRef,
    animationActionsRef,
    scrubActiveRef,
    currentAnimationClipIndex,
    animationBlendMode,
    animationClipWeights,
    animationClipSpeeds,
    animationClipLoops,
    animationCrossfadeDuration,
    animationClipNames,
    setCurrentAnimationClipIndex,
    setIsAnimationPlaying,
    setAnimationBlendMode,
    setAnimationClipWeights,
    setAnimationClipSpeeds,
    setAnimationClipLoops,
    setAnimationCrossfadeDuration,
    setAnimationScrubTime,
    animationClipScrubTimes,
    setAnimationClipScrubTimes,
    setAnimationBlendCompactView,
  });

  const previewHeaderMenuItems: IconMenuItem[] = useMemo(
    () => [
      {
        id: 'mode-viewer',
        label: 'Viewer Mode',
        icon: <MonitorPlay className="h-3.5 w-3.5 shrink-0" />,
        onSelect: () => {
          setPreviewUIMode('viewer');
        },
        title: 'Full-area 3D view',
        className:
          previewUIMode === 'viewer'
            ? 'bg-white/12 text-gray-100'
            : undefined,
      },
      {
        id: 'mode-thumbnail',
        label: 'Thumbnail Mode',
        icon: <ImageIcon className="h-3.5 w-3.5 shrink-0" />,
        onSelect: () => {
          setPreviewUIMode('thumbnail');
        },
        title: 'Square canvas for thumbnail capture',
        className:
          previewUIMode === 'thumbnail'
            ? 'bg-white/12 text-gray-100'
            : undefined,
      },
      {
        id: 'close',
        label: 'Close',
        icon: <X className="h-3.5 w-3.5 shrink-0" />,
        onSelect: onClose,
        title: 'Close preview',
      },
    ],
    [onClose, previewUIMode],
  );

  if (!open) return null;

  return (
    <div
      className="t3d-shell-overlay fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return;
        onClose();
      }}
    >
      <div
        className="w-[90%] h-[90%] rounded-lg border border-border/50 bg-card/65 backdrop-blur-xl shadow-2xl shadow-black/35 overflow-hidden flex flex-col"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-[8px] border-b border-border/50 bg-white/5">
          <div className="min-w-0">
            <div className="font-semibold truncate flex items-center gap-2 min-w-0">
              {previewUIMode === 'viewer' ? (
                <Box
                  className="h-5 w-5 shrink-0 text-gray-200"
                  aria-hidden
                />
              ) : (
                <ImageIcon
                  className="h-5 w-5 shrink-0 text-gray-200"
                  aria-hidden
                />
              )}
              <span className="min-w-0 truncate">
                {previewUIMode === 'viewer'
                  ? 'Model Viewer'
                  : 'Thumbnail Renderer'}
                {modelName != null && modelName.trim() !== ''
                  ? ` (${modelName.trim()})`
                  : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {previewUIMode === 'thumbnail' && (
              <Button
                variant="secondary"
                disabled={
                  viewStatus.status !== 'ready' || !onCaptureThumbnail
                }
                title="Update stored thumbnail from current view (Ctrl/Cmd+Shift+S)"
                onClick={() => {
                  void triggerCaptureThumbnail();
                }}
                className="h-7 shrink-0 inline-flex items-center justify-center gap-1.5 border border-emerald-300/25 bg-emerald-500/6! px-2.5 py-0 text-xs font-medium leading-none text-emerald-50! shadow-sm shadow-black/20 backdrop-blur-md hover:bg-emerald-500/12! disabled:pointer-events-none disabled:opacity-40"
              >
                <ImageIcon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                Update Thumbnail
              </Button>
            )}
            <IconMenu
              open={headerMenuOpen}
              onOpenChange={setHeaderMenuOpen}
              triggerIcon={<Menu className="h-5 w-5 shrink-0" />}
              triggerTitle="Open model preview menu (mode, close)"
              items={previewHeaderMenuItems}
            />
          </div>
        </div>

        <div className="p-4 flex-1 min-h-0 relative flex flex-col">
          {/* Canvas: full area (viewer) or centered square (thumbnail renderer) */}
          <div
            className={
              previewUIMode === 'thumbnail'
                ? 'absolute inset-0 flex items-center justify-center min-h-0 p-2'
                : 'absolute inset-0 min-h-0'
            }
          >
            <div
              ref={containerRef}
              className={
                previewUIMode === 'thumbnail'
                  ? 'min-h-0 min-w-0 shrink-0 rounded-md bg-gray-900/30 border border-border overflow-hidden shadow-inner'
                  : 'absolute inset-0 rounded-md bg-gray-900/30 border border-border overflow-hidden'
              }
            >
            {viewStatus.status !== 'ready' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-sm text-gray-300">
                    {viewStatus.status === 'loading'
                      ? viewStatus.message ?? 'Loading...'
                      : viewStatus.message}
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Left panel - overlays on left */}
          <div
            className={`absolute left-0 top-0 bottom-0 z-10 ${
              leftPanelOpen ? 'w-[340px]' : 'w-0'
            }`}
          >
            <CollapsiblePanelCard
              title="Settings"
              open={leftPanelOpen}
              onToggle={() => setLeftPanelOpen((v) => !v)}
              side="left"
            >
              <ModelPreviewSettingsCards
                panelId="model-preview-settings"
                envPresetIndex={envPresetIndex}
                envIntensity={envIntensity}
                envEnableHDRI={envEnableHDRI}
                envEnablePBR={envEnablePBR}
                solidBackgroundColor={solidBackgroundColor}
                onEnvPresetIndexChange={setEnvPresetIndex}
                onEnvIntensityChange={setEnvIntensity}
                onEnvEnableHDRIChange={setEnvEnableHDRI}
                onEnvEnablePBRChange={setEnvEnablePBR}
                onSolidBackgroundColorChange={setSolidBackgroundColor}
                previewFov={previewFov}
                previewFovSource={previewFovSource}
                onPreviewFovChange={(v) => {
                  savedFovRef.current = v;
                  setPreviewFov(v);
                  setPreviewFovSource('saved');
                }}
                onPreviewFovSourceChange={(value) => {
                  if (value === 'model') {
                    setPreviewFov(modelFovRef.current);
                  } else if (value === 'saved') {
                    setPreviewFov(savedFovRef.current);
                  }
                  setPreviewFovSource(value);
                }}
                clickTargetMode={clickTargetMode}
                onClickTargetModeChange={setClickTargetMode}
                pivotRetargetDurationMs={pivotRetargetDurationMs}
                onPivotRetargetDurationMsChange={setPivotRetargetDurationMs}
                hasAnimations={hasAnimations}
                animationClipNames={animationClipNames}
                animationClipDurations={animationClipDurations}
                currentAnimationClipIndex={currentAnimationClipIndex}
                isAnimationPlaying={isAnimationPlaying}
                animationBlendMode={animationBlendMode}
                animationClipWeights={animationClipWeights}
                animationClipSpeeds={animationClipSpeeds}
                animationClipLoops={animationClipLoops}
                animationCrossfadeDuration={animationCrossfadeDuration}
                animationScrubTime={animationScrubTime}
                animationClipScrubTimes={animationClipScrubTimes}
                animationBlendCompactView={animationBlendCompactView}
                animationCallbacks={animationCallbacks}
              />
            </CollapsiblePanelCard>
          </div>

          {/* Right panel - overlays on right */}
          <div
            className={`absolute right-0 top-0 bottom-0 z-10 ${
              rightPanelOpen ? 'w-[360px]' : 'w-0'
            }`}
          >
            <CollapsiblePanelCard
              title="Debug"
              open={rightPanelOpen}
              onToggle={() => setRightPanelOpen((v) => !v)}
              side="right"
            >
              <PreviewDebugPanel
                cameraDebug={cameraDebug}
                selectedObjectName={selectedObjectName}
                referenceObjectName={referenceObjectName}
                lastObjectOrigin={lastObjectOrigin}
                lastHitPoint={lastHitPoint}
              />
            </CollapsiblePanelCard>
          </div>
        </div>
      </div>
    </div>
  );
}

