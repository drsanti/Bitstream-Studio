import type { Diagram3dModelIdV1, Diagram3dNodeV1 } from "../schemas/diagram.v1";
import {
  createDefaultDiagram3dGroupNode,
  createDefaultDiagram3dModelNode,
  defaultGyroRateEulerRotation,
} from "../runtime/diagram/diagram3dNodeMutations";

export type CourseScene3dAddPresetId =
  | "pcb"
  | "box"
  | "axis-triad"
  | "gyro-gimbal"
  | "group";

export type CourseScene3dAddPreset = {
  id: CourseScene3dAddPresetId;
  label: string;
  keywords?: string;
  factory: () => Diagram3dNodeV1;
};

function nextScene3dNodeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`;
}

export const COURSE_SCENE_3D_ADD_PRESETS: CourseScene3dAddPreset[] = [
  {
    id: "pcb",
    label: "PCB model",
    keywords: "pcb bmi orientation board",
    factory: () => createDefaultDiagram3dModelNode(nextScene3dNodeId("model")),
  },
  {
    id: "box",
    label: "Box model",
    keywords: "procedural cube primitive",
    factory: () => ({
      id: nextScene3dNodeId("box"),
      type: "model",
      modelId: "procedural-box",
    }),
  },
  {
    id: "axis-triad",
    label: "Axis triad",
    keywords: "axes xyz orientation",
    factory: () => ({
      id: nextScene3dNodeId("triad"),
      type: "model",
      modelId: "procedural-axis-triad",
    }),
  },
  {
    id: "gyro-gimbal",
    label: "Gyro gimbal",
    keywords: "gyro omega live",
    factory: () => ({
      id: nextScene3dNodeId("gimbal"),
      type: "model",
      modelId: "procedural-gyro-gimbal",
      rotation: defaultGyroRateEulerRotation(),
    }),
  },
  {
    id: "group",
    label: "Group",
    keywords: "parent hierarchy",
    factory: () => createDefaultDiagram3dGroupNode(nextScene3dNodeId("group")),
  },
];

export function buildCourseScene3dAddPresetNode(presetId: CourseScene3dAddPresetId): Diagram3dNodeV1 {
  const preset = COURSE_SCENE_3D_ADD_PRESETS.find((entry) => entry.id === presetId);
  if (preset == null) {
    throw new Error(`Unknown scene add preset: ${presetId}`);
  }
  return preset.factory();
}

export function buildCourseScene3dCatalogModelNode(modelId: Diagram3dModelIdV1): Diagram3dNodeV1 {
  return {
    id: nextScene3dNodeId("catalog"),
    type: "model",
    modelId,
  };
}
