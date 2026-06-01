import { getEngineEnvironmentCubeMaps } from "@/engine-environment/t3dEngineEnvironment";
import type { StudioAssetDescriptor } from "../../../asset-browser/studio-asset.types";
import { resolveStudioEnvironmentDescriptorForUI } from "../../../asset-browser/studio-environment-scene-bindings";
import type { FlowWireCameraV1 } from "../camera-view/flow-wire-camera";
import type { FlowWireEnvironmentV1 } from "../environment/flow-wire-environment";
import { truncateSocketStringPreview } from "./truncate-socket-string";

export function resolveEnvironmentWireSocketLabel(
  wire: FlowWireEnvironmentV1,
  descriptors: readonly StudioAssetDescriptor[],
): string {
  const maps = getEngineEnvironmentCubeMaps();
  const desc = resolveStudioEnvironmentDescriptorForUI(
    { presetIndex: wire.presetIndex, studioAssetId: wire.studioAssetId },
    maps,
    descriptors,
  );
  if (desc != null) {
    return truncateSocketStringPreview(desc.label);
  }
  const max = Math.max(0, maps.length - 1);
  const idx = Math.min(Math.max(0, Math.round(wire.presetIndex)), max);
  const preset = maps[idx];
  if (preset?.title != null && preset.title.length > 0) {
    return truncateSocketStringPreview(preset.title);
  }
  return "Environment";
}

export function resolveCameraWireSocketLabel(wire: FlowWireCameraV1): string {
  const fov = Math.round(wire.fovDeg);
  return `${fov}° FOV`;
}
