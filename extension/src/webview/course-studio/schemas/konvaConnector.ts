import { z } from "zod";

export const konvaConnectorPathModeSchema = z.enum([
  "straight",
  "quadratic",
  "spline",
  "bezier",
  "tension",
  "orthogonal",
]);

export type KonvaConnectorPathMode = z.infer<typeof konvaConnectorPathModeSchema>;

export const konvaConnectorPointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export type KonvaConnectorPoint = z.infer<typeof konvaConnectorPointSchema>;

export const konvaConnectorAnchorKindSchema = z.enum([
  "auto",
  "n",
  "s",
  "e",
  "w",
  "ne",
  "nw",
  "se",
  "sw",
  "center",
]);

export type KonvaConnectorAnchorKind = z.infer<typeof konvaConnectorAnchorKindSchema>;

export const konvaConnectorAttachSchema = z.object({
  shapeId: z.string().min(1),
  anchor: konvaConnectorAnchorKindSchema.optional(),
});

export type KonvaConnectorAttach = z.infer<typeof konvaConnectorAttachSchema>;

export const konvaBezierKnotSchema = z.object({
  x: z.number(),
  y: z.number(),
  cpIn: konvaConnectorPointSchema.optional(),
  cpOut: konvaConnectorPointSchema.optional(),
});

export type KonvaBezierKnot = z.infer<typeof konvaBezierKnotSchema>;

export const konvaConnectorCurveSchema = z.object({
  cx: z.number(),
  cy: z.number(),
});

export type KonvaConnectorCurve = z.infer<typeof konvaConnectorCurveSchema>;

/** Shared connector geometry fields for Konva line and arrow shapes. */
export const konvaConnectorFieldsSchema = z.object({
  pathMode: konvaConnectorPathModeSchema.optional(),
  curve: konvaConnectorCurveSchema.optional(),
  waypoints: z.array(konvaConnectorPointSchema).optional(),
  knots: z.array(konvaBezierKnotSchema).optional(),
  vertices: z.array(konvaConnectorPointSchema).optional(),
  tension: z.number().min(0).max(1).optional(),
  startAttach: konvaConnectorAttachSchema.optional(),
  endAttach: konvaConnectorAttachSchema.optional(),
});

export type KonvaConnectorFields = z.infer<typeof konvaConnectorFieldsSchema>;
