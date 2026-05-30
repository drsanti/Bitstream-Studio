import {
  clampEngineCubemapPresetIndex,
  getEngineEnvironmentCubeMaps,
} from "@/engine-environment/t3dEngineEnvironment";
import {
  Activity,
  Box,
  Building2,
  Check,
  Compass,
  Droplets,
  Globe2,
  Image,
  LayoutGrid,
  Leaf,
  Map,
  MoonStar,
  Package,
  Snowflake,
  Sparkles,
  Trees,
  Waves,
} from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { twMerge } from "tailwind-merge";
import {
  TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME,
  TRN_GLASS_LISTBOX_OPTION_SELECTED_CLASSNAME,
  TRNMenuItemButton,
  TRNMenuPanel,
  TRNMenuSectionTitle,
  TRNToolboxPanel,
} from "@/ui/TRN";
import type { Bmi270WireReceiveDiag } from "../../../state/bitstreamLive.store.js";
import { RenderFpsReporter } from "./RenderFpsReporter.js";
import {
  RotationPreviewScene,
  type RotationPreviewSceneProps,
} from "./RotationPreviewScene.js";
import {
  ROTATION_PREVIEW_CAMERA_POSITION,
  ROTATION_PREVIEW_TONE_MAPPING_EXPOSURE,
} from "./rotationPreviewConstants.js";
import { EulerAnglesWireOverlay } from "./EulerAnglesWireOverlay.js";
import { QuaternionWireOverlay } from "./QuaternionWireOverlay.js";
import { ViewportTelemetryHud } from "./ViewportTelemetryHud.js";
import {
  computeMeshTargetFusionQuat,
  createMeshOrientationScratch,
  wireEulerZyxDegFromHundredths,
  type FusionQuat4,
} from "./orientationPreviewMath.js";
import {
  devViteModelUrlFromCanonicalDedupeKey,
  mergeCatalogModels,
} from "../../../../model-catalog/modelCatalogMerge.js";
import { scanModelCatalogAssets } from "../../../../model-catalog/modelCatalog-asset-scan.js";
import { formatModelDisplayName } from "../../../../model-catalog/formatModelDisplayName.js";
import { resolveDefaultPreviewMeshGlbUrl } from "./resolveWebviewModelAssetUrl.js";
import {
  ROTATION_PREVIEW_SHARED_KEYS,
  persistRotationPreviewBool,
  persistRotationPreviewBodyModelId,
  persistRotationPreviewEnvPresetIndex,
  readRotationPreviewBodyModelId,
  readRotationPreviewEnvPresetIndex,
  readRotationPreviewShowBackgroundTexture,
  cycleRotationPreviewOrientationMappingMode,
  persistRotationPreviewOrientationMappingMode,
  readRotationPreviewOrientationMappingMode,
  readRotationPreviewShowGrid,
  readRotationPreviewSlerpEnabled,
  readRotationPreviewUseCubemapIbl,
} from "./rotationPreviewViewportPersistence.js";
import type { OrientationPreviewMappingMode } from "./orientationPreviewMapping.js";

const ROTATION_PREVIEW_DEFAULT_MODEL_ID = "__rotation_preview_psoc_e84__";

function readStoredPanelBool(storageKey: string, fallback: boolean): boolean {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw === "0") {
      return false;
    }
    if (raw === "1") {
      return true;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

function writeStoredPanelBool(storageKey: string, value: boolean): void {
  try {
    window.localStorage.setItem(storageKey, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function getEnvPresetIconByTitle(title: string) {
  const t = title.trim().toLowerCase();
  if (t.includes("bridge")) {
    return <Building2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />;
  }
  if (t.includes("park")) {
    return <Trees className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />;
  }
  if (t.includes("snow")) {
    return <Snowflake className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />;
  }
  if (t.includes("lawn")) {
    return <Leaf className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />;
  }
  if (t.includes("shore") || t.includes("river")) {
    return <Waves className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />;
  }
  if (t.includes("waterfall")) {
    return <Droplets className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />;
  }
  if (t.includes("footpath") || t.includes("path")) {
    return <Map className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />;
  }
  if (t.includes("night")) {
    return <MoonStar className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />;
  }
  return <Image className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />;
}

export type RotationPreviewViewportProps = {
  scene: RotationPreviewSceneProps;
  wireDiag?: Bmi270WireReceiveDiag | null;
  uiHzFromCounter: number | null;
  /** When true, outer container uses `h-full min-h-0` for flex workspace layout. */
  workspaceChrome?: boolean;
  /** Short label in the stats overlay (e.g. "Quaternion", "Euler"). */
  panelBadge?: string;
  /** Override localStorage key for HUD expand/collapse (defaults from `panelBadge`). */
  telemetryHudStorageKey?: string;
  /**
   * When true, enables the fusion quaternion wire-rate plot in a draggable TRN window
   * (opened via the Activity control).
   */
  quaternionWireOverlay?: boolean;
  /**
   * When true, enables fusion pitch / roll / yaw wire plots in a TRN window (Compass control).
   */
  eulerWireOverlay?: boolean;
};

export function RotationPreviewViewport(props: RotationPreviewViewportProps) {
  const {
    scene,
    wireDiag,
    uiHzFromCounter,
    workspaceChrome = false,
    panelBadge,
    telemetryHudStorageKey,
    quaternionWireOverlay = false,
    eulerWireOverlay = false,
  } = props;
  const [renderFps, setRenderFps] = useState<number | null>(null);
  const viewportBoundsRef = useRef<HTMLDivElement>(null);

  const hudExpandedStorageKey =
    telemetryHudStorageKey ??
    (panelBadge != null && panelBadge.trim().length > 0
      ? `bitstream:viewport-hud:${panelBadge.trim()}`
      : "bitstream:viewport-hud:default");

  const legacyBoolKeys = useMemo(
    () => [hudExpandedStorageKey],
    [hudExpandedStorageKey],
  );

  const [showGrid, setShowGrid] = useState(() =>
    readRotationPreviewShowGrid(hudExpandedStorageKey),
  );
  const [showBackgroundTexture, setShowBackgroundTexture] = useState(() =>
    readRotationPreviewShowBackgroundTexture(hudExpandedStorageKey),
  );
  const [useCubemapIbl, setUseCubemapIbl] = useState(() =>
    readRotationPreviewUseCubemapIbl(hudExpandedStorageKey),
  );
  const [slerpEnabled, setSlerpEnabled] = useState(() =>
    readRotationPreviewSlerpEnabled(hudExpandedStorageKey),
  );
  const [environmentPresetIndex, setEnvironmentPresetIndex] = useState(() =>
    readRotationPreviewEnvPresetIndex(hudExpandedStorageKey),
  );
  const [orientationMappingMode, setOrientationMappingMode] =
    useState<OrientationPreviewMappingMode>(() =>
      readRotationPreviewOrientationMappingMode(hudExpandedStorageKey),
    );

  const cycleOrientationMappingMode = useCallback(() => {
    setOrientationMappingMode((prev) => {
      const next = cycleRotationPreviewOrientationMappingMode(prev);
      persistRotationPreviewOrientationMappingMode(next, hudExpandedStorageKey);
      return next;
    });
  }, [hudExpandedStorageKey]);

  useEffect(() => {
    persistRotationPreviewBool(
      ROTATION_PREVIEW_SHARED_KEYS.showGrid,
      showGrid,
      legacyBoolKeys.map((k) => `${k}:show-grid`),
    );
  }, [legacyBoolKeys, showGrid]);

  useEffect(() => {
    persistRotationPreviewBool(
      ROTATION_PREVIEW_SHARED_KEYS.showBackgroundTexture,
      showBackgroundTexture,
      legacyBoolKeys.map((k) => `${k}:show-background-texture`),
    );
  }, [legacyBoolKeys, showBackgroundTexture]);

  useEffect(() => {
    persistRotationPreviewBool(
      ROTATION_PREVIEW_SHARED_KEYS.cubemapIbl,
      useCubemapIbl,
      legacyBoolKeys.map((k) => `${k}:cubemap-ibl`),
    );
  }, [legacyBoolKeys, useCubemapIbl]);

  useEffect(() => {
    persistRotationPreviewBool(
      ROTATION_PREVIEW_SHARED_KEYS.slerpEnabled,
      slerpEnabled,
      legacyBoolKeys.map((k) => `${k}:slerp-enabled`),
    );
  }, [legacyBoolKeys, slerpEnabled]);

  useEffect(() => {
    persistRotationPreviewEnvPresetIndex(environmentPresetIndex, hudExpandedStorageKey);
  }, [environmentPresetIndex, hudExpandedStorageKey]);

  const [envMenuOpen, setEnvMenuOpen] = useState(false);
  const envMenuRef = useRef<HTMLDivElement>(null);

  const catalogModels = useMemo(
    () =>
      [...mergeCatalogModels(scanModelCatalogAssets(), [])].sort((a, b) =>
        formatModelDisplayName(a.name).localeCompare(formatModelDisplayName(b.name)),
      ),
    [],
  );

  const [previewBodyModelId, setPreviewBodyModelId] = useState<string>(() =>
    readRotationPreviewBodyModelId(
      hudExpandedStorageKey,
      ROTATION_PREVIEW_DEFAULT_MODEL_ID,
    ),
  );

  useEffect(() => {
    persistRotationPreviewBodyModelId(previewBodyModelId, hudExpandedStorageKey);
  }, [previewBodyModelId, hudExpandedStorageKey]);

  const previewMeshGlbUrl = useMemo(() => {
    if (previewBodyModelId === ROTATION_PREVIEW_DEFAULT_MODEL_ID) {
      return resolveDefaultPreviewMeshGlbUrl();
    }
    const entry = catalogModels.find((m) => m.id === previewBodyModelId);
    if (entry == null) {
      return resolveDefaultPreviewMeshGlbUrl();
    }
    const devFresh = devViteModelUrlFromCanonicalDedupeKey(entry.dedupeKey);
    if (devFresh != null && devFresh.length > 0) {
      return devFresh;
    }
    return entry.url ?? resolveDefaultPreviewMeshGlbUrl();
  }, [catalogModels, previewBodyModelId]);

  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modelMenuOpen) {
      return;
    }
    const onDown = (e: MouseEvent) => {
      if (
        modelMenuRef.current != null &&
        !modelMenuRef.current.contains(e.target as Node)
      ) {
        setModelMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModelMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [modelMenuOpen]);

  useEffect(() => {
    if (!envMenuOpen) {
      return;
    }
    const onDown = (e: MouseEvent) => {
      if (
        envMenuRef.current != null &&
        !envMenuRef.current.contains(e.target as Node)
      ) {
        setEnvMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEnvMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [envMenuOpen]);

  const quatWireWindowOpenStorageKey = `${hudExpandedStorageKey}:quat-wire-window-open`;

  const [quatWireWindowOpen, setQuatWireWindowOpen] = useState(() =>
    readStoredPanelBool(quatWireWindowOpenStorageKey, false),
  );

  useEffect(() => {
    writeStoredPanelBool(quatWireWindowOpenStorageKey, quatWireWindowOpen);
  }, [quatWireWindowOpenStorageKey, quatWireWindowOpen]);

  const closeQuatWireWindow = useCallback(() => {
    setQuatWireWindowOpen(false);
  }, []);

  const eulerWireWindowOpenStorageKey = `${hudExpandedStorageKey}:euler-wire-window-open`;

  const [eulerWireWindowOpen, setEulerWireWindowOpen] = useState(() =>
    readStoredPanelBool(eulerWireWindowOpenStorageKey, false),
  );

  useEffect(() => {
    writeStoredPanelBool(eulerWireWindowOpenStorageKey, eulerWireWindowOpen);
  }, [eulerWireWindowOpenStorageKey, eulerWireWindowOpen]);

  const closeEulerWireWindow = useCallback(() => {
    setEulerWireWindowOpen(false);
  }, []);

  const quatWireWindowTitle =
    panelBadge != null && panelBadge.trim().length > 0
      ? "Quaternion Plots"
      : "Quaternion Plots";

  const eulerWireWindowTitle =
    panelBadge != null && panelBadge.trim().length > 0
      ? panelBadge.trim()
      : "Euler Plot";

  const containerClass = workspaceChrome
    ? "relative flex h-full min-h-0 min-w-0 flex-1 overflow-hidden rounded-md border border-zinc-800/80 bg-zinc-950"
    : "relative flex min-h-[200px] flex-1 overflow-hidden rounded-md border border-zinc-800/80 bg-zinc-950";

  const meshOrientationScratch = useMemo(() => createMeshOrientationScratch(), []);

  const wireFusionQuat = useMemo((): FusionQuat4 | null => {
    const { qw, qx, qy, qz, eulerOnly } = scene;
    if (eulerOnly === true)
    {
      return null;
    }
    if (
      !Number.isFinite(qw) ||
      !Number.isFinite(qx) ||
      !Number.isFinite(qy) ||
      !Number.isFinite(qz)
    )
    {
      return null;
    }
    return { qw, qx, qy, qz };
  }, [scene.qw, scene.qx, scene.qy, scene.qz, scene.eulerOnly]);

  const meshTargetQuat = useMemo(
    () =>
      computeMeshTargetFusionQuat(
        {
          qw: scene.qw,
          qx: scene.qx,
          qy: scene.qy,
          qz: scene.qz,
          fusionEulerHundredths: scene.fusionEulerHundredths,
          meshOrientationFromEulerFallback: scene.meshOrientationFromEulerFallback,
          eulerOnly: scene.eulerOnly ?? false,
          orientationMappingMode,
        },
        meshOrientationScratch,
      ),
    [
      scene.qw,
      scene.qx,
      scene.qy,
      scene.qz,
      scene.fusionEulerHundredths,
      scene.meshOrientationFromEulerFallback,
      scene.eulerOnly,
      orientationMappingMode,
      meshOrientationScratch,
    ],
  );

  const wireEulerDeg = useMemo(() => {
    if (scene.fusionEulerHundredths == null)
    {
      return null;
    }
    return wireEulerZyxDegFromHundredths(scene.fusionEulerHundredths);
  }, [scene.fusionEulerHundredths]);

  return (
    <div ref={viewportBoundsRef} className={containerClass}>
      <Canvas
        className="h-full w-full"
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
        camera={{
          position: [...ROTATION_PREVIEW_CAMERA_POSITION],
          fov: 55,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = ROTATION_PREVIEW_TONE_MAPPING_EXPOSURE;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <Suspense fallback={null}>
          <RotationPreviewScene
            {...scene}
            previewMeshGlbUrl={previewMeshGlbUrl}
            showGrid={showGrid}
            showBackgroundTexture={showBackgroundTexture}
            useCubemapIbl={useCubemapIbl}
            environmentPresetIndex={environmentPresetIndex}
            orientationMappingMode={orientationMappingMode}
            orientationSlerpEnabled={slerpEnabled}
          />
          <RenderFpsReporter onFps={setRenderFps} />
        </Suspense>
      </Canvas>
      <div className="pointer-events-auto absolute right-2 top-2 z-10 flex flex-row-reverse items-center gap-1">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-600/70 bg-black/55 text-zinc-300 shadow-sm backdrop-blur-sm hover:bg-zinc-800/75 hover:text-zinc-100"
          aria-label={slerpEnabled ? "Disable orientation smoothing" : "Enable orientation smoothing"}
          aria-pressed={slerpEnabled}
          title={
            slerpEnabled
              ? "Orientation smoothing: on (slerp). Click to disable."
              : "Orientation smoothing: off. Click to enable slerp."
          }
          onClick={() => {
            setSlerpEnabled((v) => !v);
          }}
        >
          <Waves
            className={`h-4 w-4 ${slerpEnabled ? "" : "opacity-40"}`}
            strokeWidth={2}
            aria-hidden
          />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-600/70 bg-black/55 text-zinc-300 shadow-sm backdrop-blur-sm hover:bg-zinc-800/75 hover:text-zinc-100"
          aria-label={showGrid ? "Hide ground grid" : "Show ground grid"}
          aria-pressed={showGrid}
          title={showGrid ? "Hide grid" : "Show grid"}
          onClick={() => {
            setShowGrid((v) => !v);
          }}
        >
          <LayoutGrid
            className={`h-4 w-4 ${showGrid ? "" : "opacity-40"}`}
            strokeWidth={2}
            aria-hidden
          />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-600/70 bg-black/55 text-zinc-300 shadow-sm backdrop-blur-sm hover:bg-zinc-800/75 hover:text-zinc-100"
          aria-label={
            showBackgroundTexture
              ? "Hide cubemap background"
              : "Show cubemap background"
          }
          aria-pressed={showBackgroundTexture}
          title={
            showBackgroundTexture
              ? "Hide cubemap background (solid color)"
              : "Show cubemap background"
          }
          onClick={() => {
            setShowBackgroundTexture((v) => !v);
          }}
        >
          <Image
            className={`h-4 w-4 ${showBackgroundTexture ? "" : "opacity-40"}`}
            strokeWidth={2}
            aria-hidden
          />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-600/70 bg-black/55 text-zinc-300 shadow-sm backdrop-blur-sm hover:bg-zinc-800/75 hover:text-zinc-100"
          aria-label={
            useCubemapIbl
              ? "Switch to reduced environment intensity"
              : "Switch to full environment intensity"
          }
          aria-pressed={useCubemapIbl}
          title={
            useCubemapIbl
              ? "Full IBL: click for reduced strength (environment map always on for PBR)"
              : "Reduced IBL: click for full strength. Environment map always on so metal is not black."
          }
          onClick={() => {
            setUseCubemapIbl((v) => !v);
          }}
        >
          <Sparkles
            className={`h-4 w-4 ${useCubemapIbl ? "" : "opacity-40"}`}
            strokeWidth={2}
            aria-hidden
          />
        </button>
        <div className="relative" ref={modelMenuRef}>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-600/70 bg-black/55 text-zinc-300 shadow-sm backdrop-blur-sm hover:bg-zinc-800/75 hover:text-zinc-100"
            aria-label="Preview body model"
            aria-haspopup="listbox"
            aria-expanded={modelMenuOpen}
            title="Choose GLB for orientation body mesh"
            onClick={() => {
              setModelMenuOpen((o) => !o);
            }}
          >
            <Package className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
          {modelMenuOpen ? (
            <TRNMenuPanel
              tone="glass-dropdown"
              className="absolute right-0 top-full z-30 mt-1 w-auto min-w-52 max-h-[min(320px,50vh)] overflow-y-auto scrollbar-hide"
            >
              <div className="flex flex-col gap-1">
                <TRNMenuSectionTitle id="rotation-preview-body-model-heading" spacing="menuFirst">
                  Body model
                </TRNMenuSectionTitle>
                <div
                  className="flex flex-col gap-1"
                  role="listbox"
                  aria-label="Preview body models"
                  aria-labelledby="rotation-preview-body-model-heading"
                >
                <TRNMenuItemButton
                  tone="glass-dropdown"
                  role="option"
                  aria-selected={previewBodyModelId === ROTATION_PREVIEW_DEFAULT_MODEL_ID}
                  icon={<Box className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />}
                  label="PSoC E84 AI (default)"
                  className={twMerge(
                    TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME,
                    "text-xs font-medium",
                    previewBodyModelId === ROTATION_PREVIEW_DEFAULT_MODEL_ID
                      ? TRN_GLASS_LISTBOX_OPTION_SELECTED_CLASSNAME
                      : null,
                  )}
                  rightSlot={
                    previewBodyModelId === ROTATION_PREVIEW_DEFAULT_MODEL_ID ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" strokeWidth={2.5} aria-hidden />
                    ) : null
                  }
                  onClick={() => {
                    setPreviewBodyModelId(ROTATION_PREVIEW_DEFAULT_MODEL_ID);
                    setModelMenuOpen(false);
                  }}
                />
                {catalogModels.map((m) => {
                  const selected = previewBodyModelId === m.id;
                  return (
                    <TRNMenuItemButton
                      key={m.id}
                      tone="glass-dropdown"
                      role="option"
                      aria-selected={selected}
                      icon={<Package className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />}
                      label={formatModelDisplayName(m.name)}
                      title={m.dedupeKey}
                      className={twMerge(
                        TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME,
                        "text-xs font-medium",
                        selected ? TRN_GLASS_LISTBOX_OPTION_SELECTED_CLASSNAME : null,
                      )}
                      rightSlot={
                        selected ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" strokeWidth={2.5} aria-hidden />
                        ) : null
                      }
                      onClick={() => {
                        setPreviewBodyModelId(m.id);
                        setModelMenuOpen(false);
                      }}
                    />
                  );
                })}
                </div>
              </div>
            </TRNMenuPanel>
          ) : null}
        </div>
        <div className="relative" ref={envMenuRef}>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-600/70 bg-black/55 text-zinc-300 shadow-sm backdrop-blur-sm hover:bg-zinc-800/75 hover:text-zinc-100"
            aria-label="Environment cubemap"
            aria-haspopup="listbox"
            aria-expanded={envMenuOpen}
            title="Choose environment (cubemap)"
            onClick={() => {
              setEnvMenuOpen((o) => !o);
            }}
          >
            <Globe2 className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
          {envMenuOpen ? (
            <TRNMenuPanel
              tone="glass-dropdown"
              className="absolute right-0 top-full z-30 mt-1 w-auto min-w-44 max-h-[min(320px,50vh)] overflow-y-auto scrollbar-hide"
            >
              <div className="flex flex-col gap-1">
                <TRNMenuSectionTitle id="rotation-preview-cubemap-heading" spacing="menuFirst">
                  Cubemap preset
                </TRNMenuSectionTitle>
                <div
                  className="flex flex-col gap-1"
                  role="listbox"
                  aria-label="Cubemap environment presets"
                  aria-labelledby="rotation-preview-cubemap-heading"
                >
                {getEngineEnvironmentCubeMaps().map((preset, index) => {
                  const selected = environmentPresetIndex === index;
                  return (
                    <TRNMenuItemButton
                      key={preset.path}
                      tone="glass-dropdown"
                      role="option"
                      aria-selected={selected}
                      icon={getEnvPresetIconByTitle(preset.title)}
                      label={preset.title}
                      className={twMerge(
                        TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME,
                        "text-xs font-medium",
                        selected ? TRN_GLASS_LISTBOX_OPTION_SELECTED_CLASSNAME : null,
                      )}
                      rightSlot={
                        selected ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" strokeWidth={2.5} aria-hidden />
                        ) : null
                      }
                      onClick={() => {
                        setEnvironmentPresetIndex(
                          clampEngineCubemapPresetIndex(index),
                        );
                        setEnvMenuOpen(false);
                      }}
                    />
                  );
                })}
                </div>
              </div>
            </TRNMenuPanel>
          ) : null}
        </div>
        {eulerWireOverlay ? (
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-600/70 bg-black/55 text-zinc-300 shadow-sm backdrop-blur-sm hover:bg-zinc-800/75 hover:text-zinc-100"
            aria-label={
              eulerWireWindowOpen
                ? "Close Euler angles wire window"
                : "Open Euler angles wire window"
            }
            aria-pressed={eulerWireWindowOpen}
            title={
              eulerWireWindowOpen
                ? "Close pitch / roll / yaw wire plot window"
                : "Open pitch / roll / yaw wire plot in a movable window"
            }
            onClick={() => {
              setEulerWireWindowOpen((v) => !v);
            }}
          >
            <Compass
              className={`h-4 w-4 ${eulerWireWindowOpen ? "" : "opacity-40"}`}
              strokeWidth={2}
              aria-hidden
            />
          </button>
        ) : null}
        {quaternionWireOverlay ? (
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-600/70 bg-black/55 text-zinc-300 shadow-sm backdrop-blur-sm hover:bg-zinc-800/75 hover:text-zinc-100"
            aria-label={
              quatWireWindowOpen
                ? "Close quaternion wire window"
                : "Open quaternion wire window"
            }
            aria-pressed={quatWireWindowOpen}
            title={
              quatWireWindowOpen
                ? "Close qx–qw wire plot window"
                : "Open qx–qw wire plot in a movable window"
            }
            onClick={() => {
              setQuatWireWindowOpen((v) => !v);
            }}
          >
            <Activity
              className={`h-4 w-4 ${quatWireWindowOpen ? "" : "opacity-40"}`}
              strokeWidth={2}
              aria-hidden
            />
          </button>
        ) : null}
      </div>
      {quaternionWireOverlay ? (
        <TRNToolboxPanel
          open={quatWireWindowOpen}
          onClose={closeQuatWireWindow}
          title={quatWireWindowTitle}
          prefixIcon={
            <Activity className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
          }
          boundsRef={viewportBoundsRef}
          draggable
          resizable
          modal={false}
          heightMode="fixed"
          minWidth={200}
          minHeight={150}
          initialRect={{
            x: 16,
            y: 64,
            width: 560,
            height: 600,
          }}
          persistRectStorageKey={`${hudExpandedStorageKey}:quat-wire-trn-window`}
          zIndex={42}
          reopenStrategy="normalize"
          glass
          glassPreset="toolbox"
          glassBorderOpacity={0.7}
          showFooter={false}
          className="border"
          contentClassName="scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-0! bg-transparent! p-0!"
        >
          <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
            <QuaternionWireOverlay layout="windowFill" />
          </div>
        </TRNToolboxPanel>
      ) : null}
      {eulerWireOverlay ? (
        <TRNToolboxPanel
          open={eulerWireWindowOpen}
          onClose={closeEulerWireWindow}
          title={eulerWireWindowTitle}
          prefixIcon={
            <Compass className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
          }
          boundsRef={viewportBoundsRef}
          draggable
          resizable
          modal={false}
          heightMode="fixed"
          minWidth={200}
          minHeight={150}
          initialRect={{
            x: 28,
            y: 96,
            width: 520,
            height: 520,
          }}
          persistRectStorageKey={`${hudExpandedStorageKey}:euler-wire-trn-window`}
          zIndex={43}
          reopenStrategy="normalize"
          glass
          glassPreset="toolbox"
          glassBorderOpacity={0.7}
          showFooter={false}
          className="border"
          contentClassName="scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-0! bg-transparent! p-0!"
        >
          <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
            <EulerAnglesWireOverlay layout="windowFill" />
          </div>
        </TRNToolboxPanel>
      ) : null}
      <ViewportTelemetryHud
        positionBoundsRef={viewportBoundsRef}
        persistRectStorageKey={`${hudExpandedStorageKey}:trn-window`}
        panelBadge={panelBadge}
        wireHzFromGaps={
          wireDiag?.wireHzFromGaps != null &&
          Number.isFinite(wireDiag.wireHzFromGaps)
            ? wireDiag.wireHzFromGaps
            : null
        }
        jitterStdMs={
          wireDiag?.jitterStdMs != null &&
          Number.isFinite(wireDiag.jitterStdMs)
            ? wireDiag.jitterStdMs
            : null
        }
        samplesCoalescedLastFlush={wireDiag?.samplesCoalescedLastFlush}
        uiHzFromCounter={uiHzFromCounter}
        renderFps={renderFps}
        wireFusionQuat={wireFusionQuat}
        meshTargetQuat={meshTargetQuat}
        wireEulerDeg={wireEulerDeg}
        orientationMappingMode={orientationMappingMode}
        onCycleOrientationMappingMode={cycleOrientationMappingMode}
      />
    </div>
  );
}
