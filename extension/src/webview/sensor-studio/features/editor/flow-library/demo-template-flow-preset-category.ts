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
