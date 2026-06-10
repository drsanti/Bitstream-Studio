import { z } from "zod";
import { DEFAULT_LINK_HEALTH_POLICY, linkHealthPolicySchema } from "./linkHealth";
import {
  diagramKonvaFreeformSchema,
  diagramLegacyExcalidrawFreeformSchema,
  type DiagramKonvaFreeformV1,
} from "./diagramFreeform";
import { migrateLegacyFreeformToKonva } from "../runtime/diagram/migrateLegacyFreeform";
import { normalizeDiagramLayers } from "./normalizeDiagramV1";
export {
  diagramBindingSchema,
  mapOpSchema,
  numericPropSchema,
  textPropSchema,
  type DiagramBindingV1,
  type MapOpV1,
  type NumericPropV1,
  type TextPropBindingV1,
  type TextPropV1,
} from "./diagramBindingSchemas";
import {
  diagramBindingSchema,
  mapOpSchema,
  numericPropSchema,
  textPropSchema,
  type DiagramBindingV1,
  type MapOpV1,
  type NumericPropV1,
} from "./diagramBindingSchemas";

export const vec3PropSchema = z.object({
  x: numericPropSchema.optional(),
  y: numericPropSchema.optional(),
  z: numericPropSchema.optional(),
});

export type Vec3PropV1 = z.infer<typeof vec3PropSchema>;

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

const diagram3dHexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const diagram3dMaterialKindSchema = z.enum([
  "standard",
  "physical",
  "basic",
  "lambert",
  "phong",
  "toon",
]);

export type Diagram3dMaterialKindV1 = z.infer<typeof diagram3dMaterialKindSchema>;

export const diagram3dMaterialSchema = z.object({
  presetId: z.string().min(1).optional(),
  kind: diagram3dMaterialKindSchema.optional(),
  color: diagram3dHexColorSchema.optional(),
  emissive: diagram3dHexColorSchema.optional(),
  emissiveIntensity: z.number().min(0).max(2).optional(),
  metalness: z.number().min(0).max(1).optional(),
  roughness: z.number().min(0).max(1).optional(),
  clearcoat: z.number().min(0).max(1).optional(),
  clearcoatRoughness: z.number().min(0).max(1).optional(),
  transmission: z.number().min(0).max(1).optional(),
  ior: z.number().min(1).max(2.5).optional(),
  thickness: z.number().min(0).max(5).optional(),
  wireframe: z.boolean().optional(),
  mapUrl: z.string().optional(),
  normalMapUrl: z.string().optional(),
  roughnessMapUrl: z.string().optional(),
  metalnessMapUrl: z.string().optional(),
  emissiveMapUrl: z.string().optional(),
  aoMapUrl: z.string().optional(),
  /** `all` tints every mesh material; `byName` targets one GLB material slot. */
  materialTarget: z.enum(["all", "byName"]).optional(),
  materialName: z.string().min(1).optional(),
  mapRepeat: z.tuple([z.number().positive(), z.number().positive()]).optional(),
});

export type Diagram3dMaterialV1 = z.infer<typeof diagram3dMaterialSchema>;

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

export const diagram3dProceduralModelIdSchema = z.enum([
  "procedural-box",
  "procedural-sphere",
  "procedural-cylinder",
  "procedural-cone",
  "procedural-plane",
  "procedural-torus",
  "procedural-capsule",
  "procedural-ring",
  "procedural-icosahedron",
  "procedural-torus-knot",
  "procedural-pcb",
  "procedural-axis-triad",
  "procedural-gyro-gimbal",
]);

export const diagram3dCatalogModelIdSchema = z
  .string()
  .regex(/^catalog:.+/, "Catalog model ids must start with catalog:");

export const diagram3dModelIdSchema = z.union([
  diagram3dProceduralModelIdSchema,
  diagram3dCatalogModelIdSchema,
]);

export type Diagram3dProceduralModelIdV1 = z.infer<typeof diagram3dProceduralModelIdSchema>;
export type Diagram3dModelIdV1 = z.infer<typeof diagram3dModelIdSchema>;

const quaternionBindingsSchema = z.object({
  qw: diagramBindingSchema,
  qx: diagramBindingSchema,
  qy: diagramBindingSchema,
  qz: diagramBindingSchema,
});

export const diagram3dRotationSchema = z.union([
  z.tuple([z.number(), z.number(), z.number()]),
  z.object({
    kind: z.literal("euler"),
    pitch: numericPropSchema,
    yaw: numericPropSchema.optional(),
    roll: numericPropSchema,
  }),
  z.object({
    kind: z.literal("quaternion"),
    bindings: quaternionBindingsSchema,
  }),
]);

export type Diagram3dRotationV1 = z.infer<typeof diagram3dRotationSchema>;

const diagram3dCameraSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]).optional(),
  fov: z.number().positive().optional(),
});

export type Diagram3dCameraV1 = z.infer<typeof diagram3dCameraSchema>;

const diagram3dModelNodeSchema = baseNodeSchema.extend({
  type: z.literal("model"),
  modelId: diagram3dModelIdSchema,
  position: vec3PropSchema.optional(),
  rotation: diagram3dRotationSchema.optional(),
  scale: vec3PropSchema.optional(),
  material: diagram3dMaterialSchema.optional(),
  animationClip: z.string().min(1).optional(),
  animationLoop: z.boolean().optional(),
  animationPlaying: z.boolean().optional(),
});

const diagram3dGroupNodeSchema: z.ZodType<Diagram3dGroupNodeV1> = baseNodeSchema.extend({
  type: z.literal("group3d"),
  position: vec3PropSchema.optional(),
  rotation: diagram3dRotationSchema.optional(),
  scale: vec3PropSchema.optional(),
  children: z.lazy(() => z.array(diagram3dNodeSchema)),
});

export const diagram3dNodeSchema: z.ZodType<Diagram3dNodeV1> = z.discriminatedUnion("type", [
  diagram3dModelNodeSchema,
  diagram3dGroupNodeSchema,
]);

export type Diagram3dModelNodeV1 = z.infer<typeof diagram3dModelNodeSchema>;
export type Diagram3dGroupNodeV1 = {
  id: string;
  type: "group3d";
  opacity?: number;
  visible?: boolean;
  position?: Vec3PropV1;
  rotation?: Diagram3dRotationV1;
  scale?: Vec3PropV1;
  children: Diagram3dNodeV1[];
};
export type Diagram3dNodeV1 = Diagram3dModelNodeV1 | Diagram3dGroupNodeV1;

const diagram2dLayerSchema = z.object({
  kind: z.literal("2d"),
  nodes: z.array(diagramNodeSchema),
});

const diagram3dLayerSchema = z.object({
  kind: z.literal("3d"),
  nodes: z.array(diagram3dNodeSchema).min(1),
  camera: diagram3dCameraSchema.optional(),
});

export const diagramLayerSchema = z.discriminatedUnion("kind", [
  diagram2dLayerSchema,
  diagram3dLayerSchema,
]);

export type DiagramLayerV1 = z.infer<typeof diagramLayerSchema>;

const diagramV1BaseSchema = z.object({
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
  nodes: z.array(diagramNodeSchema).optional(),
  layers: z.array(diagramLayerSchema).min(1).optional(),
  freeform: z
    .union([diagramKonvaFreeformSchema, diagramLegacyExcalidrawFreeformSchema])
    .optional(),
});

export const diagramV1InputSchema = diagramV1BaseSchema.superRefine((value, ctx) => {
  const hasNodes = value.nodes != null && value.nodes.length > 0;
  const hasPopulatedLayers =
    value.layers?.some((layer) => layer.nodes.length > 0) ?? false;
  const hasFreeform =
    value.freeform?.engine === "konva" || value.freeform?.engine === "excalidraw";
  if (!hasNodes && !hasPopulatedLayers && !hasFreeform) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Diagram must include `nodes`, `layers`, or `freeform` (Konva live canvas).",
      path: ["nodes"],
    });
  }
});

export type DiagramV1Input = z.infer<typeof diagramV1InputSchema>;

export type DiagramV1 = {
  version: 1;
  id: string;
  title?: string;
  linkHealth: z.infer<typeof linkHealthPolicySchema>;
  viewBox: [number, number, number, number];
  /** Canonical layer stack — 2D SVG and optional 3D R3F. */
  layers: DiagramLayerV1[];
  /** Top-level 2D nodes — mirrors the `2d` layer for maintainer code paths. */
  nodes: DiagramNodeV1[];
  /** Optional Konva live canvas (Draw tab + content embed). */
  freeform?: DiagramKonvaFreeformV1;
};

export type StyleTokenV1 = z.infer<typeof styleTokenSchema>;
export type ConnectorCurveV1 = z.infer<typeof connectorCurveSchema>;

/** @deprecated Use diagramV1InputSchema — kept for tests that expect strict legacy shape. */
export const diagramV1Schema = diagramV1BaseSchema.extend({
  nodes: z.array(diagramNodeSchema).min(1),
});

function normalizeParsedFreeform(
  freeform: z.infer<typeof diagramV1BaseSchema>["freeform"],
): DiagramKonvaFreeformV1 | undefined {
  if (freeform == null) {
    return undefined;
  }
  if (freeform.engine === "konva") {
    return diagramKonvaFreeformSchema.parse(freeform);
  }
  return migrateLegacyFreeformToKonva(freeform as Record<string, unknown>);
}

export function parseDiagramV1(raw: unknown): DiagramV1 {
  const parsed = diagramV1InputSchema.parse(raw);
  const { layers, nodes } = normalizeDiagramLayers(parsed);
  return {
    version: parsed.version,
    id: parsed.id,
    title: parsed.title,
    linkHealth: parsed.linkHealth,
    viewBox: parsed.viewBox,
    layers,
    nodes,
    freeform: normalizeParsedFreeform(parsed.freeform),
  };
}
