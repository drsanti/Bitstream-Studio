import { z } from "zod";
import { coerceGridPlacementV1 } from "./placement";
import { pageMetaSchema } from "./pageMeta";
import { course3dSceneIdSchema, DEFAULT_COURSE_3D_SCENE_ID } from "./course3dScene";

const placementSchema = z.object({
  column: z.number().int().min(1).max(48),
  row: z.number().int().min(1).max(200),
  columnSpan: z.number().int().min(1).max(48),
  rowSpan: z.number().int().min(1).max(200),
});

const headingBlockSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("heading"),
  placement: placementSchema,
  eyebrow: z.string().optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
});

const calloutBlockSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["callout-info", "callout-warning", "callout-danger", "callout-tip"]),
  placement: placementSchema,
  title: z.string().optional(),
  body: z.string().min(1),
  icon: z.string().optional(),
});

const markdownBlockSchema = z
  .object({
    id: z.string().min(1),
    kind: z.literal("markdown"),
    placement: placementSchema,
    markdown: z.string().optional(),
    /** Bundled filename under `course-studio/content/` (e.g. `pilot-bmi-accel-theory.theory.md`). */
    src: z.string().min(1).optional(),
  })
  .refine((data) => (data.markdown != null && data.markdown.length > 0) || data.src != null, {
    message: "markdown block requires inline markdown or src",
  });

const cardBlockSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("card"),
  placement: placementSchema,
  title: z.string().optional(),
  body: z.string().min(1),
});

const liveMetricBlockSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("live-metric"),
  placement: placementSchema,
  title: z.string().default("Live tri-axis"),
});

const diagram2dBlockSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("diagram-2d"),
  placement: placementSchema,
  diagramId: z.string().min(1),
  caption: z.string().optional(),
});

const diagram3dBlockSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("diagram-3d"),
  placement: placementSchema,
  sceneId: course3dSceneIdSchema.default(DEFAULT_COURSE_3D_SCENE_ID),
  caption: z.string().optional(),
});

export const pageBlockSchema = z.discriminatedUnion("kind", [
  headingBlockSchema,
  calloutBlockSchema,
  markdownBlockSchema,
  cardBlockSchema,
  liveMetricBlockSchema,
  diagram2dBlockSchema,
  diagram3dBlockSchema,
]);

export type PageBlockV1 = z.infer<typeof pageBlockSchema>;

const gridSchema = z.object({
  columns: z.number().int().min(1).max(48).default(12),
  rowHeightPx: z.number().int().min(24).max(200).default(48),
  gapPx: z.number().int().min(0).max(64).default(12),
  paddingPx: z.number().int().min(0).max(128).default(32),
});

export const pageV1Schema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  title: z.string().min(1),
  meta: pageMetaSchema.optional(),
  grid: gridSchema,
  blocks: z.array(pageBlockSchema).min(1),
});

export type PageV1 = z.infer<typeof pageV1Schema>;
export type PageGridV1 = z.infer<typeof gridSchema>;

export function parsePageV1(raw: unknown): PageV1 {
  const parsed = pageV1Schema.parse(raw);
  return {
    ...parsed,
    blocks: parsed.blocks.map((block) => ({
      ...block,
      placement: coerceGridPlacementV1(block.placement),
    })),
  };
}
