import { Box, Cloud, CloudFog, Focus, Grid3X3, ImageIcon, Layers, RotateCcw, Sparkles } from "lucide-react";
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
  stageToolbarPresentationEnabled?: boolean;
  stageEnvironmentPickerEnabled?: boolean;
  stageBackdropControlEnabled?: boolean;
  stageIblControlEnabled?: boolean;
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
    stageToolbarPresentationEnabled = true,
    stageEnvironmentPickerEnabled = true,
    stageBackdropControlEnabled = true,
    stageIblControlEnabled = true,
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
    return `${name}${slot} — updates wired Studio Model node`;
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
  const iconBtn =
    "!h-7 !w-7 !rounded-full !border-0 !bg-transparent hover:!bg-zinc-800/60";

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-3 z-[60] flex w-max max-w-[min(96vw,52rem)] -translate-x-1/2 flex-nowrap items-center justify-center gap-1 overflow-x-auto scrollbar-hide rounded-full border border-zinc-700/80 bg-zinc-950/80 px-1.5 py-1 shadow-lg backdrop-blur-md"
      role="toolbar"
      aria-label="Stage viewport"
    >
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
