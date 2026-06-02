import { Box, Check, Filter, Globe2, LayoutGrid, Package, Tags } from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { twMerge } from "tailwind-merge";
import {
  clampEngineCubemapPresetIndex,
  getEngineEnvironmentCubeMaps,
} from "@/engine-environment/t3dEngineEnvironment";
import {
  TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME,
  TRN_GLASS_LISTBOX_OPTION_SELECTED_CLASSNAME,
  TRNMenuItemButton,
  TRNMenuPanel,
  TRNMenuSectionTitle,
} from "@/ui/TRN";
import { useAssetRegistry } from "../../../assets-manager/registry/AssetRegistryProvider.js";
import { formatModelDisplayName } from "../../../model-catalog/formatModelDisplayName.js";
import { resolveDefaultPreviewMeshGlbUrl } from "../3d-rotation/shared/resolveWebviewModelAssetUrl.js";
import {
  readRotationPreviewEnvPresetIndex,
  readRotationPreviewUseCubemapIbl,
  persistRotationPreviewEnvPresetIndex,
} from "../3d-rotation/shared/rotationPreviewViewportPersistence.js";
import { getEnvPresetIconByTitle } from "../3d-rotation/shared/rotationPreviewEnvPresetIcon.js";
import {
  ANIMATION_LAB_DEFAULT_MODEL_ID,
  ANIMATION_LAB_OPEN_MODEL_EVENT,
  ANIMATION_LAB_STORAGE_PREFIX,
} from "./animation-lab-constants.js";
import {
  hasAnimationLabTwinTagFilterPreference,
  persistAnimationLabModelId,
  persistAnimationLabShowGrid,
  persistAnimationLabTwinTagFilterMode,
  readAnimationLabModelId,
  readAnimationLabShowGrid,
  readAnimationLabTwinTagFilterMode,
} from "./animation-lab-persistence.js";
import {
  ANIMATION_LAB_TWIN_TAG_FILTER_MENU_OPTIONS,
  twinTagFilterModeIsVisible,
  twinTagFilterToolbarAccentClass,
  type AnimationLabTwinTagFilterMode,
  type AnimationLabTwinTagFilterModeVisible,
} from "./animation-lab-twin-tag-filter.js";
import { GlbAnimationLabProvider } from "./glb-animation-lab-context.js";
import { GlbAnimationLabTwinProvider, useGlbAnimationLabTwin } from "./glb-animation-lab-twin-context.js";
import { ANIMATION_LAB_CAMERA_POSITION, GlbAnimationLabScene } from "./GlbAnimationLabScene.js";
import { GlbLoadErrorBoundary } from "../3d-rotation/shared/GlbLoadErrorBoundary.js";
import {
  notifyMissingGlbPreviewAsset,
  notifyWebGlContextLost,
} from "../../utils/notifyMissingFreePackAsset.js";
import { GlbAnimationLabInspector } from "./GlbAnimationLabInspector.js";
import { AnimationLabCss3dOverlay } from "./css3d/AnimationLabCss3dOverlay.js";
import { AnimationLabCss3dTagsRegistrar } from "./css3d/AnimationLabCss3dTagsRegistrar.js";
import { resolveAnimationLabMeshFetchUrl } from "./resolve-animation-lab-mesh-fetch-url.js";
import {
  ROTATION_PREVIEW_DEFAULT_USE_CUBEMAP_IBL,
  ROTATION_PREVIEW_TONE_MAPPING_EXPOSURE,
} from "../3d-rotation/shared/rotationPreviewConstants.js";

const HUD_STORAGE_KEY = `${ANIMATION_LAB_STORAGE_PREFIX}:viewport`;
/** Animation Lab env menu always drives the visible skybox (not the rotation preview Image toggle). */
const ANIMATION_LAB_SHOW_ENV_BACKGROUND = true;
/** When twin has this many subsystems, default 3D tags to issues filter (unless user saved a preference). */
const TWIN_TAGS_ISSUES_DEFAULT_MIN_COMPONENTS = 6;

function resolveInitialTwinTagFilterMode(): AnimationLabTwinTagFilterMode {
  return readAnimationLabTwinTagFilterMode() ?? "all";
}

function resolveInitialLastVisibleTwinTagFilterMode(): AnimationLabTwinTagFilterModeVisible {
  const saved = resolveInitialTwinTagFilterMode();
  return saved !== "hidden" ? saved : "all";
}

function AnimationLabViewportToolbar(props: {
  showGrid: boolean;
  onToggleGrid: () => void;
  twinTagFilterMode: AnimationLabTwinTagFilterMode;
  onToggleTwinTagsQuick: () => void;
  onSelectTwinTagFilterMode: (mode: AnimationLabTwinTagFilterMode) => void;
  tagFilterMenuOpen: boolean;
  onToggleTagFilterMenu: () => void;
  tagFilterMenuRef: React.RefObject<HTMLDivElement | null>;
  hasTwin: boolean;
  modelMenuOpen: boolean;
  onToggleModelMenu: () => void;
  modelMenuRef: React.RefObject<HTMLDivElement | null>;
  modelId: string;
  onSelectModel: (id: string) => void;
  catalogModels: { id: string; name: string }[];
  envMenuOpen: boolean;
  onToggleEnvMenu: () => void;
  envMenuRef: React.RefObject<HTMLDivElement | null>;
  environmentPresetIndex: number;
  onSelectEnvironmentPreset: (index: number) => void;
}) {
  const {
    showGrid,
    onToggleGrid,
    twinTagFilterMode,
    onToggleTwinTagsQuick,
    onSelectTwinTagFilterMode,
    tagFilterMenuOpen,
    onToggleTagFilterMenu,
    tagFilterMenuRef,
    hasTwin,
    modelMenuOpen,
    onToggleModelMenu,
    modelMenuRef,
    modelId,
    onSelectModel,
    catalogModels,
    envMenuOpen,
    onToggleEnvMenu,
    envMenuRef,
    environmentPresetIndex,
    onSelectEnvironmentPreset,
  } = props;

  const twinTagsVisible = twinTagFilterModeIsVisible(twinTagFilterMode);

  return (
    <div className="pointer-events-auto absolute right-2 top-2 z-20 flex flex-row-reverse gap-1">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-600/70 bg-black/55 text-zinc-300 shadow-sm backdrop-blur-sm hover:bg-zinc-800/75"
        aria-label={showGrid ? "Hide grid" : "Show grid"}
        aria-pressed={showGrid}
        onClick={onToggleGrid}
      >
        <LayoutGrid className={`h-4 w-4 ${showGrid ? "" : "opacity-40"}`} aria-hidden />
      </button>
      {hasTwin ? (
        <>
          <div className="relative" ref={tagFilterMenuRef}>
            <button
              type="button"
              className={twMerge(
                "flex h-8 w-8 items-center justify-center rounded-md border border-zinc-600/70 bg-black/55 text-zinc-300 shadow-sm backdrop-blur-sm hover:bg-zinc-800/75",
                tagFilterMenuOpen && "border-sky-500/45 text-sky-100",
                twinTagFilterToolbarAccentClass(twinTagFilterMode),
              )}
              aria-label="Tag visibility filter"
              aria-haspopup="listbox"
              aria-expanded={tagFilterMenuOpen}
              onClick={onToggleTagFilterMenu}
            >
              <Filter className="h-4 w-4" strokeWidth={2} aria-hidden />
            </button>
            {tagFilterMenuOpen ? (
              <TRNMenuPanel
                tone="glass-dropdown"
                className="absolute right-0 top-full z-30 mt-1 w-auto min-w-56 overflow-y-auto scrollbar-hide"
              >
                <TRNMenuSectionTitle spacing="menuFirst">Tag visibility</TRNMenuSectionTitle>
                <div className="flex flex-col gap-1" role="listbox" aria-label="Tag visibility filter">
                  {ANIMATION_LAB_TWIN_TAG_FILTER_MENU_OPTIONS.map((option) => {
                    const selected = twinTagFilterMode === option.value;
                    return (
                      <TRNMenuItemButton
                        key={option.value}
                        tone="glass-dropdown"
                        role="option"
                        aria-selected={selected}
                        className={twMerge(
                          TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME,
                          selected ? TRN_GLASS_LISTBOX_OPTION_SELECTED_CLASSNAME : null,
                        )}
                        label={
                          <span className="flex min-w-0 flex-col gap-0.5">
                            <span className="truncate text-xs font-medium">{option.label}</span>
                            <span className="truncate text-[10px] font-normal leading-snug text-zinc-400">
                              {option.hint}
                            </span>
                          </span>
                        }
                        rightSlot={
                          selected ? (
                            <Check
                              className="h-3.5 w-3.5 shrink-0 text-emerald-300"
                              strokeWidth={2.5}
                              aria-hidden
                            />
                          ) : null
                        }
                        onClick={() => onSelectTwinTagFilterMode(option.value)}
                      />
                    );
                  })}
                </div>
              </TRNMenuPanel>
            ) : null}
          </div>
          <button
            type="button"
            className={twMerge(
              "flex h-8 w-8 items-center justify-center rounded-md border border-zinc-600/70 bg-black/55 text-zinc-300 shadow-sm backdrop-blur-sm hover:bg-zinc-800/75",
              twinTagsVisible && "border-cyan-500/50 text-cyan-200",
            )}
            aria-label={twinTagsVisible ? "Hide twin tags in 3D" : "Show twin tags in 3D"}
            aria-pressed={twinTagsVisible}
            onClick={onToggleTwinTagsQuick}
          >
            <Tags className="h-4 w-4" aria-hidden />
          </button>
        </>
      ) : null}
      <div className="relative" ref={modelMenuRef}>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-600/70 bg-black/55 text-zinc-300 shadow-sm backdrop-blur-sm hover:bg-zinc-800/75"
          aria-label="Body model"
          aria-expanded={modelMenuOpen}
          onClick={onToggleModelMenu}
        >
          <Package className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
        {modelMenuOpen ? (
          <TRNMenuPanel
            tone="glass-dropdown"
            className="absolute right-0 top-full z-30 mt-1 max-h-[min(320px,50vh)] w-auto min-w-52 overflow-y-auto scrollbar-hide"
          >
            <TRNMenuSectionTitle spacing="menuFirst">Body model</TRNMenuSectionTitle>
            <div className="flex flex-col gap-1" role="listbox">
              <TRNMenuItemButton
                tone="glass-dropdown"
                role="option"
                icon={<Box className="h-3.5 w-3.5" aria-hidden />}
                label="PSoC E84 AI (default)"
                className={twMerge(
                  TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME,
                  modelId === ANIMATION_LAB_DEFAULT_MODEL_ID
                    ? TRN_GLASS_LISTBOX_OPTION_SELECTED_CLASSNAME
                    : null,
                )}
                onClick={() => onSelectModel(ANIMATION_LAB_DEFAULT_MODEL_ID)}
              />
              {catalogModels.map((m) => (
                <TRNMenuItemButton
                  key={m.id}
                  tone="glass-dropdown"
                  role="option"
                  icon={<Package className="h-3.5 w-3.5 opacity-90" aria-hidden />}
                  label={formatModelDisplayName(m.name)}
                  className={twMerge(
                    TRN_GLASS_LISTBOX_OPTION_ROW_COMPACT_CLASSNAME,
                    modelId === m.id ? TRN_GLASS_LISTBOX_OPTION_SELECTED_CLASSNAME : null,
                  )}
                  onClick={() => onSelectModel(m.id)}
                />
              ))}
            </div>
          </TRNMenuPanel>
        ) : null}
      </div>
      <div className="relative" ref={envMenuRef}>
        <button
          type="button"
          className={twMerge(
            "flex h-8 w-8 items-center justify-center rounded-md border border-zinc-600/70 bg-black/55 text-zinc-300 shadow-sm backdrop-blur-sm hover:bg-zinc-800/75",
            envMenuOpen && "border-sky-500/45 text-sky-100",
          )}
          aria-label="Environment map"
          aria-haspopup="listbox"
          aria-expanded={envMenuOpen}
          onClick={onToggleEnvMenu}
        >
          <Globe2 className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
        {envMenuOpen ? (
          <TRNMenuPanel
            tone="glass-dropdown"
            className="absolute right-0 top-full z-30 mt-1 max-h-[min(320px,50vh)] w-auto min-w-44 overflow-y-auto scrollbar-hide"
          >
            <TRNMenuSectionTitle spacing="menuFirst">Environment map</TRNMenuSectionTitle>
            <div className="flex flex-col gap-1" role="listbox" aria-label="Environment map presets">
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
                    onClick={() => onSelectEnvironmentPreset(index)}
                  />
                );
              })}
            </div>
          </TRNMenuPanel>
        ) : null}
      </div>
    </div>
  );
}

function GlbAnimationLabViewportInner(props: {
  fetchUrl: string;
  showGrid: boolean;
  setShowGrid: React.Dispatch<React.SetStateAction<boolean>>;
  useCubemapIbl: boolean;
  environmentPresetIndex: number;
  setEnvironmentPresetIndex: React.Dispatch<React.SetStateAction<number>>;
  modelMenuOpen: boolean;
  setModelMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  modelMenuRef: React.RefObject<HTMLDivElement | null>;
  modelId: string;
  setModelId: (id: string) => void;
  catalogModels: { id: string; name: string }[];
  twinTagFilterMode: AnimationLabTwinTagFilterMode;
  onTwinTagFilterModeChange: (mode: AnimationLabTwinTagFilterMode) => void;
  onToggleTwinTagsQuick: () => void;
  tagFilterMenuOpen: boolean;
  setTagFilterMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  tagFilterMenuRef: React.RefObject<HTMLDivElement | null>;
  envMenuOpen: boolean;
  setEnvMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  envMenuRef: React.RefObject<HTMLDivElement | null>;
}) {
  const twinCtx = useGlbAnimationLabTwin();
  const hasTwin = twinCtx?.twin != null;
  const tagsActive = hasTwin && twinTagFilterModeIsVisible(props.twinTagFilterMode);

  useEffect(() => {
    if (hasAnimationLabTwinTagFilterPreference()) {
      return;
    }
    const count = twinCtx?.components.length ?? 0;
    if (count >= TWIN_TAGS_ISSUES_DEFAULT_MIN_COMPONENTS) {
      props.onTwinTagFilterModeChange("issues");
    }
  }, [twinCtx?.components.length, props.onTwinTagFilterModeChange]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden rounded-md border border-zinc-800/80 bg-zinc-950">
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <Canvas
          className="h-full w-full"
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 1.5]}
          camera={{
            position: [...ANIMATION_LAB_CAMERA_POSITION],
            fov: 55,
          }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = ROTATION_PREVIEW_TONE_MAPPING_EXPOSURE;
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.domElement.addEventListener("webglcontextlost", (event) => {
              event.preventDefault();
              notifyWebGlContextLost();
            });
          }}
        >
          <GlbLoadErrorBoundary
            resetKey={props.fetchUrl}
            shortLabel="Animation Lab model"
            onError={() => {
              notifyMissingGlbPreviewAsset({
                url: props.fetchUrl,
                label: "Animation Lab model",
                dedupeKey: `animation-lab:${props.fetchUrl}`,
              });
            }}
          >
            <Suspense fallback={null}>
              <GlbAnimationLabScene
                fetchUrl={props.fetchUrl}
                showGrid={props.showGrid}
                showBackgroundTexture={ANIMATION_LAB_SHOW_ENV_BACKGROUND}
                useCubemapIbl={props.useCubemapIbl ?? ROTATION_PREVIEW_DEFAULT_USE_CUBEMAP_IBL}
                environmentPresetIndex={props.environmentPresetIndex}
              />
            </Suspense>
          </GlbLoadErrorBoundary>
        </Canvas>
        <AnimationLabCss3dOverlay enabled={tagsActive} />
        <AnimationLabCss3dTagsRegistrar enabled={tagsActive} filterMode={props.twinTagFilterMode} />
        <AnimationLabViewportToolbar
          showGrid={props.showGrid}
          onToggleGrid={() => props.setShowGrid((v) => !v)}
          twinTagFilterMode={props.twinTagFilterMode}
          onToggleTwinTagsQuick={props.onToggleTwinTagsQuick}
          onSelectTwinTagFilterMode={(mode) => {
            props.onTwinTagFilterModeChange(mode);
            props.setTagFilterMenuOpen(false);
          }}
          tagFilterMenuOpen={props.tagFilterMenuOpen}
          onToggleTagFilterMenu={() => props.setTagFilterMenuOpen((o) => !o)}
          tagFilterMenuRef={props.tagFilterMenuRef}
          hasTwin={hasTwin}
          modelMenuOpen={props.modelMenuOpen}
          onToggleModelMenu={() => props.setModelMenuOpen((o) => !o)}
          modelMenuRef={props.modelMenuRef}
          modelId={props.modelId}
          onSelectModel={(id) => {
            props.setModelId(id);
            props.setModelMenuOpen(false);
          }}
          catalogModels={props.catalogModels}
          envMenuOpen={props.envMenuOpen}
          onToggleEnvMenu={() => props.setEnvMenuOpen((o) => !o)}
          envMenuRef={props.envMenuRef}
          environmentPresetIndex={props.environmentPresetIndex}
          onSelectEnvironmentPreset={(index) => {
            props.setEnvironmentPresetIndex(clampEngineCubemapPresetIndex(index));
            props.setEnvMenuOpen(false);
          }}
        />
      </div>
      <GlbAnimationLabInspector />
    </div>
  );
}

export function GlbAnimationLabViewport() {
  const { catalogModelEntries, descriptors } = useAssetRegistry();
  const catalogModels = useMemo(
    () =>
      [...catalogModelEntries].sort((a, b) =>
        formatModelDisplayName(a.name).localeCompare(formatModelDisplayName(b.name)),
      ),
    [catalogModelEntries],
  );

  const [modelId, setModelId] = useState(() => readAnimationLabModelId());
  const [showGrid, setShowGrid] = useState(() => readAnimationLabShowGrid());
  const [useCubemapIbl] = useState(() => readRotationPreviewUseCubemapIbl(HUD_STORAGE_KEY));
  const [environmentPresetIndex, setEnvironmentPresetIndex] = useState(() =>
    readRotationPreviewEnvPresetIndex(HUD_STORAGE_KEY),
  );
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [envMenuOpen, setEnvMenuOpen] = useState(false);
  const [tagFilterMenuOpen, setTagFilterMenuOpen] = useState(false);
  const [twinTagFilterMode, setTwinTagFilterMode] = useState(resolveInitialTwinTagFilterMode);
  const lastVisibleTwinTagFilterModeRef = useRef<AnimationLabTwinTagFilterModeVisible>(
    resolveInitialLastVisibleTwinTagFilterMode(),
  );
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const envMenuRef = useRef<HTMLDivElement>(null);
  const tagFilterMenuRef = useRef<HTMLDivElement>(null);

  const applyTwinTagFilterMode = useCallback((mode: AnimationLabTwinTagFilterMode) => {
    if (mode !== "hidden") {
      lastVisibleTwinTagFilterModeRef.current = mode;
    }
    setTwinTagFilterMode(mode);
  }, []);

  const toggleTwinTagsQuick = useCallback(() => {
    setTwinTagFilterMode((current) => {
      if (current === "hidden") {
        return lastVisibleTwinTagFilterModeRef.current;
      }
      lastVisibleTwinTagFilterModeRef.current = current;
      return "hidden";
    });
  }, []);

  useEffect(() => {
    persistRotationPreviewEnvPresetIndex(environmentPresetIndex, HUD_STORAGE_KEY);
  }, [environmentPresetIndex]);

  useEffect(() => {
    persistAnimationLabModelId(modelId);
  }, [modelId]);

  useEffect(() => {
    const onOpenModel = (event: Event) => {
      const detail = (event as CustomEvent<{ modelId?: string }>).detail;
      const nextId = detail?.modelId?.trim();
      if (nextId != null && nextId.length > 0) {
        setModelId(nextId);
      }
    };
    window.addEventListener(ANIMATION_LAB_OPEN_MODEL_EVENT, onOpenModel);
    return () => window.removeEventListener(ANIMATION_LAB_OPEN_MODEL_EVENT, onOpenModel);
  }, []);

  useEffect(() => {
    persistAnimationLabShowGrid(showGrid);
  }, [showGrid]);

  useEffect(() => {
    persistAnimationLabTwinTagFilterMode(twinTagFilterMode);
  }, [twinTagFilterMode]);

  useEffect(() => {
    if (!modelMenuOpen) {
      return;
    }
    const onDown = (e: MouseEvent) => {
      if (modelMenuRef.current != null && !modelMenuRef.current.contains(e.target as Node)) {
        setModelMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [modelMenuOpen]);

  useEffect(() => {
    if (!envMenuOpen) {
      return;
    }
    const onDown = (e: MouseEvent) => {
      if (envMenuRef.current != null && !envMenuRef.current.contains(e.target as Node)) {
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

  useEffect(() => {
    if (!tagFilterMenuOpen) {
      return;
    }
    const onDown = (e: MouseEvent) => {
      if (tagFilterMenuRef.current != null && !tagFilterMenuRef.current.contains(e.target as Node)) {
        setTagFilterMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTagFilterMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [tagFilterMenuOpen]);

  const catalogEntry = useMemo(() => {
    if (modelId === ANIMATION_LAB_DEFAULT_MODEL_ID) {
      return null;
    }
    return catalogModels.find((m) => m.id === modelId) ?? null;
  }, [catalogModels, modelId]);

  const fetchUrl = useMemo(() => {
    if (modelId === ANIMATION_LAB_DEFAULT_MODEL_ID) {
      return resolveDefaultPreviewMeshGlbUrl();
    }
    return resolveAnimationLabMeshFetchUrl(catalogEntry, descriptors);
  }, [catalogEntry, descriptors, modelId]);

  const meta = useMemo(() => {
    if (modelId === ANIMATION_LAB_DEFAULT_MODEL_ID) {
      return { label: "PSoC E84 AI (default)", dedupeKey: "models/psoc-e84-ai/psoc-e84-ai.glb" };
    }
    if (catalogEntry == null) {
      return { label: "Unknown model", dedupeKey: "" };
    }
    return {
      label: formatModelDisplayName(catalogEntry.name),
      dedupeKey: catalogEntry.dedupeKey,
    };
  }, [catalogEntry, modelId]);

  return (
    <GlbAnimationLabProvider
      fetchUrl={fetchUrl}
      modelLabel={meta.label}
      dedupeKey={meta.dedupeKey}
    >
      <GlbAnimationLabTwinProvider>
        <GlbAnimationLabViewportInner
          fetchUrl={fetchUrl}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          useCubemapIbl={useCubemapIbl}
          environmentPresetIndex={environmentPresetIndex}
          setEnvironmentPresetIndex={setEnvironmentPresetIndex}
          modelMenuOpen={modelMenuOpen}
          setModelMenuOpen={setModelMenuOpen}
          modelMenuRef={modelMenuRef}
          modelId={modelId}
          setModelId={setModelId}
          catalogModels={catalogModels}
          twinTagFilterMode={twinTagFilterMode}
          onTwinTagFilterModeChange={applyTwinTagFilterMode}
          onToggleTwinTagsQuick={toggleTwinTagsQuick}
          tagFilterMenuOpen={tagFilterMenuOpen}
          setTagFilterMenuOpen={setTagFilterMenuOpen}
          tagFilterMenuRef={tagFilterMenuRef}
          envMenuOpen={envMenuOpen}
          setEnvMenuOpen={setEnvMenuOpen}
          envMenuRef={envMenuRef}
        />
      </GlbAnimationLabTwinProvider>
    </GlbAnimationLabProvider>
  );
}
