import { getEngineEnvironmentCubeMaps } from "@/engine-environment/t3dEngineEnvironment";

export function buildCourseSceneCubemapSelectOptions(): { value: string; label: string }[] {
  return getEngineEnvironmentCubeMaps().map((preset, index) => ({
    value: String(index),
    label: preset.title,
  }));
}
