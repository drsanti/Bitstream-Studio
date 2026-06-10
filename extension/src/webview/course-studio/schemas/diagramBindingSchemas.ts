import { z } from "zod";

export const mapOpSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("scale"),
    inMin: z.number(),
    inMax: z.number(),
    outMin: z.number(),
    outMax: z.number(),
  }),
  z.object({
    op: z.literal("clamp"),
    min: z.number(),
    max: z.number(),
  }),
]);

export type MapOpV1 = z.infer<typeof mapOpSchema>;

export const diagramBindingSchema = z.object({
  path: z.string().min(1),
  map: z.array(mapOpSchema).optional(),
  format: z.string().optional(),
  unit: z.string().optional(),
  /** Gyro (°/s↔rad/s) and fusion Euler (°↔rad) display; wire values stay in degrees. */
  angularUnit: z.enum(["deg", "rad"]).optional(),
  /** Temperature paths (wire °C): Celsius or Fahrenheit display. */
  temperatureUnit: z.enum(["celsius", "fahrenheit"]).optional(),
  /** Altitude paths (wire m): meters or feet display. */
  altitudeUnit: z.enum(["m", "ft"]).optional(),
  fallback: z.union([z.number(), z.string()]).optional(),
});

export type DiagramBindingV1 = z.infer<typeof diagramBindingSchema>;

const numericPropBindingSchema = z
  .object({
    base: z.number().optional(),
    mode: z.enum(["absolute", "add"]).default("absolute"),
    binding: diagramBindingSchema,
  })
  .strict();

export const numericPropSchema = z.union([z.number(), numericPropBindingSchema]);

export type NumericPropV1 = z.infer<typeof numericPropSchema>;

const textPropBindingSchema = z.object({
  binding: diagramBindingSchema,
  prefix: z.string().optional(),
  suffix: z.string().optional(),
});

export type TextPropBindingV1 = z.infer<typeof textPropBindingSchema>;

export const textPropSchema = z.union([z.string(), textPropBindingSchema]);

export type TextPropV1 = z.infer<typeof textPropSchema>;
