import { z } from "zod";

export const runtimeDefaultsSchema = z.object({
  configVersion: z.number().int().positive(),
  updatedAt: z.string().datetime(),
  payload: z.object({
    tickRateHz: z.number().positive(),
    maxBufferedSamples: z.number().int().positive(),
    defaultSmoothingAlpha: z.number().min(0).max(1),
    defaultThresholdValue: z.number(),
    maxHistoryPoints: z.number().int().positive(),
    nodePaletteLayout: z
      .enum(["classic", "sectioned", "two-line", "accordion"])
      .default("sectioned"),
  }),
});
