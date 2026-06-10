import { z } from "zod";
import { konvaCanvasViewSchema, konvaShapeSchema } from "./konvaShapes";
import { konvaPropertyBindingsSchema } from "./konvaPropertyBindings";

export const diagramKonvaFreeformSchema = z.object({
  engine: z.literal("konva"),
  shapes: z.array(konvaShapeSchema).default([]),
  view: konvaCanvasViewSchema.optional(),
  propertyBindings: konvaPropertyBindingsSchema.optional(),
});

export type DiagramKonvaFreeformV1 = z.infer<typeof diagramKonvaFreeformSchema>;

export const diagramLegacyExcalidrawFreeformSchema = z.object({
  engine: z.literal("excalidraw"),
  elements: z.array(z.record(z.string(), z.unknown())).default([]),
  appState: z.record(z.string(), z.unknown()).optional(),
  files: z.record(z.string(), z.unknown()).optional(),
  propertyBindings: konvaPropertyBindingsSchema.optional(),
});

export function diagramHasKonvaFreeform(diagram: {
  freeform?: { engine?: string } | null;
}): boolean {
  return diagram.freeform?.engine === "konva";
}

export function konvaFreeformHasContent(diagram: {
  freeform?: DiagramKonvaFreeformV1 | null;
}): boolean {
  return (diagram.freeform?.shapes?.length ?? 0) > 0;
}
