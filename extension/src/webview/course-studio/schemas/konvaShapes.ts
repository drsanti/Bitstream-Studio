import { z } from "zod";
import { konvaConnectorFieldsSchema } from "./konvaConnector";

const konvaShapeBaseSchema = z.object({
  id: z.string().min(1),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().min(0).optional(),
  opacity: z.number().min(0).max(1).optional(),
  rotation: z.number().optional(),
});

const konvaCornerRadiiSchema = z.tuple([
  z.number().min(0),
  z.number().min(0),
  z.number().min(0),
  z.number().min(0),
]);

export const konvaRectShapeSchema = konvaShapeBaseSchema.extend({
  type: z.literal("rect"),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  /** Uniform corner radius when all corners match. */
  cornerRadius: z.number().min(0).optional(),
  /** Per-corner radii: top-left, top-right, bottom-right, bottom-left. */
  cornerRadii: konvaCornerRadiiSchema.optional(),
});

export const konvaDiamondShapeSchema = konvaShapeBaseSchema.extend({
  type: z.literal("diamond"),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
});

export const konvaCircleShapeSchema = konvaShapeBaseSchema.extend({
  type: z.literal("circle"),
  x: z.number(),
  y: z.number(),
  radius: z.number().positive(),
});

export const konvaTextShapeSchema = konvaShapeBaseSchema.extend({
  type: z.literal("text"),
  x: z.number(),
  y: z.number(),
  text: z.string(),
  fontSize: z.number().positive().optional(),
});

export const konvaLineShapeSchema = konvaShapeBaseSchema
  .merge(konvaConnectorFieldsSchema)
  .extend({
    type: z.literal("line"),
    x1: z.number(),
    y1: z.number(),
    x2: z.number(),
    y2: z.number(),
  });

export const konvaArrowShapeSchema = konvaShapeBaseSchema
  .merge(konvaConnectorFieldsSchema)
  .extend({
    type: z.literal("arrow"),
    x1: z.number(),
    y1: z.number(),
    x2: z.number(),
    y2: z.number(),
    pointerLength: z.number().positive().optional(),
    pointerWidth: z.number().positive().optional(),
  });

export type KonvaLineShapeV1 = z.infer<typeof konvaLineShapeSchema>;
export type KonvaArrowShapeV1 = z.infer<typeof konvaArrowShapeSchema>;
export type KonvaConnectorShapeV1 = KonvaLineShapeV1 | KonvaArrowShapeV1;

export type KonvaGroupShapeV1 = {
  id: string;
  type: "group";
  x: number;
  y: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  rotation?: number;
  children: KonvaShapeV1[];
};

export type KonvaShapeV1 =
  | z.infer<typeof konvaRectShapeSchema>
  | z.infer<typeof konvaDiamondShapeSchema>
  | z.infer<typeof konvaCircleShapeSchema>
  | z.infer<typeof konvaTextShapeSchema>
  | KonvaLineShapeV1
  | KonvaArrowShapeV1
  | KonvaGroupShapeV1;

export const konvaGroupShapeSchema: z.ZodType<KonvaGroupShapeV1> = konvaShapeBaseSchema.extend({
  type: z.literal("group"),
  x: z.number(),
  y: z.number(),
  children: z.lazy(() => z.array(konvaShapeSchema)),
});

export const konvaShapeSchema: z.ZodType<KonvaShapeV1> = z.lazy(() =>
  z.discriminatedUnion("type", [
    konvaRectShapeSchema,
    konvaDiamondShapeSchema,
    konvaCircleShapeSchema,
    konvaTextShapeSchema,
    konvaLineShapeSchema,
    konvaArrowShapeSchema,
    konvaGroupShapeSchema,
  ]),
);

export function isKonvaConnectorShape(
  shape: KonvaShapeV1,
): shape is KonvaConnectorShapeV1 {
  return shape.type === "line" || shape.type === "arrow";
}

export function isKonvaGroupShape(shape: KonvaShapeV1): shape is KonvaGroupShapeV1 {
  return shape.type === "group";
}

export const konvaCanvasViewSchema = z.object({
  width: z.number().positive().default(800),
  height: z.number().positive().default(600),
  background: z.string().default("#000000"),
});

export type KonvaCanvasViewV1 = z.infer<typeof konvaCanvasViewSchema>;
