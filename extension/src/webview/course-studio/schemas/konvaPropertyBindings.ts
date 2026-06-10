import { z } from "zod";
import { diagramBindingSchema, numericPropSchema } from "./diagramBindingSchemas";

const textPropBindingSchema = z
  .object({
    binding: diagramBindingSchema,
    prefix: z.string().optional(),
    suffix: z.string().optional(),
  })
  .strict();

export type KonvaTextPropBindingV1 = z.infer<typeof textPropBindingSchema>;

export const konvaPropertyBindingValueSchema = z.union([
  numericPropSchema,
  textPropBindingSchema,
  diagramBindingSchema,
]);

export type KonvaPropertyBindingValueV1 = z.infer<typeof konvaPropertyBindingValueSchema>;

/** shapeId → property name → binding spec */
export const konvaPropertyBindingsSchema = z.record(
  z.string(),
  z.record(z.string(), konvaPropertyBindingValueSchema),
);

export type KonvaPropertyBindingsV1 = z.infer<typeof konvaPropertyBindingsSchema>;

export const KONVA_NUMERIC_BINDABLE_PROPERTIES = [
  "x",
  "y",
  "width",
  "height",
  "radius",
  "x1",
  "y1",
  "x2",
  "y2",
  "rotation",
  "opacity",
  "strokeWidth",
  "fontSize",
] as const;

export type KonvaNumericBindableProperty = (typeof KONVA_NUMERIC_BINDABLE_PROPERTIES)[number];

export const KONVA_TEXT_BINDABLE_PROPERTY = "text" as const;

export function konvaPropertyBindingsHasContent(
  bindings: KonvaPropertyBindingsV1 | undefined,
): boolean {
  if (bindings == null) {
    return false;
  }
  return Object.values(bindings).some((entry) => Object.keys(entry).length > 0);
}

export function isKonvaNumericPropertyBinding(
  value: KonvaPropertyBindingValueV1,
): value is z.infer<typeof numericPropSchema> {
  if (typeof value === "number") {
    return true;
  }
  return (
    typeof value === "object" &&
    value != null &&
    "mode" in value &&
    !("prefix" in value) &&
    !("suffix" in value)
  );
}

export function isKonvaTextPropertyBinding(
  value: KonvaPropertyBindingValueV1,
): value is KonvaTextPropBindingV1 {
  return (
    typeof value === "object" &&
    value != null &&
    "binding" in value &&
    !("mode" in value)
  );
}

export function isKonvaGateBinding(
  value: KonvaPropertyBindingValueV1,
): value is z.infer<typeof diagramBindingSchema> {
  return typeof value === "object" && value != null && "path" in value && !("binding" in value);
}
