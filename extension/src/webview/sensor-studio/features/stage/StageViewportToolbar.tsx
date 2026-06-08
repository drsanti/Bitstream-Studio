import {
  Box,
  Circle,
  Cloud,
  CloudFog,
  Focus,
  Grid3X3,
  ImageIcon,
  Layers,
  Move3d,
  Pencil,
  Play,
  RotateCcw,
  RotateCw,
  Scaling,
  Sparkles,
  Square,
} from "lucide-react";
import type { StageProceduralSpawnKind } from "../../core/stage/stage-procedural-spawn-kind";
import type { StageWorkbenchMode } from "../../core/stage/stage-workbench-mode";
import type { StudioViewportGizmoMode } from "../../core/viewport/studio-viewport-gizmo-mode";
import type { StudioViewportProjectionMode } from "../../core/viewport/studio-viewport-projection";
import { useMemo } from "react";
import type { TRNSelectOption } from "../../../ui/TRN";
import { TRNIconButton } from "../../../ui/TRN/TRNIconButton";
import { TRNSelect } from "../../../ui/TRN/TRNSelect";
import { TRNTooltip } from "../../../ui/TRN/TRNTooltip";

const TOOLBAR_HINT_DELAY_MS = 400;

export function StageViewportToolbar(props: {
  showGrid: boolean;
  showBackgroundTexture: boolean;
  useCubemapIbl: boolean;
  fogEnabled: boolean;
  physicsActive: boolean;
  colliderCount?: number;
  modelCount: number;
  /** Scene Output `env` socket wired from an Environment catalog node. */
  environmentWired?: boolean;
  environmentSelectOptions?: TRNSelectOption[];
  environmentSelectValue?: string;
  onEnvironmentSelectChange?: (value: string) => void;
  modelSelectOptions?: TRNSelectOption[];
  primaryModelIndex?: number;
  onPrimaryModelIndexChange?: (index: number) => void;
  /** Catalog GLB for focused wired **model-select** (Stage overrides flow node). */
  studioModelCatalogPatchable?: boolean;
  studioModelCatalogOptions?: TRNSelectOption[];
  studioModelCatalogValue?: string;
  onStudioModelCatalogChange?: (value: string) => void;
  studioModelSourceLabel?: string | null;
  onToggleGrid: () => void;
  onToggleBackground: () => void;
  onToggleIbl: () => void;
  onToggleFog: () => void;
  onFrameModel?: () => void;
  onResetCamera?: () => void;
  viewportProjection?: StudioViewportProjectionMode;
  onToggleViewportProjection?: () => void;
  gizmoEligible?: boolean;
  gizmoMode?: StudioViewportGizmoMode;
  onGizmoModeChange?: (mode: StudioViewportGizmoMode) => void;
  /** SE4 — add procedural primitives at Stage click. */
  spawnEnabled?: boolean;
  spawnPendingKind?: StageProceduralSpawnKind | null;
  onToggleSpawnKind?: (kind: StageProceduralSpawnKind) => void;
  stageToolbarPresentationEnabled?: boolean;
  stageEnvironmentPickerEnabled?: boolean;
  stageBackdropControlEnabled?: boolean;
  stageIblControlEnabled?: boolean;
  /** Edit = gizmo + spawn authoring. Simulate = graph eval drives the viewport. */
  workbenchMode?: StageWorkbenchMode;
  onWorkbenchModeChange?: (mode: StageWorkbenchMode) => void;
}) {
  const {
    showGrid,
    showBackgroundTexture,
    useCubemapIbl,
    fogEnabled,
    physicsActive,
    colliderCount = 0,
    modelCount,
    environmentWired = false,
    environmentSelectOptions = [],
    environmentSelectValue = "",
    onEnvironmentSelectChange,
    modelSelectOptions = [],
    primaryModelIndex = 0,
    onPrimaryModelIndexChange,
    studioModelCatalogPatchable = false,
    studioModelCatalogOptions = [],
    studioModelCatalogValue = "",
    onStudioModelCatalogChange,
    studioModelSourceLabel = null,
    onToggleGrid,
    onToggleBackground,
    onToggleIbl,
    onToggleFog,
    onFrameModel,
    onResetCamera,
    viewportProjection = "perspective",
    onToggleViewportProjection,
    gizmoEligible = false,
    gizmoMode = "translate",
    onGizmoModeChange,
    spawnEnabled = false,
    spawnPendingKind = null,
    onToggleSpawnKind,
    stageToolbarPresentationEnabled = true,
    stageEnvironmentPickerEnabled = true,
    stageBackdropControlEnabled = true,
    stageIblControlEnabled = true,
    workbenchMode = "edit",
    onWorkbenchModeChange,
  } = props;

  const showModelFocusPicker =
    modelCount > 1 && modelSelectOptions.length > 1 && onPrimaryModelIndexChange != null;
  const showStudioModelCatalogPicker =
    stageToolbarPresentationEnabled &&
    studioModelCatalogPatchable &&
    studioModelCatalogOptions.length > 0 &&
    onStudioModelCatalogChange != null &&
    studioModelCatalogValue.length > 0;

  const studioModelCatalogHint = useMemo(() => {
    const row = studioModelCatalogOptions.find((o) => o.value === studioModelCatalogValue);
    const name = typeof row?.label === "string" ? row.label : "Studio model";
    const slot =
      modelCount > 1 && studioModelSourceLabel != null
        ? ` (${studioModelSourceLabel})`
        : "";
    return `${name}${slot} — updates wired Model Source node`;
  }, [
    modelCount,
    studioModelCatalogOptions,
    studioModelCatalogValue,
    studioModelSourceLabel,
  ]);
  const showEnvironmentPicker =
    stageToolbarPresentationEnabled &&
    stageEnvironmentPickerEnabled &&
    environmentSelectOptions.length > 0 &&
    onEnvironmentSelectChange != null;

  const environmentPickerHint = useMemo(() => {
    const row = environmentSelectOptions.find((o) => o.value === environmentSelectValue);
    const name = typeof row?.label === "string" ? row.label : "Cubemap preset";
    return environmentWired
      ? `${name} — updates wired Environment node`
      : `${name} — Scene Output environment`;
  }, [environmentSelectOptions, environmentSelectValue, environmentWired]);
  const canCamera = modelCount > 0 && onFrameModel != null && onResetCamera != null;
  const isOrtho = viewportProjection === "orthographic";
  const canToggleProjection = canCamera && onToggleViewportProjection != null;
  const iconBtn =
    "!h-7 !w-7 !rounded-full !border-0 !bg-transparent hover:!bg-zinc-800/60";

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-3 z-[60] flex w-max max-w-[min(96vw,52rem)] -translate-x-1/2 flex-nowrap items-center justify-center gap-1 overflow-x-auto scrollbar-hide rounded-full border border-zinc-700/80 bg-zinc-950/80 px-1.5 py-1 shadow-lg backdrop-blur-md"
      role="toolbar"
      aria-label="Stage viewport"
    >
      {onWorkbenchModeChange != null ? (
        <div className="pointer-events-auto flex shrink-0 items-center gap-0.5 rounded-full border border-zinc-700/70 bg-zinc-900/50 p-0.5">
          <TRNIconButton
            icon={
              <Play
                size={14}
                className={
                  workbenchMode === "simulate" ? "text-sky-300" : "text-zinc-500"
                }
              />
            }
            label="Simulate"
            hint="Simulate — flow graph evaluation drives the Stage viewport."
            hintPlacement="bottom"
            hintDelayMs={TOOLBAR_HINT_DELAY_MS}
            aria-pressed={workbenchMode === "simulate"}
            onClick={() => onWorkbenchModeChange("simulate")}
            className={iconBtn}
          />
          <TRNIconButton
            icon={
              <Pencil
                size={14}
                className={workbenchMode === "edit" ? "text-sky-300" : "text-zinc-500"}
              />
            }
            label="Edit"
            hint="Edit — select objects, use the transform gizmo, and place primitives."
            hintPlacement="bottom"
            hintDelayMs={TOOLBAR_HINT_DELAY_MS}
            aria-pressed={workbenchMode === "edit"}
            onClick={() => onWorkbenchModeChange("edit")}
            className={iconBtn}
          />
        </div>
      ) : null}
      {onWorkbenchModeChange != null ? (
        <span className="pointer-events-none h-3.5 w-px bg-zinc-700/80" aria-hidden />
      ) : null}
      {modelCount === 0 ? (
        <span className="pointer-events-none px-2 text-[10px] font-medium tracking-wide text-zinc-500">
          No models
        </span>
      ) : null}
      {showStudioModelCatalogPicker ? (
        <>
          <div className="relative inline-flex shrink-0 pointer-events-auto">
            <TRNTooltip
              content={studioModelCatalogHint}
              placement="bottom"
              triggerWrapper="span"
              triggerClassName="inline-flex shrink-0"
              triggerAriaLabel="Stage studio model catalog"
              trigger={
                <TRNSelect
                  trigger="icon"
                  size="sm"
                  value={studioModelCatalogValue}
                  options={studioModelCatalogOptions}
                  ariaLabel="Stage studio model catalog"
                  sectionTitle="Studio model"
                  iconTrigger={<Box size={14} className="text-violet-300/90" aria-hidden />}
                  iconButtonClassName={iconBtn}
                  panelClassName="scrollbar-hide max-h-48 min-w-44 overflow-y-auto"
                  onValueChange={onStudioModelCatalogChange}
                />
              }
            />
          </div>
        </>
      ) : null}
      {showModelFocusPicker ? (
        <>
          <span className="pointer-events-none h-3.5 w-px bg-zinc-700/80" aria-hidden />
          <div className="pointer-events-auto min-w-30 max-w-44">
            <TRNSelect
              trigger="icon"
              size="sm"
              value={String(primaryModelIndex)}
              options={modelSelectOptions}
              ariaLabel="Stage focus model slot"
              sectionTitle="Focus model"
              iconTrigger={<Layers size={14} className="text-zinc-400" aria-hidden />}
              iconButtonClassName={iconBtn}
              panelClassName="scrollbar-hide min-w-40"
              onValueChange={(v) => {
                const idx = Number.parseInt(v, 10);
                if (Number.isFinite(idx)) {
                  onPrimaryModelIndexChange(idx);
                }
              }}
            />
          </div>
        </>
      ) : null}
      {modelCount > 0 && !showStudioModelCatalogPicker && !showModelFocusPicker ? (
        <span className="pointer-events-none px-2 text-[10px] font-medium tracking-wide text-zinc-500">
          {modelCount === 1 ? "1 model" : `${modelCount} models`}
        </span>
      ) : null}
      {showEnvironmentPicker ? (
        <>
          <span className="pointer-events-none h-3.5 w-px bg-zinc-700/80" aria-hidden />
          <div className="relative inline-flex shrink-0 pointer-events-auto">
            <TRNTooltip
              content={environmentPickerHint}
              placement="bottom"
              triggerWrapper="span"
              triggerClassName="inline-flex shrink-0"
              triggerAriaLabel="Stage environment cubemap preset"
              trigger={
                <TRNSelect
                  trigger="icon"
                  size="sm"
                  value={environmentSelectValue}
                  options={environmentSelectOptions}
                  ariaLabel="Stage environment cubemap preset"
                  sectionTitle="Cubemap preset"
                  iconTrigger={
                    <ImageIcon
                      size={14}
                      className={environmentWired ? "text-sky-400" : "text-zinc-400"}
                      aria-hidden
                    />
                  }
                  iconButtonClassName={iconBtn}
                  panelClassName="scrollbar-hide max-h-60 min-w-44 overflow-y-auto"
                  onValueChange={onEnvironmentSelectChange}
                />
              }
            />
          </div>
        </>
      ) : null}
      {physicsActive ? (
        <>
          <span className="pointer-events-none h-3.5 w-px bg-zinc-700/80" aria-hidden />
          <span className="pointer-events-none px-2 text-[10px] font-medium text-emerald-400/90">
            Physics{colliderCount > 0 ? ` · ${colliderCount} coll.` : ""}
          </span>
        </>
      ) : null}
      {canCamera ? (
        <>
          <span className="pointer-events-none h-3.5 w-px bg-zinc-700/80" aria-hidden />
          <TRNIconButton
            icon={<Focus size={14} className="text-zinc-400" />}
            label="Frame model"
            hint="Fit orbit camera to the focused model."
            hintPlacement="bottom"
            hintDelayMs={TOOLBAR_HINT_DELAY_MS}
            onClick={onFrameModel}
            className={iconBtn}
          />
          <TRNIconButton
            icon={<RotateCcw size={14} className="text-zinc-400" />}
            label="Reset camera"
            hint="Restore camera pose from Scene Output committed scene3d."
            hintPlacement="bottom"
            hintDelayMs={TOOLBAR_HINT_DELAY_MS}
            onClick={onResetCamera}
            className={iconBtn}
          />
          {canToggleProjection ? (
            <TRNIconButton
              icon={
                <span
                  className={`text-[10px] font-semibold tracking-wide ${isOrtho ? "text-sky-300" : "text-zinc-400"}`}
                  aria-hidden
                >
                  {isOrtho ? "Ortho" : "Persp"}
                </span>
              }
              label={isOrtho ? "Switch to perspective" : "Switch to orthographic"}
              hint={
                isOrtho
                  ? "Orthographic view (session). Numpad 5 toggles projection."
                  : "Perspective view (session). Numpad 5 toggles projection."
              }
              hintPlacement="bottom"
              hintDelayMs={TOOLBAR_HINT_DELAY_MS}
              aria-pressed={isOrtho}
              onClick={onToggleViewportProjection}
              className={`${iconBtn} !w-11`}
            />
          ) : null}
        </>
      ) : null}
      {spawnEnabled && onToggleSpawnKind != null ? (
        <>
          <span className="pointer-events-none h-3.5 w-px bg-zinc-700/80" aria-hidden />
          <TRNIconButton
            icon={
              <Box
                size={14}
                className={spawnPendingKind === "box" ? "text-emerald-300" : "text-zinc-500"}
              />
            }
            label="Add box"
            hint="Arm box placement — click the Stage to spawn Mesh Box + material + transform (Esc to cancel)."
            hintPlacement="bottom"
            hintDelayMs={TOOLBAR_HINT_DELAY_MS}
            aria-pressed={spawnPendingKind === "box"}
            onClick={() => onToggleSpawnKind("box")}
            className={iconBtn}
          />
          <TRNIconButton
            icon={
              <Circle
                size={14}
                className={spawnPendingKind === "sphere" ? "text-emerald-300" : "text-zinc-500"}
              />
            }
            label="Add sphere"
            hint="Arm sphere placement — click the Stage to spawn Mesh Sphere wired to Scene Output."
            hintPlacement="bottom"
            hintDelayMs={TOOLBAR_HINT_DELAY_MS}
            aria-pressed={spawnPendingKind === "sphere"}
            onClick={() => onToggleSpawnKind("sphere")}
            className={iconBtn}
          />
          <TRNIconButton
            icon={
              <Square
                size={14}
                className={spawnPendingKind === "plane" ? "text-emerald-300" : "text-zinc-500"}
              />
            }
            label="Add plane"
            hint="Arm plane placement — click the Stage to spawn a horizontal Mesh Plane at the hit point."
            hintPlacement="bottom"
            hintDelayMs={TOOLBAR_HINT_DELAY_MS}
            aria-pressed={spawnPendingKind === "plane"}
            onClick={() => onToggleSpawnKind("plane")}
            className={iconBtn}
          />
        </>
      ) : null}
      {gizmoEligible && onGizmoModeChange != null ? (
        <>
          <span className="pointer-events-none h-3.5 w-px bg-zinc-700/80" aria-hidden />
          <TRNIconButton
            icon={
              <Move3d
                size={14}
                className={gizmoMode === "translate" ? "text-sky-300" : "text-zinc-500"}
              />
            }
            label="Move"
            hint="Translate gizmo (G). Writes to wired Object Transform or mesh node."
            hintPlacement="bottom"
            hintDelayMs={TOOLBAR_HINT_DELAY_MS}
            aria-pressed={gizmoMode === "translate"}
            onClick={() => onGizmoModeChange("translate")}
            className={iconBtn}
          />
          <TRNIconButton
            icon={
              <RotateCw
                size={14}
                className={gizmoMode === "rotate" ? "text-sky-300" : "text-zinc-500"}
              />
            }
            label="Rotate"
            hint="Rotate gizmo (R). Orbit is disabled while dragging."
            hintPlacement="bottom"
            hintDelayMs={TOOLBAR_HINT_DELAY_MS}
            aria-pressed={gizmoMode === "rotate"}
            onClick={() => onGizmoModeChange("rotate")}
            className={iconBtn}
          />
          <TRNIconButton
            icon={
              <Scaling
                size={14}
                className={gizmoMode === "scale" ? "text-sky-300" : "text-zinc-500"}
              />
            }
            label="Scale"
            hint="Scale gizmo (S)."
            hintPlacement="bottom"
            hintDelayMs={TOOLBAR_HINT_DELAY_MS}
            aria-pressed={gizmoMode === "scale"}
            onClick={() => onGizmoModeChange("scale")}
            className={iconBtn}
          />
        </>
      ) : null}
      {stageToolbarPresentationEnabled ? (
        <>
      <span className="pointer-events-none h-3.5 w-px bg-zinc-700/80" aria-hidden />
      <TRNIconButton
        icon={<Grid3X3 size={14} className={showGrid ? "text-emerald-400" : "text-zinc-500"} />}
        label={showGrid ? "Hide grid" : "Show grid"}
        hint="Floor grid on Scene Output scene3d."
        hintPlacement="bottom"
        hintDelayMs={TOOLBAR_HINT_DELAY_MS}
        aria-pressed={showGrid}
        onClick={onToggleGrid}
        className={iconBtn}
      />
      {stageBackdropControlEnabled ? (
      <TRNIconButton
        icon={<Cloud size={14} className={showBackgroundTexture ? "text-sky-400" : "text-zinc-500"} />}
        label={showBackgroundTexture ? "Hide backdrop" : "Show backdrop"}
        hint={
          environmentWired
            ? "Updates Background texture on the wired Environment node and Stage."
            : "Cubemap as visible background on Scene Output."
        }
        hintPlacement="bottom"
        hintDelayMs={TOOLBAR_HINT_DELAY_MS}
        aria-pressed={showBackgroundTexture}
        onClick={onToggleBackground}
        className={iconBtn}
      />
      ) : null}
      {stageIblControlEnabled ? (
      <TRNIconButton
        icon={<Sparkles size={14} className={useCubemapIbl ? "text-amber-300" : "text-zinc-500"} />}
        label={useCubemapIbl ? "IBL on" : "IBL off"}
        hint={
          environmentWired
            ? "Updates Use IBL on the wired Environment node and Stage."
            : "Image-based lighting reflections on Scene Output."
        }
        hintPlacement="bottom"
        hintDelayMs={TOOLBAR_HINT_DELAY_MS}
        aria-pressed={useCubemapIbl}
        onClick={onToggleIbl}
        className={iconBtn}
      />
      ) : null}
      <TRNIconButton
        icon={<CloudFog size={14} className={fogEnabled ? "text-violet-300" : "text-zinc-500"} />}
        label={fogEnabled ? "Fog on" : "Fog off"}
        hint="Scene fog from Scene Output scene3d."
        hintPlacement="bottom"
        hintDelayMs={TOOLBAR_HINT_DELAY_MS}
        aria-pressed={fogEnabled}
        onClick={onToggleFog}
        className={iconBtn}
      />
        </>
      ) : null}
    </div>
  );
}
