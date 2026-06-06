import { getEngineEnvironmentCubeMaps } from "@/engine-environment/t3dEngineEnvironment";
import {
  ArrowDown,
  ArrowUp,
  Box,
  Camera,
  Copy,
  Globe2,
  Grid3x3,
  Lightbulb,
  MonitorPlay,
  MousePointer2,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TRNAccordion,
  TRNAccordionContent,
  TRNAccordionItem,
  TRNAccordionTrigger,
  TRNColorRingPicker,
  TRNFormField,
  TRNFormSection,
  TRNInlineEdit,
  TRNInspectorIconRail,
  TRNMenuSectionTitle,
  TRNParameterSlider,
  TRNSelect,
  TRNTransformSection,
  TRNToggleSwitch,
  TRNVector3Field,
  type TRNInspectorIconRailItem,
  type TRNSelectOption,
  type TRNVector3,
} from "../../../../../../ui/TRN";
import { studioAssetSourceBadgeClasses } from "../../../../asset-browser/studio-asset-source-badge";
import { useStudioAssetDescriptors } from "../../../../asset-browser/useStudioAssetDescriptors";
import {
  findT3DCubemapPresetIndexForStudioEnvironment,
  getStudioEnvironmentDescriptorById,
  listStudioEnvironmentDescriptors,
  parseT3dPresetEnvironmentSelectValue,
  resolveStudioEnvironmentDescriptorForUI,
  scene3dInspectorEnvironmentCatalogSelectValue,
  STUDIO_ENVIRONMENT_T3D_PRESET_VALUE_PREFIX,
} from "../../../../asset-browser/studio-environment-scene-bindings";
import {
  getStudioModelDescriptorById,
  persistedModelUrlFromStudioDescriptor,
  resolveStudioModelDescriptorForPersistedModel,
  scene3dInspectorModelCatalogSelectValue,
  STUDIO_MODEL_SELECT_CUSTOM,
} from "../../../../asset-browser/studio-model-scene-bindings";
import { buildScene3dInspectorModelCatalogSelectOptions } from "../../../nodes/model-nodes/studio-model-catalog-select-ui";
import { assetSourceLabel } from "../../../../../../assets-manager/browse/asset-source-label";
import {
  coerceScene3DConfigV1,
  defaultScene3DConfig,
  MAX_STUDIO_DIRECTIONALS,
  persistScene3DConfig,
  studioLightsFromPreset,
  type EmbeddedRigPolicy,
  type Scene3DConfigV1,
  type StudioLightsPresetId,
} from "../../../../../core/scene3d/scene3d-config";
import type { Scene3dInspectorPanelId } from "../node-inspector-ui-persistence";
import {
  readScene3dInspectorPanelByNodeId,
  writeScene3dInspectorPanelByNodeId,
} from "../node-inspector-ui-persistence";

const ORBIT_MOUSE_OPTIONS: TRNSelectOption[] = [
  { value: "ROTATE", label: "Rotate" },
  { value: "DOLLY", label: "Dolly (zoom)" },
  { value: "PAN", label: "Pan" },
];

const ORBIT_TOUCH_ONE_OPTIONS: TRNSelectOption[] = [
  { value: "ROTATE", label: "Rotate" },
  { value: "PAN", label: "Pan" },
];

const ORBIT_TOUCH_TWO_OPTIONS: TRNSelectOption[] = [
  { value: "DOLLY_PAN", label: "Dolly + pan" },
  { value: "DOLLY_ROTATE", label: "Dolly + rotate" },
];

const SHADOW_MAP_SIZE_OPTIONS: TRNSelectOption[] = [
  { value: "512", label: "512 (fast)" },
  { value: "1024", label: "1024" },
  { value: "2048", label: "2048 (balanced)" },
  { value: "4096", label: "4096 (sharp)" },
];

function directionalLightDisplayLabel(index: number): string {
  return `Light ${index + 1}`;
}

const DIRECTIONAL_LIGHT_TOOL_BTN_CLASS =
  "inline-flex size-6 items-center justify-center rounded border border-zinc-700/70 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-35";

const EMBEDDED_RIG_POLICY_OPTIONS: TRNSelectOption[] = [
  { value: "keep", label: "Keep embedded (lights & cameras)" },
  { value: "hybrid", label: "Hybrid — strip embedded cameras only" },
  { value: "strip", label: "Strip embedded — studio rig only" },
];

const RAIL_ENTRIES: readonly TRNInspectorIconRailItem<Scene3dInspectorPanelId>[] = [
  { id: "model", label: "Model", Icon: Box },
  { id: "environment", label: "Environment", Icon: Globe2 },
  { id: "renderer", label: "Renderer", Icon: MonitorPlay },
  { id: "camera", label: "Camera", Icon: Camera },
  { id: "orbit", label: "Orbit controls", Icon: MousePointer2 },
  { id: "lights", label: "Lights", Icon: Lightbulb },
  { id: "helpers", label: "Helpers", Icon: Grid3x3 },
];

type Scene3dInspectorCardsProps = {
  scene3dRaw: unknown;
  onChangeScene3d: (next: Scene3DConfigV1) => void;
  /**
   * Stage workbench: route catalog picks to wired Model Select (or Scene Output bake)
   * instead of only patching the in-memory scene3d draft.
   */
  onPickStudioModelCatalog?: (catalogId: string) => void;
  /** Extra hint on the Model catalog field (e.g. wired Models on Scene Output). */
  modelCatalogHint?: string;
  /** Stable id for the inspected entity (e.g. flow node id); restores last rail tab per id in-session. */
  inspectorRailResetKey?: string | null;
  /** When set, only this panel body is rendered (for Stage inspector draggable cards). */
  singlePanel?: Scene3dInspectorPanelId;
  /** Omit emerald chrome when nested inside {@link CanvasInspectorCard}. */
  chromeless?: boolean;
};

export function Scene3dInspectorCards(props: Scene3dInspectorCardsProps) {
  const { singlePanel, chromeless = false } = props;
  const { descriptors } = useStudioAssetDescriptors();

  const scene3d = useMemo(
    () => (props.scene3dRaw != null ? coerceScene3DConfigV1(props.scene3dRaw) : defaultScene3DConfig()),
    [props.scene3dRaw],
  );

  const modelSelectOptions = useMemo(
    () => buildScene3dInspectorModelCatalogSelectOptions(descriptors),
    [descriptors],
  );

  const environmentSelectOptions = useMemo<TRNSelectOption[]>(() => {
    const maps = getEngineEnvironmentCubeMaps();
    const t3dRows = maps.map((preset, index) => ({
      value: `${STUDIO_ENVIRONMENT_T3D_PRESET_VALUE_PREFIX}${index}`,
      label: preset.title,
    }));
    const catalogCandidates = listStudioEnvironmentDescriptors(descriptors);
    const catalogOnly = catalogCandidates.filter(
      (d) => findT3DCubemapPresetIndexForStudioEnvironment(maps, d) == null,
    );
    const sid = scene3d.environment.studioAssetId?.trim() ?? "";
    const bound = sid.length > 0 ? getStudioEnvironmentDescriptorById(sid, descriptors) : null;
    const boundMapsToT3d =
      bound != null && findT3DCubemapPresetIndexForStudioEnvironment(maps, bound) != null;
    const appendBound =
      bound != null && boundMapsToT3d && !catalogOnly.some((d) => d.id === bound.id);
    const catalogRows = appendBound ? [...catalogOnly, bound] : catalogOnly;
    return [...t3dRows, ...catalogRows.map((d) => ({ value: d.id, label: d.label }))];
  }, [descriptors, scene3d.environment.studioAssetId]);

  const resolvedStudioModel = useMemo(
    () =>
      resolveStudioModelDescriptorForPersistedModel(scene3d.model.url, scene3d.model.studioAssetId, descriptors),
    [scene3d.model.url, scene3d.model.studioAssetId, descriptors],
  );

  const modelCatalogSelectValue = useMemo(
    () => scene3dInspectorModelCatalogSelectValue(scene3d.model, descriptors),
    [scene3d.model, descriptors],
  );

  const showModelUrlField = modelCatalogSelectValue === STUDIO_MODEL_SELECT_CUSTOM;

  const railByNodeIdRef = useRef<Map<string, Scene3dInspectorPanelId>>(
    readScene3dInspectorPanelByNodeId(),
  );

  const [activeRailPanel, setActiveRailPanel] =
    useState<Scene3dInspectorPanelId>("model");

  useEffect(() => {
    const key = props.inspectorRailResetKey;
    if (key == null) {
      setActiveRailPanel("model");
      return;
    }
    setActiveRailPanel(railByNodeIdRef.current.get(key) ?? "model");
  }, [props.inspectorRailResetKey]);

  const onRailPanelChange = useCallback(
    (panel: Scene3dInspectorPanelId) => {
      setActiveRailPanel(panel);
      if (props.inspectorRailResetKey != null) {
        railByNodeIdRef.current.set(props.inspectorRailResetKey, panel);
        writeScene3dInspectorPanelByNodeId(railByNodeIdRef.current);
      }
    },
    [props.inspectorRailResetKey],
  );

  const set = (patch: (prev: Scene3DConfigV1) => Scene3DConfigV1) => {
    props.onChangeScene3d(persistScene3DConfig(patch(scene3d)));
  };

  const applyLightsPreset = (presetId: StudioLightsPresetId): void => {
    set((prev) => {
      const lights = studioLightsFromPreset(presetId);
      const attach = prev.helpers.directionalLight.attachToDirectionalId;
      const nextAttach =
        attach != null && lights.directionals.some((l) => l.id === attach) ? attach : null;
      return {
        ...prev,
        lights,
        helpers: {
          ...prev.helpers,
          directionalLight: {
            ...prev.helpers.directionalLight,
            attachToDirectionalId: nextAttach,
          },
        },
      };
    });
  };

  const directionalAttachOptions = useMemo<TRNSelectOption[]>(() => {
    const opts: TRNSelectOption[] = [{ value: "", label: "Auto (Light 1)" }];
    scene3d.lights.directionals.forEach((dl, index) => {
      opts.push({ value: dl.id, label: directionalLightDisplayLabel(index) });
    });
    return opts;
  }, [scene3d.lights.directionals]);

  const cubemapEnvironmentOptions = useMemo<TRNSelectOption[]>(() => {
    const maps = getEngineEnvironmentCubeMaps();
    return maps.map((preset, index) => ({
      value: String(index),
      label: preset.title,
    }));
  }, []);

  const cubemapPresetMaxIndex = Math.max(0, cubemapEnvironmentOptions.length - 1);
  const clampedCubemapPresetIndex = Math.min(
    Math.max(0, Math.round(scene3d.environment.presetIndex)),
    cubemapPresetMaxIndex,
  );

  const resolvedStudioEnvironment = useMemo(
    () =>
      resolveStudioEnvironmentDescriptorForUI(
        scene3d.environment,
        getEngineEnvironmentCubeMaps(),
        descriptors,
      ),
    [scene3d.environment, descriptors],
  );

  const environmentCatalogSelectValue = useMemo(
    () =>
      scene3dInspectorEnvironmentCatalogSelectValue(
        scene3d.environment,
        descriptors,
        getEngineEnvironmentCubeMaps(),
      ),
    [scene3d.environment, descriptors],
  );

  const panelActive = (id: Scene3dInspectorPanelId): boolean =>
    singlePanel != null ? singlePanel === id : activeRailPanel === id;

  const showPanelHeading = !chromeless;

  const panelScroll = (
    <>
        {panelActive("model") ? (
          <section className="space-y-2 px-2 pb-3 pt-2 text-[11px] text-zinc-200">
            {showPanelHeading ? (
              <div className="border-b border-emerald-900/25 pb-1 text-[11px] font-semibold text-emerald-100/90">
                Model
              </div>
            ) : null}
            <TRNFormSection
              title="Model"
              showHeading={showPanelHeading}
              description={
                showPanelHeading
                  ? "Scale is kept as-authored (no auto-scaling). Catalog entries match the Asset Browser models list."
                  : undefined
              }
              className="border-0 bg-transparent p-0"
            >
              <div className="flex flex-wrap items-center gap-2 rounded border border-zinc-800/80 bg-zinc-950/30 px-2 py-1.5">
                {resolvedStudioModel != null ? (
                  <>
                    <span className="truncate text-[11px] font-medium text-zinc-200">{resolvedStudioModel.label}</span>
                    <span
                      className={`shrink-0 rounded border px-1 py-px text-[8px] font-semibold tracking-wide ${studioAssetSourceBadgeClasses(
                        resolvedStudioModel.source,
                      )}`}
                    >
                      {assetSourceLabel(resolvedStudioModel.source)}
                    </span>
                    <span className="truncate font-mono text-[9px] text-zinc-500">{resolvedStudioModel.id}</span>
                  </>
                ) : (
                  <span className="rounded border border-zinc-600 bg-zinc-900 px-1 py-px text-[8px] font-semibold uppercase tracking-wide text-zinc-400">
                    Custom path
                  </span>
                )}
              </div>

              <TRNFormField
                label="Catalog"
                hint={
                  props.modelCatalogHint ??
                  (showModelUrlField
                    ? "Pick Custom URL… to edit the GLB/GLTF path below."
                    : "Curated models from the Asset Browser; resolved path is shown in the summary row.")
                }
              >
                <TRNSelect
                  ariaLabel="Studio model catalog"
                  sectionTitle="Studio models"
                  size="sm"
                  value={modelCatalogSelectValue}
                  options={modelSelectOptions}
                  onValueChange={(value) => {
                    if (props.onPickStudioModelCatalog != null) {
                      props.onPickStudioModelCatalog(value);
                      return;
                    }
                    if (value === STUDIO_MODEL_SELECT_CUSTOM) {
                      set((prev) => {
                        const { studioAssetId: _sid, ...rest } = prev.model;
                        return { ...prev, model: { ...rest, studioAssetId: undefined } };
                      });
                      return;
                    }
                    const picked = getStudioModelDescriptorById(value, descriptors);
                    if (picked == null) {
                      return;
                    }
                    set((prev) => ({
                      ...prev,
                      model: {
                        ...prev.model,
                        url: persistedModelUrlFromStudioDescriptor(picked),
                        studioAssetId: picked.id,
                      },
                    }));
                  }}
                />
              </TRNFormField>

              {showModelUrlField ? (
                <TRNFormField
                  label="URL"
                  hint="GLB/GLTF URL. Relative paths should resolve from the webview bundle."
                >
                  <TRNInlineEdit
                    value={scene3d.model.url}
                    onCommit={(next) =>
                      set((prev) => {
                        const { studioAssetId: _sid, ...rest } = prev.model;
                        return {
                          ...prev,
                          model: { ...rest, url: next.trim(), studioAssetId: undefined },
                        };
                      })
                    }
                    inputClassName="font-mono text-[11px]"
                    placeholder="models/psoc-e84-ai/psoc-e84-ai.glb"
                  />
                </TRNFormField>
              ) : null}

              <TRNFormField
                label="Embedded rig policy"
                hint="GLB files may include lights and cameras. Hybrid keeps embedded lights but removes embedded cameras so the orbit preview stays consistent."
              >
                <TRNSelect
                  ariaLabel="Embedded rig policy"
                  sectionTitle="Rig policy"
                  size="sm"
                  value={scene3d.model.embeddedRigPolicy}
                  options={EMBEDDED_RIG_POLICY_OPTIONS}
                  onValueChange={(value) => {
                    const policy = value as EmbeddedRigPolicy;
                    if (policy !== "keep" && policy !== "strip" && policy !== "hybrid") {
                      return;
                    }
                    set((prev) => ({
                      ...prev,
                      model: { ...prev.model, embeddedRigPolicy: policy },
                    }));
                  }}
                />
              </TRNFormField>

              <TRNTransformSection
                value={{
                  position: scene3d.model.transform.position,
                  rotationDeg: scene3d.model.transform.rotationDeg,
                  scale: scene3d.model.transform.scale,
                  uniformScale:
                    Math.abs(scene3d.model.transform.scale.x - scene3d.model.transform.scale.y) <
                      1e-6 &&
                    Math.abs(scene3d.model.transform.scale.x - scene3d.model.transform.scale.z) <
                      1e-6,
                }}
                onChange={(next) =>
                  set((prev) => ({
                    ...prev,
                    model: {
                      ...prev.model,
                      transform: {
                        ...prev.model.transform,
                        position: next.position,
                        rotationDeg: next.rotationDeg ?? prev.model.transform.rotationDeg,
                        scale: next.scale,
                      },
                    },
                  }))
                }
              />
            </TRNFormSection>
          </section>
        ) : null}

        {panelActive("environment") ? (
          <section className="space-y-2 px-2 pb-3 pt-2 text-[11px] text-zinc-200">
            {showPanelHeading ? (
              <div className="border-b border-emerald-900/25 pb-1 text-[11px] font-semibold text-emerald-100/90">
                Environment
              </div>
            ) : null}
            <TRNFormSection
              title="Environment"
              showHeading={showPanelHeading}
              description={
                showPanelHeading
                  ? "Workspace-style: environment is always applied; IBL toggles intensity. Cubemap presets match the rotation preview toolbar; additional list rows are catalog environments that do not map to a built-in preset path."
                  : undefined
              }
              className="border-0 bg-transparent p-0"
            >
              <div className="flex flex-wrap items-center gap-2 rounded border border-zinc-800/80 bg-zinc-950/30 px-2 py-1.5">
                {resolvedStudioEnvironment != null ? (
                  <>
                    <span className="truncate text-[11px] font-medium text-zinc-200">{resolvedStudioEnvironment.label}</span>
                    <span
                      className={`shrink-0 rounded border px-1 py-px text-[8px] font-semibold uppercase tracking-wide ${studioAssetSourceBadgeClasses(
                        resolvedStudioEnvironment.source,
                      )}`}
                    >
                      {resolvedStudioEnvironment.source}
                    </span>
                    <span className="truncate font-mono text-[9px] text-zinc-500">{resolvedStudioEnvironment.id}</span>
                  </>
                ) : (
                  <span className="truncate text-[11px] text-zinc-400">
                    T3D cubemap:{" "}
                    <span className="font-medium text-zinc-200">
                      {cubemapEnvironmentOptions[clampedCubemapPresetIndex]?.label ?? "—"}
                    </span>
                  </span>
                )}
              </div>

              <TRNFormField
                label="Cubemap preset"
                hint="Same T3D cubemap list as the rotation preview toolbar. Extra rows are Asset Browser environments that do not match a built-in preset path."
              >
                <TRNSelect
                  ariaLabel="Studio environment catalog"
                  sectionTitle="Cubemap preset"
                  size="sm"
                  value={environmentCatalogSelectValue}
                  options={
                    environmentSelectOptions.length > 0
                      ? environmentSelectOptions
                      : [{ value: `${STUDIO_ENVIRONMENT_T3D_PRESET_VALUE_PREFIX}0`, label: "(no presets)" }]
                  }
                  onValueChange={(value) => {
                    const presetIdx = parseT3dPresetEnvironmentSelectValue(value);
                    if (presetIdx != null) {
                      const maps = getEngineEnvironmentCubeMaps();
                      const max = Math.max(0, maps.length - 1);
                      const next = Math.min(Math.max(0, presetIdx), max);
                      set((prev) => ({
                        ...prev,
                        environment: {
                          ...prev.environment,
                          studioAssetId: undefined,
                          presetIndex: next,
                        },
                      }));
                      return;
                    }
                    const picked = getStudioEnvironmentDescriptorById(value, descriptors);
                    if (picked == null) {
                      return;
                    }
                    const maps = getEngineEnvironmentCubeMaps();
                    const idx = findT3DCubemapPresetIndexForStudioEnvironment(maps, picked);
                    set((prev) => ({
                      ...prev,
                      environment: {
                        ...prev.environment,
                        studioAssetId: picked.id,
                        presetIndex: idx ?? prev.environment.presetIndex,
                      },
                    }));
                  }}
                />
              </TRNFormField>

              <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
                <span className="text-xs font-medium text-zinc-200">Use IBL</span>
                <TRNToggleSwitch
                  checked={scene3d.environment.useCubemapIbl}
                  ariaLabel="Toggle IBL reflections"
                  onCheckedChange={(checked) =>
                    set((prev) => ({
                      ...prev,
                      environment: { ...prev.environment, useCubemapIbl: checked },
                    }))
                  }
                />
              </div>

              <TRNParameterSlider valueScrubEnabled
                name="IBL strength"
                value={scene3d.environment.iblStrength}
                min={0}
                max={3}
                step={0.05}
                unit="×"
                valueFormatter={(v) => v.toFixed(2)}
                onChange={(v) =>
                  set((prev) => ({
                    ...prev,
                    environment: { ...prev.environment, iblStrength: v },
                  }))
                }
              />

              <TRNParameterSlider valueScrubEnabled
                name="IBL off strength"
                value={scene3d.environment.iblOffStrengthFrac}
                min={0}
                max={1}
                step={0.01}
                unit=""
                valueFormatter={(v) => v.toFixed(2)}
                onChange={(v) =>
                  set((prev) => ({
                    ...prev,
                    environment: { ...prev.environment, iblOffStrengthFrac: v },
                  }))
                }
              />

              <TRNParameterSlider valueScrubEnabled
                name="Yaw"
                value={scene3d.environment.yawDeg}
                min={-180}
                max={180}
                step={1}
                unit="deg"
                valueFormatter={(v) => `${Math.round(v)}`}
                onChange={(v) =>
                  set((prev) => ({
                    ...prev,
                    environment: { ...prev.environment, yawDeg: v },
                  }))
                }
              />

              <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
                <span className="text-xs font-medium text-zinc-200">Show background</span>
                <TRNToggleSwitch
                  checked={scene3d.environment.showBackgroundTexture}
                  ariaLabel="Toggle environment background"
                  onCheckedChange={(checked) =>
                    set((prev) => ({
                      ...prev,
                      environment: { ...prev.environment, showBackgroundTexture: checked },
                    }))
                  }
                />
              </div>

              <TRNFormField
                label="Fallback background"
                hint="Used when background cubemap is hidden."
              >
                <TRNInlineEdit
                  value={scene3d.environment.backgroundColorHex}
                  onCommit={(next) =>
                    set((prev) => ({
                      ...prev,
                      environment: {
                        ...prev.environment,
                        backgroundColorHex: next.trim(),
                      },
                    }))
                  }
                  inputClassName="font-mono text-[11px]"
                  placeholder="#09090b"
                />
              </TRNFormField>
            </TRNFormSection>
          </section>
        ) : null}

        {panelActive("renderer") ? (
          <section className="space-y-2 px-2 pb-3 pt-2 text-[11px] text-zinc-200">
            {showPanelHeading ? (
              <div className="border-b border-emerald-900/25 pb-1 text-[11px] font-semibold text-emerald-100/90">
                Renderer
              </div>
            ) : null}
            <TRNFormSection
              title="Renderer"
              showHeading={showPanelHeading}
              description={showPanelHeading ? "Tone mapping: ACES, output: sRGB." : undefined}
              className="border-0 bg-transparent p-0"
            >
              <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
                <span className="text-xs font-medium text-zinc-200">Antialias</span>
                <TRNToggleSwitch
                  checked={scene3d.renderer.antialias}
                  ariaLabel="Toggle antialiasing"
                  onCheckedChange={(checked) =>
                    set((prev) => ({
                      ...prev,
                      renderer: { ...prev.renderer, antialias: checked },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
                <span className="text-xs font-medium text-zinc-200">Shadows (studio)</span>
                <TRNToggleSwitch
                  checked={scene3d.renderer.shadowsEnabled}
                  ariaLabel="Toggle shadow maps from studio directionals"
                  onCheckedChange={(checked) =>
                    set((prev) => ({
                      ...prev,
                      renderer: { ...prev.renderer, shadowsEnabled: checked },
                    }))
                  }
                />
              </div>

              {scene3d.renderer.shadowsEnabled ? (
                <>
                  <TRNFormField
                    label="Shadow map size"
                    hint="Higher looks sharper but costs GPU memory and fill-rate."
                  >
                    <TRNSelect
                      ariaLabel="Shadow map resolution"
                      size="sm"
                      value={String(scene3d.renderer.shadowMapSize)}
                      options={SHADOW_MAP_SIZE_OPTIONS}
                      onValueChange={(value) => {
                        const n = Number.parseInt(value, 10);
                        if (!Number.isFinite(n)) {
                          return;
                        }
                        set((prev) => ({
                          ...prev,
                          renderer: { ...prev.renderer, shadowMapSize: n },
                        }));
                      }}
                    />
                  </TRNFormField>

                  <TRNParameterSlider valueScrubEnabled
                    name="Shadow coverage (±)"
                    nameTitle="Orthographic half-extent around the scene; raise for larger models, lower for tighter crops."
                    value={scene3d.renderer.shadowOrthoExtent}
                    min={4}
                    max={120}
                    step={1}
                    unit=""
                    valueFormatter={(v) => String(Math.round(v))}
                    onChange={(v) =>
                      set((prev) => ({
                        ...prev,
                        renderer: { ...prev.renderer, shadowOrthoExtent: v },
                      }))
                    }
                  />

                  <TRNParameterSlider valueScrubEnabled
                    name="Shadow bias"
                    nameTitle="Depth bias on shadow maps; small tweaks reduce acne or gap artifacts."
                    value={scene3d.renderer.shadowBias}
                    min={-0.002}
                    max={0.002}
                    step={0.00002}
                    unit=""
                    valueFormatter={(v) => v.toFixed(5)}
                    onChange={(v) =>
                      set((prev) => ({
                        ...prev,
                        renderer: { ...prev.renderer, shadowBias: v },
                      }))
                    }
                  />

                  <TRNParameterSlider valueScrubEnabled
                    name="Shadow normal bias"
                    nameTitle="Offset along normals when sampling shadows; counter Peter Pan contact shadows vs shading shifts."
                    value={scene3d.renderer.shadowNormalBias}
                    min={0}
                    max={0.15}
                    step={0.002}
                    unit=""
                    valueFormatter={(v) => v.toFixed(3)}
                    onChange={(v) =>
                      set((prev) => ({
                        ...prev,
                        renderer: { ...prev.renderer, shadowNormalBias: v },
                      }))
                    }
                  />
                </>
              ) : null}

              <TRNParameterSlider valueScrubEnabled
                name="Exposure"
                value={scene3d.renderer.toneMappingExposure}
                min={0.05}
                max={2}
                step={0.01}
                unit=""
                valueFormatter={(v) => v.toFixed(2)}
                onChange={(v) =>
                  set((prev) => ({
                    ...prev,
                    renderer: { ...prev.renderer, toneMappingExposure: v },
                  }))
                }
              />

              <TRNParameterSlider valueScrubEnabled
                name="DPR min"
                value={scene3d.renderer.dprMin}
                min={0.5}
                max={3}
                step={0.1}
                unit="×"
                valueFormatter={(v) => v.toFixed(1)}
                onChange={(v) =>
                  set((prev) => ({
                    ...prev,
                    renderer: { ...prev.renderer, dprMin: v },
                  }))
                }
              />
              <TRNParameterSlider valueScrubEnabled
                name="DPR max"
                value={scene3d.renderer.dprMax}
                min={0.5}
                max={3}
                step={0.1}
                unit="×"
                valueFormatter={(v) => v.toFixed(1)}
                onChange={(v) =>
                  set((prev) => ({
                    ...prev,
                    renderer: { ...prev.renderer, dprMax: v },
                  }))
                }
              />

              <TRNFormField label="Clear color" hint="Used when background cubemap is hidden.">
                <TRNColorRingPicker
                  ariaLabel="Clear color"
                  valueHex={scene3d.renderer.clearColorHex}
                  onValueHexChange={(nextHex) =>
                    set((prev) => ({
                      ...prev,
                      renderer: { ...prev.renderer, clearColorHex: nextHex.trim() },
                    }))
                  }
                />
              </TRNFormField>
            </TRNFormSection>
          </section>
        ) : null}

        {panelActive("camera") ? (
          <section className="space-y-2 px-2 pb-3 pt-2 text-[11px] text-zinc-200">
            {showPanelHeading ? (
              <div className="border-b border-emerald-900/25 pb-1 text-[11px] font-semibold text-emerald-100/90">
                Camera
              </div>
            ) : null}
            <TRNFormSection
              title="Camera"
              showHeading={showPanelHeading}
              description={showPanelHeading ? "Unity-style: FOV + transform + look-at target." : undefined}
              className="border-0 bg-transparent p-0"
            >
              <TRNParameterSlider valueScrubEnabled
                name="FOV"
                value={scene3d.camera.fovDeg}
                min={10}
                max={120}
                step={1}
                unit="deg"
                valueFormatter={(v) => String(Math.round(v))}
                onChange={(v) =>
                  set((prev) => ({
                    ...prev,
                    camera: { ...prev.camera, fovDeg: Math.round(v) },
                  }))
                }
              />

              <TRNTransformSection
                title="Transform"
                value={{
                  position: scene3d.camera.transform.position,
                  rotationDeg: { x: 0, y: 0, z: 0 },
                  scale: { x: 1, y: 1, z: 1 },
                  uniformScale: true,
                }}
                onChange={(next) =>
                  set((prev) => ({
                    ...prev,
                    camera: {
                      ...prev.camera,
                      transform: {
                        ...prev.camera.transform,
                        position: next.position,
                      },
                    },
                  }))
                }
                showRotation={false}
                showScale={false}
              />

              <TRNFormField label="LookAt target">
                <TRNTransformSection
                  title="Target"
                  value={{
                    position: scene3d.camera.transform.target,
                    rotationDeg: { x: 0, y: 0, z: 0 },
                    scale: { x: 1, y: 1, z: 1 },
                    uniformScale: true,
                  }}
                  onChange={(next) =>
                    set((prev) => ({
                      ...prev,
                      camera: {
                        ...prev.camera,
                        transform: {
                          ...prev.camera.transform,
                          target: next.position,
                        },
                      },
                    }))
                  }
                  showRotation={false}
                  showScale={false}
                />
              </TRNFormField>

              <TRNParameterSlider valueScrubEnabled
                name="Frame margin"
                value={scene3d.camera.frameMargin}
                min={0.9}
                max={3}
                step={0.02}
                unit="×"
                valueFormatter={(v) => v.toFixed(2)}
                onChange={(v) =>
                  set((prev) => ({
                    ...prev,
                    camera: { ...prev.camera, frameMargin: v },
                  }))
                }
              />
            </TRNFormSection>
          </section>
        ) : null}

        {panelActive("orbit") ? (
          <section className="space-y-2 px-2 pb-3 pt-2 text-[11px] text-zinc-200">
            {showPanelHeading ? (
              <div className="border-b border-emerald-900/25 pb-1 text-[11px] font-semibold text-emerald-100/90">
                Orbit controls
              </div>
            ) : null}
            <TRNFormSection
              title="Controls"
              showHeading={showPanelHeading}
              description={
                showPanelHeading ? "OrbitControls: all parameters apply live to the viewport." : undefined
              }
              className="border-0 bg-transparent p-0"
            >
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
                  <span className="text-xs font-medium text-zinc-200">Damping</span>
                  <TRNToggleSwitch
                    checked={scene3d.controls.enableDamping}
                    ariaLabel="Toggle damping"
                    onCheckedChange={(checked) =>
                      set((prev) => ({
                        ...prev,
                        controls: { ...prev.controls, enableDamping: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
                  <span className="text-xs font-medium text-zinc-200">Rotate</span>
                  <TRNToggleSwitch
                    checked={scene3d.controls.enableRotate}
                    ariaLabel="Toggle rotate"
                    onCheckedChange={(checked) =>
                      set((prev) => ({
                        ...prev,
                        controls: { ...prev.controls, enableRotate: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
                  <span className="text-xs font-medium text-zinc-200">Zoom</span>
                  <TRNToggleSwitch
                    checked={scene3d.controls.enableZoom}
                    ariaLabel="Toggle zoom"
                    onCheckedChange={(checked) =>
                      set((prev) => ({
                        ...prev,
                        controls: { ...prev.controls, enableZoom: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
                  <span className="text-xs font-medium text-zinc-200">Pan</span>
                  <TRNToggleSwitch
                    checked={scene3d.controls.enablePan}
                    ariaLabel="Toggle panning"
                    onCheckedChange={(checked) =>
                      set((prev) => ({
                        ...prev,
                        controls: { ...prev.controls, enablePan: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
                  <span className="text-xs font-medium text-zinc-200">Screen-space pan</span>
                  <TRNToggleSwitch
                    checked={scene3d.controls.screenSpacePanning}
                    ariaLabel="Toggle screen space panning"
                    onCheckedChange={(checked) =>
                      set((prev) => ({
                        ...prev,
                        controls: { ...prev.controls, screenSpacePanning: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
                  <span className="text-xs font-medium text-zinc-200">Zoom to cursor</span>
                  <TRNToggleSwitch
                    checked={scene3d.controls.zoomToCursor}
                    ariaLabel="Toggle zoom to cursor"
                    onCheckedChange={(checked) =>
                      set((prev) => ({
                        ...prev,
                        controls: { ...prev.controls, zoomToCursor: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
                  <span className="text-xs font-medium text-zinc-200">Auto rotate</span>
                  <TRNToggleSwitch
                    checked={scene3d.controls.autoRotate}
                    ariaLabel="Toggle auto rotate"
                    onCheckedChange={(checked) =>
                      set((prev) => ({
                        ...prev,
                        controls: { ...prev.controls, autoRotate: checked },
                      }))
                    }
                  />
                </div>
              </div>

              {scene3d.controls.enableDamping ? (
                <TRNParameterSlider valueScrubEnabled
                  name="Damping factor"
                  value={scene3d.controls.dampingFactor}
                  min={0}
                  max={1}
                  step={0.01}
                  unit=""
                  valueFormatter={(v) => v.toFixed(2)}
                  onChange={(v) =>
                    set((prev) => ({
                      ...prev,
                      controls: { ...prev.controls, dampingFactor: v },
                    }))
                  }
                />
              ) : null}

              <TRNParameterSlider valueScrubEnabled
                name="Rotate speed"
                value={scene3d.controls.rotateSpeed}
                min={0.05}
                max={5}
                step={0.05}
                unit="×"
                valueFormatter={(v) => v.toFixed(2)}
                onChange={(v) =>
                  set((prev) => ({
                    ...prev,
                    controls: { ...prev.controls, rotateSpeed: v },
                  }))
                }
              />
              <TRNParameterSlider valueScrubEnabled
                name="Zoom speed"
                value={scene3d.controls.zoomSpeed}
                min={0.05}
                max={5}
                step={0.05}
                unit="×"
                valueFormatter={(v) => v.toFixed(2)}
                onChange={(v) =>
                  set((prev) => ({
                    ...prev,
                    controls: { ...prev.controls, zoomSpeed: v },
                  }))
                }
              />
              <TRNParameterSlider valueScrubEnabled
                name="Pan speed"
                value={scene3d.controls.panSpeed}
                min={0.05}
                max={5}
                step={0.05}
                unit="×"
                valueFormatter={(v) => v.toFixed(2)}
                onChange={(v) =>
                  set((prev) => ({
                    ...prev,
                    controls: { ...prev.controls, panSpeed: v },
                  }))
                }
              />
              <TRNParameterSlider valueScrubEnabled
                name="Key rotate speed"
                value={scene3d.controls.keyRotateSpeed}
                min={0.05}
                max={5}
                step={0.05}
                unit="×"
                valueFormatter={(v) => v.toFixed(2)}
                onChange={(v) =>
                  set((prev) => ({
                    ...prev,
                    controls: { ...prev.controls, keyRotateSpeed: v },
                  }))
                }
              />
              <TRNParameterSlider valueScrubEnabled
                name="Key pan speed"
                value={scene3d.controls.keyPanSpeed}
                min={1}
                max={40}
                step={0.5}
                unit="px"
                valueFormatter={(v) => v.toFixed(1)}
                onChange={(v) =>
                  set((prev) => ({
                    ...prev,
                    controls: { ...prev.controls, keyPanSpeed: v },
                  }))
                }
              />
              <TRNParameterSlider valueScrubEnabled
                name="Auto rotate speed"
                value={scene3d.controls.autoRotateSpeed}
                min={0}
                max={10}
                step={0.1}
                unit=""
                valueFormatter={(v) => v.toFixed(1)}
                onChange={(v) =>
                  set((prev) => ({
                    ...prev,
                    controls: { ...prev.controls, autoRotateSpeed: v },
                  }))
                }
              />

              <TRNParameterSlider valueScrubEnabled
                name="Min distance"
                value={scene3d.controls.minDistance}
                min={0}
                max={50}
                step={0.05}
                unit=""
                valueFormatter={(v) => v.toFixed(2)}
                onChange={(v) =>
                  set((prev) => ({
                    ...prev,
                    controls: { ...prev.controls, minDistance: v },
                  }))
                }
              />
              <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
                <span className="text-xs font-medium text-zinc-200">Limit max distance</span>
                <TRNToggleSwitch
                  checked={scene3d.controls.maxDistance != null}
                  ariaLabel="Toggle max distance limit"
                  onCheckedChange={(checked) =>
                    set((prev) => ({
                      ...prev,
                      controls: {
                        ...prev.controls,
                        maxDistance: checked ? (prev.controls.maxDistance ?? 100) : null,
                      },
                    }))
                  }
                />
              </div>
              {scene3d.controls.maxDistance != null ? (
                <TRNParameterSlider valueScrubEnabled
                  name="Max distance"
                  value={scene3d.controls.maxDistance}
                  min={0.5}
                  max={500}
                  step={0.5}
                  unit=""
                  valueFormatter={(v) => v.toFixed(1)}
                  onChange={(v) =>
                    set((prev) => ({
                      ...prev,
                      controls: { ...prev.controls, maxDistance: v },
                    }))
                  }
                />
              ) : null}

              <TRNParameterSlider valueScrubEnabled
                name="Min polar angle"
                value={scene3d.controls.minPolarAngleDeg}
                min={0}
                max={180}
                step={1}
                unit="deg"
                valueFormatter={(v) => `${Math.round(v)}`}
                onChange={(v) =>
                  set((prev) => ({
                    ...prev,
                    controls: { ...prev.controls, minPolarAngleDeg: v },
                  }))
                }
              />
              <TRNParameterSlider valueScrubEnabled
                name="Max polar angle"
                value={scene3d.controls.maxPolarAngleDeg}
                min={0}
                max={180}
                step={1}
                unit="deg"
                valueFormatter={(v) => `${Math.round(v)}`}
                onChange={(v) =>
                  set((prev) => ({
                    ...prev,
                    controls: { ...prev.controls, maxPolarAngleDeg: v },
                  }))
                }
              />

              <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
                <span className="text-xs font-medium text-zinc-200">Limit azimuth</span>
                <TRNToggleSwitch
                  checked={
                    scene3d.controls.minAzimuthDeg != null &&
                    scene3d.controls.maxAzimuthDeg != null
                  }
                  ariaLabel="Toggle azimuth limits"
                  onCheckedChange={(checked) =>
                    set((prev) => ({
                      ...prev,
                      controls: {
                        ...prev.controls,
                        minAzimuthDeg: checked ? (prev.controls.minAzimuthDeg ?? -180) : null,
                        maxAzimuthDeg: checked ? (prev.controls.maxAzimuthDeg ?? 180) : null,
                      },
                    }))
                  }
                />
              </div>
              {scene3d.controls.minAzimuthDeg != null &&
              scene3d.controls.maxAzimuthDeg != null ? (
                <>
                  <TRNParameterSlider valueScrubEnabled
                    name="Min azimuth"
                    value={scene3d.controls.minAzimuthDeg}
                    min={-360}
                    max={360}
                    step={1}
                    unit="deg"
                    valueFormatter={(v) => `${Math.round(v)}`}
                    onChange={(v) =>
                      set((prev) => ({
                        ...prev,
                        controls: { ...prev.controls, minAzimuthDeg: v },
                      }))
                    }
                  />
                  <TRNParameterSlider valueScrubEnabled
                    name="Max azimuth"
                    value={scene3d.controls.maxAzimuthDeg}
                    min={-360}
                    max={360}
                    step={1}
                    unit="deg"
                    valueFormatter={(v) => `${Math.round(v)}`}
                    onChange={(v) =>
                      set((prev) => ({
                        ...prev,
                        controls: { ...prev.controls, maxAzimuthDeg: v },
                      }))
                    }
                  />
                </>
              ) : null}

              <TRNParameterSlider valueScrubEnabled
                name="Min target radius"
                value={scene3d.controls.minTargetRadius}
                min={0}
                max={50}
                step={0.05}
                unit=""
                valueFormatter={(v) => v.toFixed(2)}
                onChange={(v) =>
                  set((prev) => ({
                    ...prev,
                    controls: { ...prev.controls, minTargetRadius: v },
                  }))
                }
              />
              <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
                <span className="text-xs font-medium text-zinc-200">Limit max target radius</span>
                <TRNToggleSwitch
                  checked={scene3d.controls.maxTargetRadius != null}
                  ariaLabel="Toggle max target radius limit"
                  onCheckedChange={(checked) =>
                    set((prev) => ({
                      ...prev,
                      controls: {
                        ...prev.controls,
                        maxTargetRadius: checked ? (prev.controls.maxTargetRadius ?? 50) : null,
                      },
                    }))
                  }
                />
              </div>
              {scene3d.controls.maxTargetRadius != null ? (
                <TRNParameterSlider valueScrubEnabled
                  name="Max target radius"
                  value={scene3d.controls.maxTargetRadius}
                  min={0.5}
                  max={200}
                  step={0.5}
                  unit=""
                  valueFormatter={(v) => v.toFixed(1)}
                  onChange={(v) =>
                    set((prev) => ({
                      ...prev,
                      controls: { ...prev.controls, maxTargetRadius: v },
                    }))
                  }
                />
              ) : null}

              <TRNAccordion type="multiple" className="rounded border border-zinc-700/70 bg-zinc-950/40">
                <TRNAccordionItem value="orbit-bindings" className="border-0">
                  <TRNAccordionTrigger className="px-2 py-1 text-[11px] font-medium text-zinc-100 hover:bg-zinc-800/40">
                    Mouse / touch bindings
                  </TRNAccordionTrigger>
                  <TRNAccordionContent
                    className="border-t border-zinc-700/60"
                    innerClassName="space-y-2 px-2 pb-2 pt-2"
                  >
                    <TRNFormField label="Mouse left">
                      <TRNSelect
                        ariaLabel="Mouse left button action"
                        value={scene3d.controls.mouseButtons.left}
                        options={ORBIT_MOUSE_OPTIONS}
                        size="sm"
                        onValueChange={(value) =>
                          set((prev) => ({
                            ...prev,
                            controls: {
                              ...prev.controls,
                              mouseButtons: {
                                ...prev.controls.mouseButtons,
                                left: value as Scene3DConfigV1["controls"]["mouseButtons"]["left"],
                              },
                            },
                          }))
                        }
                      />
                    </TRNFormField>
                    <TRNFormField label="Mouse middle">
                      <TRNSelect
                        ariaLabel="Mouse middle button action"
                        value={scene3d.controls.mouseButtons.middle}
                        options={ORBIT_MOUSE_OPTIONS}
                        size="sm"
                        onValueChange={(value) =>
                          set((prev) => ({
                            ...prev,
                            controls: {
                              ...prev.controls,
                              mouseButtons: {
                                ...prev.controls.mouseButtons,
                                middle: value as Scene3DConfigV1["controls"]["mouseButtons"]["middle"],
                              },
                            },
                          }))
                        }
                      />
                    </TRNFormField>
                    <TRNFormField label="Mouse right">
                      <TRNSelect
                        ariaLabel="Mouse right button action"
                        value={scene3d.controls.mouseButtons.right}
                        options={ORBIT_MOUSE_OPTIONS}
                        size="sm"
                        onValueChange={(value) =>
                          set((prev) => ({
                            ...prev,
                            controls: {
                              ...prev.controls,
                              mouseButtons: {
                                ...prev.controls.mouseButtons,
                                right: value as Scene3DConfigV1["controls"]["mouseButtons"]["right"],
                              },
                            },
                          }))
                        }
                      />
                    </TRNFormField>
                    <TRNFormField label="Touch one finger">
                      <TRNSelect
                        ariaLabel="Touch one finger action"
                        value={scene3d.controls.touches.one}
                        options={ORBIT_TOUCH_ONE_OPTIONS}
                        size="sm"
                        onValueChange={(value) =>
                          set((prev) => ({
                            ...prev,
                            controls: {
                              ...prev.controls,
                              touches: {
                                ...prev.controls.touches,
                                one: value as Scene3DConfigV1["controls"]["touches"]["one"],
                              },
                            },
                          }))
                        }
                      />
                    </TRNFormField>
                    <TRNFormField label="Touch two fingers">
                      <TRNSelect
                        ariaLabel="Touch two fingers action"
                        value={scene3d.controls.touches.two}
                        options={ORBIT_TOUCH_TWO_OPTIONS}
                        size="sm"
                        onValueChange={(value) =>
                          set((prev) => ({
                            ...prev,
                            controls: {
                              ...prev.controls,
                              touches: {
                                ...prev.controls.touches,
                                two: value as Scene3DConfigV1["controls"]["touches"]["two"],
                              },
                            },
                          }))
                        }
                      />
                    </TRNFormField>
                  </TRNAccordionContent>
                </TRNAccordionItem>
              </TRNAccordion>
            </TRNFormSection>
          </section>
        ) : null}

        {panelActive("lights") ? (
          <section className="space-y-2 px-2 pb-3 pt-2 text-[11px] text-zinc-200">
            {showPanelHeading ? (
              <div className="border-b border-emerald-900/25 pb-1 text-[11px] font-semibold text-emerald-100/90">
                Lights
              </div>
            ) : null}
            <TRNFormSection
              title="Lights"
              showHeading={showPanelHeading}
              description={
                showPanelHeading
                  ? "Workspace-style defaults use low ambient and rely on environment lighting."
                  : undefined
              }
              className="border-0 bg-transparent p-0"
            >
              <TRNParameterSlider valueScrubEnabled
                name="Ambient intensity"
                value={scene3d.lights.ambient.intensity}
                min={0}
                max={2}
                step={0.01}
                unit=""
                valueFormatter={(v) => v.toFixed(2)}
                onChange={(v) =>
                  set((prev) => ({
                    ...prev,
                    lights: {
                      ...prev.lights,
                      ambient: { ...prev.lights.ambient, intensity: v },
                    },
                  }))
                }
              />
              <TRNFormField label="Ambient color">
                <TRNColorRingPicker
                  ariaLabel="Ambient color"
                  valueHex={scene3d.lights.ambient.colorHex}
                  onValueHexChange={(nextHex) =>
                    set((prev) => ({
                      ...prev,
                      lights: {
                        ...prev.lights,
                        ambient: { ...prev.lights.ambient, colorHex: nextHex.trim() },
                      },
                    }))
                  }
                />
              </TRNFormField>

              <TRNFormField
                label="Lighting presets"
                hint="Replaces ambient and all directional lights. Helper attach may reset when the list changes."
              >
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      ["ibl-forward", "IBL-forward"],
                      ["key-fill", "Key + fill"],
                      ["soft-studio", "Soft studio"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className="rounded border border-emerald-800/40 bg-emerald-950/25 px-2 py-1 text-[10px] font-medium text-emerald-100/90 hover:bg-emerald-950/45"
                      onClick={() => applyLightsPreset(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </TRNFormField>

              <div className="space-y-2 border-t border-emerald-900/20 pt-2">
                <div className="flex items-center justify-between gap-2">
                  <TRNMenuSectionTitle spacing="labelOnly" className="text-zinc-400">
                    Directional lights
                  </TRNMenuSectionTitle>
                  <button
                    type="button"
                    disabled={scene3d.lights.directionals.length >= MAX_STUDIO_DIRECTIONALS}
                    className="inline-flex items-center gap-1 rounded border border-emerald-800/45 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-medium text-emerald-100/90 hover:bg-emerald-950/50 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() =>
                      set((prev) => {
                        if (prev.lights.directionals.length >= MAX_STUDIO_DIRECTIONALS) {
                          return prev;
                        }
                        const last = prev.lights.directionals[prev.lights.directionals.length - 1]!;
                        const ids = new Set(prev.lights.directionals.map((d) => d.id));
                        let nid = `studio-dir-${prev.lights.directionals.length}`;
                        let suf = 0;
                        while (ids.has(nid)) {
                          nid = `studio-dir-${prev.lights.directionals.length}-${suf}`;
                          suf++;
                        }
                        return {
                          ...prev,
                          lights: {
                            ...prev.lights,
                            directionals: [
                              ...prev.lights.directionals,
                              {
                                id: nid,
                                colorHex: last.colorHex,
                                intensity: Math.min(last.intensity, 2),
                                position: { ...last.position },
                              },
                            ],
                          },
                        };
                      })
                    }
                  >
                    <Plus className="size-3.5" aria-hidden />
                    Add
                  </button>
                </div>
                <p className="text-[10px] leading-snug text-zinc-500">
                  Up to {MAX_STUDIO_DIRECTIONALS} lights · list order sets helper priority (Light 1 is
                  the default attach target).
                </p>

                {scene3d.lights.directionals.map((dl, index) => (
                  <div
                    key={`dir-row-${dl.id}-${index}`}
                    className="space-y-2 rounded border border-zinc-700/65 bg-zinc-950/35 p-2"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-800/60 pb-1.5">
                      <span className="text-[11px] font-semibold text-zinc-200">
                        {directionalLightDisplayLabel(index)}
                      </span>
                      <div
                        className="flex shrink-0 items-center gap-0.5"
                        role="group"
                        aria-label={`${directionalLightDisplayLabel(index)} actions`}
                      >
                        <button
                          type="button"
                          aria-label="Move light up"
                          disabled={index <= 0}
                          className={DIRECTIONAL_LIGHT_TOOL_BTN_CLASS}
                          onClick={() =>
                            set((prev) => {
                              if (index <= 0 || index >= prev.lights.directionals.length) {
                                return prev;
                              }
                              const directionals = [...prev.lights.directionals];
                              const a = directionals[index - 1];
                              const b = directionals[index];
                              if (a == null || b == null) {
                                return prev;
                              }
                              directionals[index - 1] = b;
                              directionals[index] = a;
                              return {
                                ...prev,
                                lights: { ...prev.lights, directionals },
                              };
                            })
                          }
                        >
                          <ArrowUp className="size-3.5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          aria-label="Move light down"
                          disabled={index >= scene3d.lights.directionals.length - 1}
                          className={DIRECTIONAL_LIGHT_TOOL_BTN_CLASS}
                          onClick={() =>
                            set((prev) => {
                              if (
                                index < 0 ||
                                index >= prev.lights.directionals.length - 1
                              ) {
                                return prev;
                              }
                              const directionals = [...prev.lights.directionals];
                              const a = directionals[index];
                              const b = directionals[index + 1];
                              if (a == null || b == null) {
                                return prev;
                              }
                              directionals[index] = b;
                              directionals[index + 1] = a;
                              return {
                                ...prev,
                                lights: { ...prev.lights, directionals },
                              };
                            })
                          }
                        >
                          <ArrowDown className="size-3.5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          aria-label="Duplicate light"
                          disabled={scene3d.lights.directionals.length >= MAX_STUDIO_DIRECTIONALS}
                          className={DIRECTIONAL_LIGHT_TOOL_BTN_CLASS}
                          onClick={() =>
                            set((prev) => {
                              if (prev.lights.directionals.length >= MAX_STUDIO_DIRECTIONALS) {
                                return prev;
                              }
                              const src = prev.lights.directionals[index];
                              if (src == null) {
                                return prev;
                              }
                              const ids = new Set(prev.lights.directionals.map((d) => d.id));
                              let nid = `${src.id}-copy`;
                              let suf = 0;
                              while (ids.has(nid)) {
                                nid = `${src.id}-copy-${suf}`;
                                suf++;
                              }
                              const clone = {
                                ...src,
                                id: nid,
                                position: { ...src.position },
                              };
                              const directionals = [
                                ...prev.lights.directionals.slice(0, index + 1),
                                clone,
                                ...prev.lights.directionals.slice(index + 1),
                              ];
                              return {
                                ...prev,
                                lights: { ...prev.lights, directionals },
                              };
                            })
                          }
                        >
                          <Copy className="size-3.5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          aria-label="Remove light"
                          disabled={scene3d.lights.directionals.length <= 1}
                          className={DIRECTIONAL_LIGHT_TOOL_BTN_CLASS}
                          onClick={() =>
                            set((prev) => {
                              if (prev.lights.directionals.length <= 1) {
                                return prev;
                              }
                              const removed = prev.lights.directionals[index];
                              if (removed == null) {
                                return prev;
                              }
                              const directionals = prev.lights.directionals.filter((_, j) => j !== index);
                              let attach = prev.helpers.directionalLight.attachToDirectionalId;
                              if (attach === removed.id) {
                                attach = null;
                              }
                              return {
                                ...prev,
                                lights: { ...prev.lights, directionals },
                                helpers: {
                                  ...prev.helpers,
                                  directionalLight: {
                                    ...prev.helpers.directionalLight,
                                    attachToDirectionalId: attach,
                                  },
                                },
                              };
                            })
                          }
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </button>
                      </div>
                    </div>

                    <TRNParameterSlider valueScrubEnabled
                      name="Intensity"
                      value={dl.intensity}
                      min={0}
                      max={5}
                      step={0.05}
                      unit=""
                      valueFormatter={(v) => v.toFixed(2)}
                      onChange={(v) =>
                        set((prev) => ({
                          ...prev,
                          lights: {
                            ...prev.lights,
                            directionals: prev.lights.directionals.map((d, j) =>
                              j === index ? { ...d, intensity: v } : d,
                            ),
                          },
                        }))
                      }
                    />
                    <TRNFormField label="Color">
                      <TRNColorRingPicker
                        ariaLabel={`${directionalLightDisplayLabel(index)} color`}
                        valueHex={dl.colorHex}
                        onValueHexChange={(nextHex) =>
                          set((prev) => ({
                            ...prev,
                            lights: {
                              ...prev.lights,
                              directionals: prev.lights.directionals.map((d, j) =>
                                j === index ? { ...d, colorHex: nextHex.trim() } : d,
                              ),
                            },
                          }))
                        }
                      />
                    </TRNFormField>

                    <TRNVector3Field
                      label="Position"
                      value={dl.position}
                      fractionDigits={2}
                      pointerScrubEnabled
                      showAxisLocks={false}
                      onChange={(next: TRNVector3) =>
                        set((prev) => ({
                          ...prev,
                          lights: {
                            ...prev.lights,
                            directionals: prev.lights.directionals.map((d, j) =>
                              j === index ? { ...d, position: next } : d,
                            ),
                          },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </TRNFormSection>
          </section>
        ) : null}

        {panelActive("helpers") ? (
          <section className="space-y-2 px-2 pb-3 pt-2 text-[11px] text-zinc-200">
            {showPanelHeading ? (
              <div className="border-b border-emerald-900/25 pb-1 text-[11px] font-semibold text-emerald-100/90">
                Helpers
              </div>
            ) : null}
            <TRNFormSection
              title="Scene helpers"
              showHeading={showPanelHeading}
              description={
                showPanelHeading
                  ? "Orientation overlays for the node preview. Grid colors match Three.js GridHelper (axis emphasis vs cells)."
                  : undefined
              }
              className="border-0 bg-transparent p-0"
            >
              <TRNAccordion
                type="multiple"
                defaultValue={["helpers-grid"]}
                className="rounded border border-zinc-700/70 bg-zinc-950/40"
              >
                <TRNAccordionItem value="helpers-grid" className="border-0 border-b border-zinc-800/70">
                  <TRNAccordionTrigger className="px-2 py-1 text-[11px] font-medium text-zinc-100 hover:bg-zinc-800/40">
                    Grid
                  </TRNAccordionTrigger>
                  <TRNAccordionContent
                    className="border-t border-zinc-800/60 bg-zinc-950/30 px-2 pb-2 pt-1.5"
                    innerClassName="space-y-2"
                  >
                    <div className="flex items-center justify-between rounded border border-zinc-700/80 px-2 py-1">
                      <span className="text-xs text-zinc-300">Visible</span>
                      <TRNToggleSwitch
                        checked={scene3d.helpers.grid.enabled}
                        ariaLabel="Toggle grid"
                        onCheckedChange={(checked) =>
                          set((prev) => ({
                            ...prev,
                            helpers: {
                              ...prev.helpers,
                              grid: { ...prev.helpers.grid, enabled: checked },
                            },
                          }))
                        }
                      />
                    </div>
                    <TRNParameterSlider valueScrubEnabled
                      name="Size"
                      value={scene3d.helpers.grid.size}
                      min={1}
                      max={80}
                      step={1}
                      unit=""
                      valueFormatter={(v) => String(Math.round(v))}
                      onChange={(v) =>
                        set((prev) => ({
                          ...prev,
                          helpers: {
                            ...prev.helpers,
                            grid: { ...prev.helpers.grid, size: v },
                          },
                        }))
                      }
                    />
                    <TRNParameterSlider valueScrubEnabled
                      name="Divisions"
                      value={scene3d.helpers.grid.divisions}
                      min={2}
                      max={256}
                      step={1}
                      unit=""
                      valueFormatter={(v) => String(Math.round(v))}
                      onChange={(v) =>
                        set((prev) => ({
                          ...prev,
                          helpers: {
                            ...prev.helpers,
                            grid: { ...prev.helpers.grid, divisions: Math.round(v) },
                          },
                        }))
                      }
                    />
                    <TRNParameterSlider valueScrubEnabled
                      name="Opacity"
                      value={scene3d.helpers.grid.opacity}
                      min={0}
                      max={1}
                      step={0.05}
                      unit=""
                      valueFormatter={(v) => v.toFixed(2)}
                      onChange={(v) =>
                        set((prev) => ({
                          ...prev,
                          helpers: {
                            ...prev.helpers,
                            grid: { ...prev.helpers.grid, opacity: v },
                          },
                        }))
                      }
                    />
                    <TRNParameterSlider valueScrubEnabled
                      name="Y position"
                      value={scene3d.helpers.grid.y}
                      min={-5}
                      max={5}
                      step={0.05}
                      unit=""
                      valueFormatter={(v) => v.toFixed(2)}
                      onChange={(v) =>
                        set((prev) => ({
                          ...prev,
                          helpers: {
                            ...prev.helpers,
                            grid: { ...prev.helpers.grid, y: v },
                          },
                        }))
                      }
                    />
                    <TRNFormField label="Axis lines (center)">
                      <TRNColorRingPicker
                        ariaLabel="Axis lines color"
                        valueHex={scene3d.helpers.grid.colorCenterHex}
                        onValueHexChange={(nextHex) =>
                          set((prev) => ({
                            ...prev,
                            helpers: {
                              ...prev.helpers,
                              grid: {
                                ...prev.helpers.grid,
                                colorCenterHex: nextHex.trim(),
                              },
                            },
                          }))
                        }
                      />
                    </TRNFormField>
                    <TRNFormField label="Cell lines">
                      <TRNColorRingPicker
                        ariaLabel="Cell lines color"
                        valueHex={scene3d.helpers.grid.colorGridHex}
                        onValueHexChange={(nextHex) =>
                          set((prev) => ({
                            ...prev,
                            helpers: {
                              ...prev.helpers,
                              grid: {
                                ...prev.helpers.grid,
                                colorGridHex: nextHex.trim(),
                              },
                            },
                          }))
                        }
                      />
                    </TRNFormField>
                  </TRNAccordionContent>
                </TRNAccordionItem>

                <TRNAccordionItem value="helpers-axes" className="border-0 border-b border-zinc-800/70">
                  <TRNAccordionTrigger className="px-2 py-1 text-[11px] font-medium text-zinc-100 hover:bg-zinc-800/40">
                    World axes
                  </TRNAccordionTrigger>
                  <TRNAccordionContent
                    className="border-t border-zinc-800/60 bg-zinc-950/30 px-2 pb-2 pt-1.5"
                    innerClassName="space-y-2"
                  >
                    <div className="flex items-center justify-between rounded border border-zinc-700/80 px-2 py-1">
                      <span className="text-xs text-zinc-300">Visible</span>
                      <TRNToggleSwitch
                        checked={scene3d.helpers.axes.enabled}
                        ariaLabel="Toggle axes helper"
                        onCheckedChange={(checked) =>
                          set((prev) => ({
                            ...prev,
                            helpers: {
                              ...prev.helpers,
                              axes: { ...prev.helpers.axes, enabled: checked },
                            },
                          }))
                        }
                      />
                    </div>
                    <TRNParameterSlider valueScrubEnabled
                      name="Length"
                      value={scene3d.helpers.axes.length}
                      min={0.1}
                      max={15}
                      step={0.1}
                      unit=""
                      valueFormatter={(v) => v.toFixed(1)}
                      onChange={(v) =>
                        set((prev) => ({
                          ...prev,
                          helpers: {
                            ...prev.helpers,
                            axes: { ...prev.helpers.axes, length: v },
                          },
                        }))
                      }
                    />
                    <TRNParameterSlider valueScrubEnabled
                      name="Opacity"
                      value={scene3d.helpers.axes.opacity}
                      min={0}
                      max={1}
                      step={0.05}
                      unit=""
                      valueFormatter={(v) => v.toFixed(2)}
                      onChange={(v) =>
                        set((prev) => ({
                          ...prev,
                          helpers: {
                            ...prev.helpers,
                            axes: { ...prev.helpers.axes, opacity: v },
                          },
                        }))
                      }
                    />
                  </TRNAccordionContent>
                </TRNAccordionItem>

                <TRNAccordionItem value="helpers-camera" className="border-0 border-b border-zinc-800/70">
                  <TRNAccordionTrigger className="px-2 py-1 text-[11px] font-medium text-zinc-100 hover:bg-zinc-800/40">
                    Camera frustum
                  </TRNAccordionTrigger>
                  <TRNAccordionContent
                    className="border-t border-zinc-800/60 bg-zinc-950/30 px-2 pb-2 pt-1.5"
                    innerClassName="space-y-2"
                  >
                    <p className="text-[10px] leading-snug text-zinc-500">
                      Wireframe for the orbit preview camera (not embedded GLB cameras).
                    </p>
                    <div className="flex items-center justify-between rounded border border-zinc-700/80 px-2 py-1">
                      <span className="text-xs text-zinc-300">Visible</span>
                      <TRNToggleSwitch
                        checked={scene3d.helpers.camera.enabled}
                        ariaLabel="Toggle camera helper"
                        onCheckedChange={(checked) =>
                          set((prev) => ({
                            ...prev,
                            helpers: {
                              ...prev.helpers,
                              camera: { enabled: checked },
                            },
                          }))
                        }
                      />
                    </div>
                  </TRNAccordionContent>
                </TRNAccordionItem>

                <TRNAccordionItem value="helpers-dirlight" className="border-0">
                  <TRNAccordionTrigger className="px-2 py-1 text-[11px] font-medium text-zinc-100 hover:bg-zinc-800/40">
                    Directional light
                  </TRNAccordionTrigger>
                  <TRNAccordionContent
                    className="border-t border-zinc-800/60 bg-zinc-950/30 px-2 pb-2 pt-1.5"
                    innerClassName="space-y-2"
                  >
                    <p className="text-[10px] leading-snug text-zinc-500">
                      Follows the directional light list in the Lights panel (order and intensity).
                    </p>
                    <TRNFormField
                      label="Attach helper to"
                      hint="Auto uses Light 1. Reorder lights in the Lights panel to change priority."
                    >
                      <TRNSelect
                        ariaLabel="Directional helper attach target"
                        size="sm"
                        value={scene3d.helpers.directionalLight.attachToDirectionalId ?? ""}
                        options={directionalAttachOptions}
                        onValueChange={(value) =>
                          set((prev) => ({
                            ...prev,
                            helpers: {
                              ...prev.helpers,
                              directionalLight: {
                                ...prev.helpers.directionalLight,
                                attachToDirectionalId:
                                  value.trim().length > 0 ? value.trim() : null,
                              },
                            },
                          }))
                        }
                      />
                    </TRNFormField>
                    <div className="flex items-center justify-between rounded border border-zinc-700/80 px-2 py-1">
                      <span className="text-xs text-zinc-300">Visible</span>
                      <TRNToggleSwitch
                        checked={scene3d.helpers.directionalLight.enabled}
                        ariaLabel="Toggle directional light helper"
                        onCheckedChange={(checked) =>
                          set((prev) => ({
                            ...prev,
                            helpers: {
                              ...prev.helpers,
                              directionalLight: {
                                ...prev.helpers.directionalLight,
                                enabled: checked,
                              },
                            },
                          }))
                        }
                      />
                    </div>
                    <TRNParameterSlider valueScrubEnabled
                      name="Helper plane size"
                      value={scene3d.helpers.directionalLight.planeSize}
                      min={0.1}
                      max={8}
                      step={0.05}
                      unit=""
                      valueFormatter={(v) => v.toFixed(2)}
                      onChange={(v) =>
                        set((prev) => ({
                          ...prev,
                          helpers: {
                            ...prev.helpers,
                            directionalLight: {
                              ...prev.helpers.directionalLight,
                              planeSize: v,
                            },
                          },
                        }))
                      }
                    />
                  </TRNAccordionContent>
                </TRNAccordionItem>
              </TRNAccordion>
            </TRNFormSection>
          </section>
        ) : null}
    </>
  );

  if (singlePanel != null) {
    return (
      <div
        className={
          chromeless
            ? "min-h-0 min-w-0 text-[11px] text-zinc-200"
            : "min-h-0 min-w-0 overflow-hidden rounded-md border border-emerald-900/25 bg-zinc-950/45"
        }
      >
        {panelScroll}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden rounded-md border border-emerald-900/25 bg-linear-to-br from-emerald-950/15 via-zinc-950/55 to-zinc-950/85 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.06)]">
      <TRNInspectorIconRail
        ariaLabel="3D scene inspector sections"
        items={RAIL_ENTRIES}
        activeId={activeRailPanel}
        onActiveChange={onRailPanelChange}
        tone="emerald"
      />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-zinc-950/35">
        {panelScroll}
      </div>
    </div>
  );
}

