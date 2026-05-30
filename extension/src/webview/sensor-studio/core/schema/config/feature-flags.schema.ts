import { z } from "zod";

export const featureFlagsSchema = z.object({
  configVersion: z.number().int().positive(),
  updatedAt: z.string().datetime(),
  payload: z.object({
    enableSparklineNode: z.boolean(),
    enableDebugValueNode: z.boolean(),
    enableInspectorAdvancedPanel: z.boolean(),
    enableRuntimeTraceOverlay: z.boolean(),
  }),
});
