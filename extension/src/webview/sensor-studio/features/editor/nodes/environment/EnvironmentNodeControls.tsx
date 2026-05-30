import type { Edge } from "@xyflow/react";
import { getEngineEnvironmentCubeMaps } from "@/engine-environment/t3dEngineEnvironment";
import { useCallback, useMemo } from "react";
import {
  TRNParameterSlider,
  TRNSelect,
  TRNToggleSwitch,
  type TRNSelectOption,
} from "../../../../../ui/TRN";
import { useStudioAssetDescriptors } from "../../../asset-browser/useStudioAssetDescriptors";
import {
  findT3DCubemapPresetIndexForStudioEnvironment,
  getStudioEnvironmentDescriptorById,
  listStudioEnvironmentDescriptors,
  parseT3dPresetEnvironmentSelectValue,
  rotationInspectorEnvironmentCatalogSelectValue,
  STUDIO_ENVIRONMENT_T3D_PRESET_VALUE_PREFIX,
} from "../../../asset-browser/studio-environment-scene-bindings";
import {
  environmentModulationHandleIsWired,
  readEnvironmentInputSocketVisibility,
} from "./environment-node-inputs";
import {
  flowWireEnvironmentFromNodeDefaultConfig,
  type FlowWireEnvironmentV1,
} from "./flow-wire-environment";

export type EnvironmentNodeControlsProps = {
  defaultConfig: Record<string, unknown>;
  onUpdateField: (key: string, value: unknown) => void;
  /**
   * Flow node card: when a modulation pin is exposed for a field, omit that manual row to save space
   * and avoid duplicate affordances. Inspector should omit this flag so all parameters stay visible.
   */
  compactForFlowNodeBody?: boolean;
  /** Used with inspector wiring: disable a field when its pin has an incoming edge (wire wins). */
  edges?: readonly Edge[] | undefined;
  nodeId?: string;
};

/**
 * Manual fields for the Environment node. With **`compactForFlowNodeBody`**, rows for fields that
 * have an exposed modulation pin are omitted (canvas only). The inspector omits that flag and keeps
 * every row; optional **`edges` + `nodeId`** disable fields that are actively driven by a wire.
 */
export function EnvironmentNodeControls(props: EnvironmentNodeControlsProps) {
  const { defaultConfig, onUpdateField, compactForFlowNodeBody = false, edges, nodeId } = props;
  const { descriptors } = useStudioAssetDescriptors();

  const vis = useMemo(
    () => readEnvironmentInputSocketVisibility(defaultConfig),
    [defaultConfig],
  );

  const wire = useMemo(
    () => flowWireEnvironmentFromNodeDefaultConfig(defaultConfig),
    [defaultConfig],
  );

  const omitRow = (handleId: keyof typeof vis) =>
    compactForFlowNodeBody && vis[handleId] === true;

  const showUseIbl = !omitRow("useCubemapIbl");
  const showBackground = !omitRow("showBackgroundTexture");
  const showIblStrength = !omitRow("iblStrength");
  const showIblOff = !omitRow("iblOffStrengthFrac");
  const showYaw = !omitRow("yawDeg");

  const iblWired =
    !compactForFlowNodeBody &&
    nodeId != null &&
    environmentModulationHandleIsWired(edges, nodeId, "useCubemapIbl", vis);
  const bgWired =
    !compactForFlowNodeBody &&
    nodeId != null &&
    environmentModulationHandleIsWired(edges, nodeId, "showBackgroundTexture", vis);
  const iblStrWired =
    !compactForFlowNodeBody &&
    nodeId != null &&
    environmentModulationHandleIsWired(edges, nodeId, "iblStrength", vis);
  const iblOffWired =
    !compactForFlowNodeBody &&
    nodeId != null &&
    environmentModulationHandleIsWired(edges, nodeId, "iblOffStrengthFrac", vis);
  const yawWired =
    !compactForFlowNodeBody &&
    nodeId != null &&
    environmentModulationHandleIsWired(edges, nodeId, "yawDeg", vis);

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
    const sid = wire.studioAssetId?.trim() ?? "";
    const bound = sid.length > 0 ? getStudioEnvironmentDescriptorById(sid, descriptors) : null;
    const boundMapsToT3d =
      bound != null && findT3DCubemapPresetIndexForStudioEnvironment(maps, bound) != null;
    const appendBound =
      bound != null && boundMapsToT3d && !catalogOnly.some((d) => d.id === bound.id);
    const catalogRows = appendBound ? [...catalogOnly, bound] : catalogOnly;
    return [...t3dRows, ...catalogRows.map((d) => ({ value: d.id, label: d.label }))];
  }, [descriptors, wire.studioAssetId]);

  const selectValue = useMemo(
    () =>
      rotationInspectorEnvironmentCatalogSelectValue(
        { presetIndex: wire.presetIndex, studioAssetId: wire.studioAssetId },
        descriptors,
        getEngineEnvironmentCubeMaps(),
      ),
    [descriptors, wire.presetIndex, wire.studioAssetId],
  );

  const applyCubemapSelect = useCallback(
    (value: string) => {
      const presetIdx = parseT3dPresetEnvironmentSelectValue(value);
      if (presetIdx != null) {
        const maps = getEngineEnvironmentCubeMaps();
        const max = Math.max(0, maps.length - 1);
        const next = Math.min(Math.max(0, presetIdx), max);
        onUpdateField("studioAssetId", "");
        onUpdateField("presetIndex", next);
        return;
      }
      const picked = getStudioEnvironmentDescriptorById(value, descriptors);
      if (picked == null) {
        return;
      }
      const maps = getEngineEnvironmentCubeMaps();
      const idx = findT3DCubemapPresetIndexForStudioEnvironment(maps, picked);
      const cur = flowWireEnvironmentFromNodeDefaultConfig(defaultConfig);
      onUpdateField("studioAssetId", picked.id);
      onUpdateField("presetIndex", idx ?? cur.presetIndex);
    },
    [defaultConfig, descriptors, onUpdateField],
  );

  const patchWire = useCallback(
    (patch: Partial<FlowWireEnvironmentV1>) => {
      for (const [k, v] of Object.entries(patch)) {
        onUpdateField(k, v);
      }
    },
    [onUpdateField],
  );

  return (
    <div className="space-y-2">
      <div className="min-w-0">
        <div className="mb-0.5 block text-[11px] font-medium text-zinc-400">Cubemap / HDRI</div>
        <TRNSelect
          ariaLabel="Environment cubemap preset"
          sectionTitle="Cubemap preset"
          size="sm"
          value={selectValue}
          options={
            environmentSelectOptions.length > 0
              ? environmentSelectOptions
              : [{ value: `${STUDIO_ENVIRONMENT_T3D_PRESET_VALUE_PREFIX}0`, label: "(no presets)" }]
          }
          onValueChange={applyCubemapSelect}
          panelClassName="scrollbar-hide max-h-60 overflow-y-auto"
        />
      </div>

      {showUseIbl ? (
        <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
          <span className="text-xs font-medium text-zinc-200">Use IBL</span>
          <span title={iblWired ? "Driven by a connected wire" : undefined}>
            <TRNToggleSwitch
              checked={wire.useCubemapIbl}
              ariaLabel="Toggle IBL reflections"
              disabled={iblWired}
              onCheckedChange={(checked) => patchWire({ useCubemapIbl: checked })}
            />
          </span>
        </div>
      ) : null}

      {showBackground ? (
        <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
          <span className="text-xs font-medium text-zinc-200">Background texture</span>
          <span title={bgWired ? "Driven by a connected wire" : undefined}>
            <TRNToggleSwitch
              checked={wire.showBackgroundTexture}
              ariaLabel="Toggle background cubemap texture"
              disabled={bgWired}
              onCheckedChange={(checked) => patchWire({ showBackgroundTexture: checked })}
            />
          </span>
        </div>
      ) : null}

      {showIblStrength ? (
        <TRNParameterSlider
          valueScrubEnabled
          name="IBL strength"
          nameTitle={iblStrWired ? "Driven by a connected wire" : undefined}
          value={wire.iblStrength}
          min={0}
          max={3}
          step={0.05}
          unit="×"
          valueFormatter={(v) => v.toFixed(2)}
          disabled={iblStrWired}
          onChange={(v) => patchWire({ iblStrength: v })}
        />
      ) : null}

      {showIblOff ? (
        <TRNParameterSlider
          valueScrubEnabled
          name="IBL off strength"
          nameTitle={iblOffWired ? "Driven by a connected wire" : undefined}
          value={wire.iblOffStrengthFrac}
          min={0}
          max={1}
          step={0.01}
          unit=""
          valueFormatter={(v) => v.toFixed(2)}
          disabled={iblOffWired}
          onChange={(v) => patchWire({ iblOffStrengthFrac: v })}
        />
      ) : null}

      {showYaw ? (
        <TRNParameterSlider
          valueScrubEnabled
          name="Environment yaw"
          nameTitle={yawWired ? "Driven by a connected wire" : undefined}
          value={wire.yawDeg}
          min={-180}
          max={180}
          step={1}
          unit="°"
          valueFormatter={(v) => `${Math.round(v)}°`}
          disabled={yawWired}
          onChange={(v) => patchWire({ yawDeg: v })}
        />
      ) : null}
    </div>
  );
}
