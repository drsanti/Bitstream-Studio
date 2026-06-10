import { z } from "zod";
import { courseBlockColorHexSchema } from "./blockColorHex";
import { coerceGridPlacementV1 } from "./placement";
import { pageMetaSchema } from "./pageMeta";
import { cardBlockColorsSchema } from "./cardBlockColors";
import { courseTitleIconAnimationSchema } from "./courseTitleIconAnimation";
import { courseTitleIconSchema } from "./courseTitleIcon";
import { markdownBlockColorsSchema } from "./markdownBlockColors";
import { markdownReadHeightSchema } from "./markdownReadHeight";
import { diagramBindingSchema } from "./diagramBindingSchemas";
import { courseDashboardWidgetKindSchema } from "./courseDashboardWidgetKinds";
import { dashboardWidgetBlockColorsSchema } from "./dashboardWidgetBlockColors";
import {
  courseSensorTelemetryCardPresetSchema,
  COURSE_SENSOR_TELEMETRY_CARD_PRESET_DEFAULT,
} from "./sensorTelemetryCardPreset";
import { sensorTelemetryCardAppearanceSchema } from "./sensorTelemetryCardAppearance";
import { pageGridChromeSchema } from "./pageGridChrome";

const dashboardWidgetKindSchema = z.enum(courseDashboardWidgetKindSchema);

const blockTitleIconColorSchema = courseBlockColorHexSchema.optional();

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
  icon: courseTitleIconSchema,
  iconColor: blockTitleIconColorSchema,
  iconAnimation: courseTitleIconAnimationSchema,
});

const calloutBlockSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["callout-info", "callout-warning", "callout-danger", "callout-tip"]),
  placement: placementSchema,
  title: z.string().optional(),
  body: z.string().min(1),
  icon: courseTitleIconSchema,
  iconColor: blockTitleIconColorSchema,
  iconAnimation: courseTitleIconAnimationSchema,
});

const markdownBlockSchema = z
  .object({
    id: z.string().min(1),
    kind: z.literal("markdown"),
    placement: placementSchema,
    markdown: z.string().optional(),
    /** Bundled filename under `course-studio/content/` (e.g. `pilot-bmi-accel-theory.theory.md`). */
    src: z.string().min(1).optional(),
    /** Public HTTP(S) markdown URL (GitHub blob/raw README, etc.). */
    url: z.string().url().optional(),
    /** Optional per-block typography colors (hex). Unset fields use theme defaults. */
    colors: markdownBlockColorsSchema.optional(),
    /**
     * Read mode height: `content` (default) grows with markdown; `grid` keeps edit cell bounds.
     */
    readHeight: markdownReadHeightSchema.optional(),
  })
  .refine(
    (data) =>
      (data.markdown != null && data.markdown.length > 0) ||
      data.src != null ||
      (data.url != null && data.url.length > 0),
    {
      message: "markdown block requires inline markdown, src, or url",
    },
  );

const cardBlockSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("card"),
  placement: placementSchema,
  title: z.string().optional(),
  body: z.string().min(1),
  icon: courseTitleIconSchema,
  iconAnimation: courseTitleIconAnimationSchema,
  colors: cardBlockColorsSchema.optional(),
});

const liveMetricAxesSchema = z
  .object({
    ax: diagramBindingSchema.optional(),
    ay: diagramBindingSchema.optional(),
    az: diagramBindingSchema.optional(),
  })
  .optional();

const liveMetricBlockSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("live-metric"),
  placement: placementSchema,
  title: z.string().default("Live tri-axis"),
  icon: courseTitleIconSchema,
  iconColor: blockTitleIconColorSchema,
  iconAnimation: courseTitleIconAnimationSchema,
  axes: liveMetricAxesSchema,
});

const dashboardWidgetBlockSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("dashboard-widget"),
  placement: placementSchema,
  widgetKind: dashboardWidgetKindSchema.default("text"),
  style: z.record(z.string(), z.unknown()).default({}),
  binding: diagramBindingSchema.optional(),
  title: z.string().optional(),
  colors: dashboardWidgetBlockColorsSchema.optional(),
});

const sensorTelemetryCardBlockSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("sensor-telemetry-card"),
  placement: placementSchema,
  preset: courseSensorTelemetryCardPresetSchema.default(
    COURSE_SENSOR_TELEMETRY_CARD_PRESET_DEFAULT,
  ),
  appearance: sensorTelemetryCardAppearanceSchema.optional(),
});

const diagram2dBlockSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("diagram-2d"),
  placement: placementSchema,
  diagramId: z.string().min(1),
  caption: z.string().optional(),
});

const scene3dBlockSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("scene-3d"),
  placement: placementSchema,
  /** Bundled scene document id (content/{documentId}.scene.v1.json). */
  documentId: z.string().min(1),
  caption: z.string().optional(),
});

const imageBlockSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("image"),
  placement: placementSchema,
  src: z.string().min(1),
  alt: z.string().optional(),
  caption: z.string().optional(),
  fit: z.enum(["contain", "cover"]).default("contain"),
});

const codeBlockSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("code"),
  placement: placementSchema,
  language: z.string().min(1).default("text"),
  code: z.string().min(1),
  caption: z.string().optional(),
});

export const courseEmbedCaptionPlacementSchema = z.enum(["above", "below", "overlay", "hidden"]);
export type CourseEmbedCaptionPlacement = z.infer<typeof courseEmbedCaptionPlacementSchema>;

const youtubeBlockSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("youtube"),
  placement: placementSchema,
  /** Full YouTube URL or 11-character video id. */
  url: z.string().min(1),
  caption: z.string().optional(),
  /** Where to render caption text. Default: below when caption is set. */
  captionPlacement: courseEmbedCaptionPlacementSchema.optional(),
  startSeconds: z.number().int().min(0).optional(),
  autoplay: z.boolean().optional(),
  muted: z.boolean().optional(),
  loop: z.boolean().optional(),
  showControls: z.boolean().optional(),
  allowFullscreen: z.boolean().optional(),
  modestBranding: z.boolean().optional(),
  limitRelatedVideos: z.boolean().optional(),
  cropChrome: z.boolean().optional(),
  cropTopPx: z.number().int().min(0).max(160).optional(),
  cropBottomPx: z.number().int().min(0).max(160).optional(),
  /** @deprecated Use cropChrome. Kept for older saved pages. */
  minimalChrome: z.boolean().optional(),
});

const iframeBlockSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("iframe"),
  placement: placementSchema,
  src: z.string().min(1),
  title: z.string().optional(),
  caption: z.string().optional(),
});

export const pageBlockSchema = z.discriminatedUnion("kind", [
  headingBlockSchema,
  calloutBlockSchema,
  markdownBlockSchema,
  cardBlockSchema,
  liveMetricBlockSchema,
  dashboardWidgetBlockSchema,
  sensorTelemetryCardBlockSchema,
  diagram2dBlockSchema,
  scene3dBlockSchema,
  imageBlockSchema,
  codeBlockSchema,
  youtubeBlockSchema,
  iframeBlockSchema,
]);

export type PageBlockV1 = z.infer<typeof pageBlockSchema>;

const gridSchema = z.object({
  columns: z.number().int().min(1).max(48).default(12),
  rowHeightPx: z.number().int().min(24).max(200).default(48),
  gapPx: z.number().int().min(0).max(64).default(12),
  paddingPx: z.number().int().min(0).max(128).default(32),
  chrome: pageGridChromeSchema.optional(),
});

export const pageV1Schema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  title: z.string().min(1),
  meta: pageMetaSchema.optional(),
  grid: gridSchema,
  blocks: z.array(pageBlockSchema),
});

export type PageV1 = z.infer<typeof pageV1Schema>;
export type PageGridV1 = z.infer<typeof gridSchema>;

export function parsePageV1(raw: unknown): PageV1 {
  const migrated = migrateLegacyPageBlocks(raw);
  const parsed = pageV1Schema.parse(migrated);
  return {
    ...parsed,
    blocks: parsed.blocks.map((block) => ({
      ...block,
      placement: coerceGridPlacementV1(block.placement),
    })),
  };
}

const LEGACY_SCENE_ID_TO_DOCUMENT: Record<string, string> = {
  "bmi-pcb-orientation": "pilot-bmi-pcb-orientation",
  "axis-triad": "pilot-bmi-pcb-orientation",
  "bmi-gyro-gimbal": "pilot-bmi-pcb-orientation",
};

function migrateLegacyPageBlocks(raw: unknown): unknown {
  if (raw == null || typeof raw !== "object" || !("blocks" in raw)) {
    return raw;
  }
  const page = raw as { blocks?: unknown[] };
  if (!Array.isArray(page.blocks)) {
    return raw;
  }
  return {
    ...page,
    blocks: page.blocks.map((block) => {
      if (block == null || typeof block !== "object") {
        return block;
      }
      const entry = block as Record<string, unknown>;
      if (entry.kind !== "diagram-3d") {
        return block;
      }
      const sceneId = typeof entry.sceneId === "string" ? entry.sceneId : "bmi-pcb-orientation";
      const documentId = LEGACY_SCENE_ID_TO_DOCUMENT[sceneId] ?? "pilot-bmi-pcb-orientation";
      const { sceneId: _removed, ...rest } = entry;
      return {
        ...rest,
        kind: "scene-3d",
        documentId,
      };
    }),
  };
}
