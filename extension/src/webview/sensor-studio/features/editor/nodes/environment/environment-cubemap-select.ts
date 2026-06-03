import { getEngineEnvironmentCubeMaps } from "@/engine-environment/t3dEngineEnvironment";
import type { TRNSelectOption } from "../../../../ui/TRN";
import type { StudioAssetDescriptor } from "../../../asset-browser/studio-asset.types";
import {
  findT3DCubemapPresetIndexForStudioEnvironment,
  getStudioEnvironmentDescriptorById,
  listStudioEnvironmentDescriptors,
  parseT3dPresetEnvironmentSelectValue,
  STUDIO_ENVIRONMENT_T3D_PRESET_VALUE_PREFIX,
} from "../../../asset-browser/studio-environment-scene-bindings";
import {
  flowWireEnvironmentFromNodeDefaultConfig,
  type FlowWireEnvironmentV1,
} from "./flow-wire-environment";

export type EnvironmentCubemapWireFields = Pick<
  FlowWireEnvironmentV1,
  "presetIndex" | "studioAssetId"
>;

/** TRNSelect options — same list as Environment node card / inspector. */
export function buildEnvironmentCubemapSelectOptions(
  descriptors: readonly StudioAssetDescriptor[],
  wire: EnvironmentCubemapWireFields,
): TRNSelectOption[] {
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
}

/** Resolve a TRNSelect value to Environment / Scene3D cubemap fields. */
export function resolveEnvironmentCubemapSelectValue(
  value: string,
  descriptors: readonly StudioAssetDescriptor[],
  currentPresetIndex: number,
): EnvironmentCubemapWireFields | null {
  const presetIdx = parseT3dPresetEnvironmentSelectValue(value);
  if (presetIdx != null) {
    const maps = getEngineEnvironmentCubeMaps();
    const max = Math.max(0, maps.length - 1);
    const next = Math.min(Math.max(0, presetIdx), max);
    return { studioAssetId: undefined, presetIndex: next };
  }
  const picked = getStudioEnvironmentDescriptorById(value, descriptors);
  if (picked == null) {
    return null;
  }
  const maps = getEngineEnvironmentCubeMaps();
  const idx = findT3DCubemapPresetIndexForStudioEnvironment(maps, picked);
  return {
    studioAssetId: picked.id,
    presetIndex: idx ?? currentPresetIndex,
  };
}

/** Apply select value to Environment node `defaultConfig` fields (via `onUpdateField`). */
export function applyEnvironmentCubemapSelectToNodeConfig(
  value: string,
  descriptors: readonly StudioAssetDescriptor[],
  defaultConfig: Record<string, unknown>,
  onUpdateField: (key: string, value: unknown) => void,
): void {
  const cur = flowWireEnvironmentFromNodeDefaultConfig(defaultConfig);
  const resolved = resolveEnvironmentCubemapSelectValue(value, descriptors, cur.presetIndex);
  if (resolved == null) {
    return;
  }
  if (resolved.studioAssetId == null || resolved.studioAssetId.length === 0) {
    onUpdateField("studioAssetId", "");
    onUpdateField("presetIndex", resolved.presetIndex);
    return;
  }
  onUpdateField("studioAssetId", resolved.studioAssetId);
  onUpdateField("presetIndex", resolved.presetIndex);
}
