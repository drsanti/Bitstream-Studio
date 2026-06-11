import { z } from "zod";

import { isValidStudioSensorSourceKey } from "../../live/resolve-sensor-source-key";

const studioPortTypeEnum = z.enum([
  "number",
  "boolean",
  "string",
  "event",
  "vector3",
  "quaternion",
  "environment",
  "camera",
  "glbAnimation",
  "transform",
  "fog",
  "studioLight",
  "postProcessing",
  "contactShadows",
  "particleEmitter",
  "audioBus",
  "videoBus",
  "videoTexture",
  "physicsScene",
  "physicsCollider",
  "physicsBody",
  "physicsJoint",
  "physicsSpawner",
  "dashboardWidget",
  "dashboardTheme",
  "dashboardTab",
  "material",
  "mesh",
]);

const catalogNodeBaseSchema = z.object({
  id: z.string().min(1),
  category: z.enum([
    "sensor",
    "input",
    "audio",
    "transform",
    "logic",
    "scene",
    "output",
    "utility",
    "generator",
    "dashboard",
  ]),
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
  defaultVisible: z.boolean(),
  defaultConfig: z.record(z.string(), z.unknown()),
  inputPorts: z
    .array(
      z.object({
        id: z.string().min(1),
        portType: studioPortTypeEnum,
        label: z.string().min(1),
      }),
    )
    .optional(),
  outputPorts: z
    .array(
      z.object({
        id: z.string().min(1),
        portType: studioPortTypeEnum,
        label: z.string().min(1),
      }),
    )
    .optional(),
});

export const nodeCatalogSchema = z
  .object({
    configVersion: z.number().int().positive(),
    updatedAt: z.string().datetime(),
    payload: z.object({
      nodes: z.array(catalogNodeBaseSchema),
    }),
  })
  .superRefine((root, ctx) => {
    root.payload.nodes.forEach((node, index) => {
      if (node.id !== "sensor-input") {
        return;
      }
      const raw = node.defaultConfig.sourceKey;
      if (raw === undefined || raw === null) {
        return;
      }
      if (typeof raw !== "string") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "sensor-input defaultConfig.sourceKey must be a string when present",
          path: ["payload", "nodes", index, "defaultConfig", "sourceKey"],
        });
        return;
      }
      if (!isValidStudioSensorSourceKey(raw)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid sensor-input sourceKey "${raw.trim()}"`,
          path: ["payload", "nodes", index, "defaultConfig", "sourceKey"],
        });
      }
    });
  });
