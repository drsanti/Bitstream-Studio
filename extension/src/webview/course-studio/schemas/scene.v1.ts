import { z } from "zod";
import { DEFAULT_LINK_HEALTH_POLICY, linkHealthPolicySchema } from "./linkHealth";
import {
  diagram3dNodeSchema,
  type Diagram3dCameraV1,
  type Diagram3dNodeV1,
} from "./diagram.v1";

const sceneCameraSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]).optional(),
  fov: z.number().positive().optional(),
});

export const sceneEnvironmentSettingsSchema = z.object({
  backgroundColor: z.string().optional(),
  showGrid: z.boolean().optional(),
  contactShadows: z.boolean().optional(),
  environmentPresetIndex: z.number().int().min(0).optional(),
  useIbl: z.boolean().optional(),
  showBackground: z.boolean().optional(),
});

export type SceneEnvironmentSettingsV1 = z.infer<typeof sceneEnvironmentSettingsSchema>;

export const sceneV1Schema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  title: z.string().optional(),
  linkHealth: linkHealthPolicySchema.default(DEFAULT_LINK_HEALTH_POLICY),
  camera: sceneCameraSchema.optional(),
  nodes: z.array(diagram3dNodeSchema).default([]),
  settings: sceneEnvironmentSettingsSchema.optional(),
});

export type SceneV1 = z.infer<typeof sceneV1Schema>;
export type { Diagram3dCameraV1, Diagram3dNodeV1 };

export const DEFAULT_SCENE_ENVIRONMENT: SceneEnvironmentSettingsV1 = {
  backgroundColor: "#0a0a0f",
  showGrid: true,
  contactShadows: true,
  environmentPresetIndex: 0,
  useIbl: true,
  showBackground: false,
};

export function parseSceneV1(raw: unknown): SceneV1 {
  return sceneV1Schema.parse(raw);
}

export function resolveSceneEnvironmentSettings(
  settings?: SceneEnvironmentSettingsV1,
): Required<SceneEnvironmentSettingsV1> {
  return {
    ...DEFAULT_SCENE_ENVIRONMENT,
    ...settings,
  };
}
