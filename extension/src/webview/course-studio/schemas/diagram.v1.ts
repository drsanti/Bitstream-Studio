import { z } from "zod";
import { DEFAULT_LINK_HEALTH_POLICY, linkHealthPolicySchema } from "./linkHealth";

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
  fallback: z.union([z.number(), z.string()]).optional(),
});

export type DiagramBindingV1 = z.infer<typeof diagramBindingSchema>;

const numericPropSchema = z.union([
  z.number(),
  z.object({
    base: z.number().optional(),
    mode: z.enum(["absolute", "add"]).default("absolute"),
    binding: diagramBindingSchema,
  }),
]);

const textPropSchema = z.union([
  z.string(),
  z.object({
    binding: diagramBindingSchema,
    prefix: z.string().optional(),
    suffix: z.string().optional(),
  }),
]);

export const styleTokenSchema = z.enum([
  "card",
  "plain",
  "accent-amber",
  "accent-cyan",
  "axis-x",
  "axis-y",
  "axis-z",
  "muted",
]);

const baseNodeSchema = z.object({
  id: z.string().min(1),
  opacity: z.number().min(0).max(1).optional(),
  visible: z.boolean().optional(),
});

const rectNodeSchema = baseNodeSchema.extend({
  type: z.literal("rect"),
  x: numericPropSchema,
  y: numericPropSchema,
  width: z.number().positive(),
  height: z.number().positive(),
  rx: z.number().min(0).optional(),
  fill: styleTokenSchema.optional(),
  stroke: styleTokenSchema.optional(),
  strokeWidth: z.number().min(0).optional(),
  label: z.string().optional(),
});

const ellipseNodeSchema = baseNodeSchema.extend({
  type: z.literal("ellipse"),
  cx: numericPropSchema,
  cy: numericPropSchema,
  rx: z.number().positive(),
  ry: z.number().positive(),
  fill: styleTokenSchema.optional(),
  stroke: styleTokenSchema.optional(),
  strokeWidth: z.number().min(0).optional(),
});

const connectorCurveSchema = z.object({
  cx: z.number(),
  cy: z.number(),
});

const lineNodeSchema = baseNodeSchema.extend({
  type: z.literal("line"),
  x1: z.number(),
  y1: z.number(),
  x2: z.number(),
  y2: z.number(),
  curve: connectorCurveSchema.optional(),
  stroke: styleTokenSchema.optional(),
  strokeWidth: z.number().min(0).optional(),
  strokeDasharray: z.string().optional(),
  flowWhen: diagramBindingSchema.optional(),
  highlightWhen: diagramBindingSchema.optional(),
  highlightStroke: styleTokenSchema.optional(),
});

const arrowNodeSchema = baseNodeSchema.extend({
  type: z.literal("arrow"),
  x1: z.number(),
  y1: z.number(),
  x2: z.number(),
  y2: z.number(),
  curve: connectorCurveSchema.optional(),
  stroke: styleTokenSchema.optional(),
  strokeWidth: z.number().min(0).optional(),
  flowWhen: diagramBindingSchema.optional(),
  highlightWhen: diagramBindingSchema.optional(),
  highlightStroke: styleTokenSchema.optional(),
});

const textNodeSchema = baseNodeSchema.extend({
  type: z.literal("text"),
  x: z.number(),
  y: z.number(),
  content: textPropSchema,
  fontSize: z.number().positive().optional(),
  fontWeight: z.union([z.literal(400), z.literal(600), z.literal(700)]).optional(),
  fill: styleTokenSchema.optional(),
  textAnchor: z.enum(["start", "middle", "end"]).optional(),
});

const groupNodeSchema = baseNodeSchema.extend({
  type: z.literal("group"),
  children: z.lazy(() => z.array(diagramNodeSchema)),
});

export const diagramNodeSchema: z.ZodType<DiagramNodeV1> = z.discriminatedUnion("type", [
  rectNodeSchema,
  ellipseNodeSchema,
  lineNodeSchema,
  arrowNodeSchema,
  textNodeSchema,
  groupNodeSchema,
]);

export type RectNodeV1 = z.infer<typeof rectNodeSchema>;
export type EllipseNodeV1 = z.infer<typeof ellipseNodeSchema>;
export type LineNodeV1 = z.infer<typeof lineNodeSchema>;
export type ArrowNodeV1 = z.infer<typeof arrowNodeSchema>;
export type TextNodeV1 = z.infer<typeof textNodeSchema>;
export type GroupNodeV1 = z.infer<typeof groupNodeSchema>;
export type DiagramNodeV1 =
  | RectNodeV1
  | EllipseNodeV1
  | LineNodeV1
  | ArrowNodeV1
  | TextNodeV1
  | GroupNodeV1;

export const diagramV1Schema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  title: z.string().optional(),
  linkHealth: linkHealthPolicySchema.default(DEFAULT_LINK_HEALTH_POLICY),
  viewBox: z.tuple([
    z.number(),
    z.number(),
    z.number().positive(),
    z.number().positive(),
  ]),
  nodes: z.array(diagramNodeSchema).min(1),
});

export type DiagramV1 = z.infer<typeof diagramV1Schema>;
export type StyleTokenV1 = z.infer<typeof styleTokenSchema>;
export type ConnectorCurveV1 = z.infer<typeof connectorCurveSchema>;

export function parseDiagramV1(raw: unknown): DiagramV1 {
  return diagramV1Schema.parse(raw);
}
