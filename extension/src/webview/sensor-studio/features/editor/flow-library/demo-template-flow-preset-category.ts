import type { StudioDemoTemplateId } from "../store/flow-editor.store";
import type { StudioFlowPresetCategory } from "./studio-flow-preset-file";

const CATEGORY_BY_TEMPLATE: Record<StudioDemoTemplateId, StudioFlowPresetCategory> = {
  "signal-chain": "telemetry",
  "basic-indicator": "telemetry",
  "gauge-monitor": "telemetry",
  "bmi270-gauge-z": "telemetry",
  "vector-magnitude": "utility",
  "audio-lab": "audio",
  "audio-file-playback": "audio",
  "audio-oscillator-tone": "audio",
  "audio-machine-rpm": "audio",
  "audio-machine-map-range": "audio",
  "audio-machine-fault-lab": "audio",
  "camera-video-texture": "vision",
  "stage-camera-vision": "stage",
  "stage-scene-output": "stage",
  "primitives-playground": "stage",
  "dashboard-button-led": "custom",
  "dashboard-controls-demo": "custom",
  "material-glb-drives": "scene",
  "rotation-glb-anim": "animation",
  "animation-clip-blend": "animation",
  "animation-mix-demo": "animation",
  "part-spin-demo": "animation",
};

export function demoTemplateFlowPresetCategory(
  templateId: StudioDemoTemplateId,
): StudioFlowPresetCategory {
  return CATEGORY_BY_TEMPLATE[templateId] ?? "custom";
}

export function officialFlowPresetIdForTemplate(templateId: StudioDemoTemplateId): string {
  return `official-${templateId}`;
}

export function officialFlowPresetFileName(templateId: StudioDemoTemplateId): string {
  return `${templateId}.trn-flow-preset.json`;
}

const OFFICIAL_FLOW_PRESET_ID_PREFIX = "official-";

export function isOfficialFlowPresetId(presetId: string): boolean {
  return presetId.startsWith(OFFICIAL_FLOW_PRESET_ID_PREFIX);
}

export function templateIdFromOfficialFlowPresetId(
  presetId: string,
): StudioDemoTemplateId | null {
  if (!isOfficialFlowPresetId(presetId)) {
    return null;
  }
  const templateId = presetId.slice(OFFICIAL_FLOW_PRESET_ID_PREFIX.length);
  return templateId in CATEGORY_BY_TEMPLATE ? (templateId as StudioDemoTemplateId) : null;
}
