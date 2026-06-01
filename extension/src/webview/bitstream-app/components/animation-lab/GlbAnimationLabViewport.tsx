import { Box, Globe2, LayoutGrid, Package, Tags } from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { twMerge } from "tailwind-merge";
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
  readRotationPreviewShowBackgroundTexture,
  readRotationPreviewUseCubemapIbl,
} from "../3d-rotation/shared/rotationPreviewViewportPersistence.js";
import {
  ANIMATION_LAB_DEFAULT_MODEL_ID,
  ANIMATION_LAB_OPEN_MODEL_EVENT,
  ANIMATION_LAB_STORAGE_PREFIX,
} from "./animation-lab-constants.js";
import {
  persistAnimationLabModelId,
  persistAnimationLabShowGrid,
  persistAnimationLabShowTwinTags,
  persistAnimationLabTwinTagsFaultsOnly,
  readAnimationLabModelId,
  readAnimationLabShowGrid,
  readAnimationLabShowTwinTags,
  readAnimationLabTwinTagsFaultsOnly,
} from "./animation-lab-persistence.js";
import { GlbAnimationLabProvider } from "./glb-animation-lab-context.js";
import { GlbAnimationLabTwinProvider, useGlbAnimationLabTwin } from "./glb-animation-lab-twin-context.js";
import { ANIMATION_LAB_CAMERA_POSITION, GlbAnimationLabScene } from "./GlbAnimationLabScene.js";
import { GlbAnimationLabInspector } from "./GlbAnimationLabInspector.js";
import { AnimationLabCss3dOverlay } from "./css3d/AnimationLabCss3dOverlay.js";
import { AnimationLabCss3dTagsRegistrar } from "./css3d/AnimationLabCss3dTagsRegistrar.js";
import { resolveAnimationLabMeshFetchUrl } from "./resolve-animation-lab-mesh-fetch-url.js";
import {
  ROTATION_PREVIEW_DEFAULT_USE_CUBEMAP_IBL,
  ROTATION_PREVIEW_TONE_MAPPING_EXPOSURE,
} from "../3d-rotation/shared/rotationPreviewConstants.js";

const HUD_STORAGE_KEY = `${ANIMATION_LAB_STORAGE_PREFIX}:viewport`;
/** When twin has this many subsystems, default 3D tags to alerts-only (unless user saved a preference). */
const TWIN_TAGS_ALERTS_ONLY_DEFAULT_MIN_COMPONENTS = 6;

function AnimationLabViewportToolbar(props: {
  showGrid: boolean;
  onToggleGrid: () => void;
  showTwinTags: boolean;
  onToggleTwinTags: () => void;
  twinTagsFaultsOnly: boolean;
  onToggleTwinTagsFaultsOnly: () => void;
  hasTwin: boolean;
  modelMenuOpen: boolean;
  onToggleModelMenu: () => void;
  modelMenuRef: React.RefObject<HTMLDivElement | null>;
  modelId: string;
  onSelectModel: (id: string) => void;
  catalogModels: { id: string; name: string }[];
}) {
  const {
    showGrid,
    onToggleGrid,
    showTwinTags,
    onToggleTwinTags,
    twinTagsFaultsOnly,
    onToggleTwinTagsFaultsOnly,
    hasTwin,
    modelMenuOpen,
    onToggleModelMenu,
    modelMenuRef,
    modelId,
    onSelectModel,
    catalogModels,
  } = props;

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
          <button
            type="button"
            className={twMerge(
              "flex h-8 w-8 items-center justify-center rounded-md border border-zinc-600/70 bg-black/55 text-zinc-300 shadow-sm backdrop-blur-sm hover:bg-zinc-800/75",
              showTwinTags && "border-cyan-500/50 text-cyan-200",
            )}
            aria-label={showTwinTags ? "Hide twin tags in 3D" : "Show twin tags in 3D"}
            aria-pressed={showTwinTags}
            onClick={onToggleTwinTags}
          >
            <Tags className="h-4 w-4" aria-hidden />
          </button>
          {showTwinTags ? (
            <button
              type="button"
              className={twMerge(
                "flex h-8 items-center rounded-md border border-zinc-600/70 bg-black/55 px-2 text-[10px] font-medium text-zinc-300 shadow-sm backdrop-blur-sm hover:bg-zinc-800/75",
                twinTagsFaultsOnly && "border-amber-500/50 text-amber-200",
              )}
              aria-label={
                twinTagsFaultsOnly
                  ? "Show all twin tags"
                  : "Show only alerts and selected subsystem tags"
              }
              aria-pressed={twinTagsFaultsOnly}
              onClick={onToggleTwinTagsFaultsOnly}
            >
              Alerts only
            </button>
          ) : null}
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
      <span className="flex h-8 items-center rounded-md border border-zinc-600/70 bg-black/55 px-2 text-[10px] text-zinc-400">
        <Globe2 className="mr-1 h-3.5 w-3.5" aria-hidden />
        env
      </span>
    </div>
  );
}

function GlbAnimationLabViewportInner(props: {
  fetchUrl: string;
  showGrid: boolean;
  setShowGrid: React.Dispatch<React.SetStateAction<boolean>>;
  showBackgroundTexture: boolean;
  useCubemapIbl: boolean;
  environmentPresetIndex: number;
  modelMenuOpen: boolean;
  setModelMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  modelMenuRef: React.RefObject<HTMLDivElement | null>;
  modelId: string;
  setModelId: (id: string) => void;
  catalogModels: { id: string; name: string }[];
  showTwinTags: boolean;
  setShowTwinTags: React.Dispatch<React.SetStateAction<boolean>>;
  twinTagsFaultsOnly: boolean;
  setTwinTagsFaultsOnly: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const twinCtx = useGlbAnimationLabTwin();
  const hasTwin = twinCtx?.twin != null;
  const tagsActive = hasTwin && props.showTwinTags;

  useEffect(() => {
    if (readAnimationLabTwinTagsFaultsOnly() != null) {
      return;
    }
    const count = twinCtx?.components.length ?? 0;
    if (count >= TWIN_TAGS_ALERTS_ONLY_DEFAULT_MIN_COMPONENTS) {
      props.setTwinTagsFaultsOnly(true);
    }
  }, [twinCtx?.components.length, props.setTwinTagsFaultsOnly]);

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
          }}
        >
          <Suspense fallback={null}>
            <GlbAnimationLabScene
              fetchUrl={props.fetchUrl}
              showGrid={props.showGrid}
              showBackgroundTexture={props.showBackgroundTexture}
              useCubemapIbl={props.useCubemapIbl ?? ROTATION_PREVIEW_DEFAULT_USE_CUBEMAP_IBL}
              environmentPresetIndex={props.environmentPresetIndex}
            />
          </Suspense>
        </Canvas>
        <AnimationLabCss3dOverlay enabled={tagsActive} />
        <AnimationLabCss3dTagsRegistrar
          enabled={tagsActive}
          faultsOnly={props.twinTagsFaultsOnly}
        />
        <AnimationLabViewportToolbar
          showGrid={props.showGrid}
          onToggleGrid={() => props.setShowGrid((v) => !v)}
          showTwinTags={props.showTwinTags}
          onToggleTwinTags={() => props.setShowTwinTags((v) => !v)}
          twinTagsFaultsOnly={props.twinTagsFaultsOnly}
          onToggleTwinTagsFaultsOnly={() => props.setTwinTagsFaultsOnly((v) => !v)}
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
  const [showBackgroundTexture] = useState(() =>
    readRotationPreviewShowBackgroundTexture(HUD_STORAGE_KEY),
  );
  const [useCubemapIbl] = useState(() => readRotationPreviewUseCubemapIbl(HUD_STORAGE_KEY));
  const [environmentPresetIndex] = useState(() =>
    readRotationPreviewEnvPresetIndex(HUD_STORAGE_KEY),
  );
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [showTwinTags, setShowTwinTags] = useState(() => readAnimationLabShowTwinTags() ?? true);
  const [twinTagsFaultsOnly, setTwinTagsFaultsOnly] = useState(
    () => readAnimationLabTwinTagsFaultsOnly() ?? false,
  );
  const modelMenuRef = useRef<HTMLDivElement>(null);

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
    persistAnimationLabShowTwinTags(showTwinTags);
  }, [showTwinTags]);

  useEffect(() => {
    persistAnimationLabTwinTagsFaultsOnly(twinTagsFaultsOnly);
  }, [twinTagsFaultsOnly]);

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
          showBackgroundTexture={showBackgroundTexture}
          useCubemapIbl={useCubemapIbl}
          environmentPresetIndex={environmentPresetIndex}
          modelMenuOpen={modelMenuOpen}
          setModelMenuOpen={setModelMenuOpen}
          modelMenuRef={modelMenuRef}
          modelId={modelId}
          setModelId={setModelId}
          catalogModels={catalogModels}
          showTwinTags={showTwinTags}
          setShowTwinTags={setShowTwinTags}
          twinTagsFaultsOnly={twinTagsFaultsOnly}
          setTwinTagsFaultsOnly={setTwinTagsFaultsOnly}
        />
      </GlbAnimationLabTwinProvider>
    </GlbAnimationLabProvider>
  );
}
