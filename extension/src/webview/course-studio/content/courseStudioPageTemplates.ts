import { parsePageV1, type PageV1 } from "../schemas/page.v1";
import type { PageBlockV1 } from "../schemas/page.v1";
import { COURSE_STUDIO_DEFAULT_PAGE_THEME_META } from "../schemas/courseStudioGlobalDocumentTheme";

/**
 * Default Course Studio page layout (approved 2026-06-11).
 * Canonical reference: `st-intro-core-ideas.page.v1.json`
 *
 * Stack (top → bottom):
 * 1. Heading — full width (rows 1–2)
 * 2. Callout — full width (rows 3–4)
 * 3. Live widgets / cards — own row(s), never beside markdown (from row 5)
 * 4. Markdown — full width, readHeight content (below live strip)
 *
 * Prose-only topics (engineering / reference): heading + callout optional + markdown only.
 */

export const COURSE_STUDIO_DEFAULT_GRID = {
  columns: 12,
  rowHeightPx: 48,
  gapPx: 12,
  paddingPx: 32,
} as const;

export const COURSE_STUDIO_TELEMETRY_META = {
  telemetryPreference: "auto" as const,
  staleMs: 2000,
  defaultLinkHealth: "freeze-gray" as const,
};

/** Live pages: telemetry + global document color preset ids (blocks override per field). */
export const COURSE_STUDIO_LIVE_PAGE_META = {
  ...COURSE_STUDIO_TELEMETRY_META,
  ...COURSE_STUDIO_DEFAULT_PAGE_THEME_META,
} as const;

/** Prose-only pages: global document color preset ids only. */
export const COURSE_STUDIO_PROSE_PAGE_META = {
  ...COURSE_STUDIO_DEFAULT_PAGE_THEME_META,
} as const;

/** First row for a full-width markdown article block after a two-row callout. */
export const COURSE_STUDIO_MARKDOWN_ROW_AFTER_CALLOUT = 5;

/** First row for markdown when live blocks occupy rows 5–8 (two widget rows). */
export const COURSE_STUDIO_MARKDOWN_ROW_AFTER_LIVE_STRIP = 9;

export type CourseStudioLiveArticleTemplateOptions = {
  pageId: string;
  title: string;
  eyebrow: string;
  headingTitle: string;
  subtitle: string;
  callout: {
    kind: "callout-info" | "callout-tip" | "callout-warning";
    title: string;
    body: string;
    icon?: string;
  };
  /** Placed from row 5 upward; must not use column 9–12 beside a markdown column. */
  liveBlocks: PageBlockV1[];
  markdown: {
    id: string;
    src: string;
    row?: number;
  };
  includeTelemetryMeta?: boolean;
};

export type CourseStudioProseOnlyTemplateOptions = {
  pageId: string;
  title: string;
  eyebrow?: string;
  headingTitle?: string;
  subtitle?: string;
  markdown: {
    id: string;
    src: string;
  };
};

function headingBlock(
  id: string,
  eyebrow: string,
  title: string,
  subtitle: string,
): PageBlockV1 {
  return {
    id,
    kind: "heading",
    placement: { column: 1, row: 1, columnSpan: 12, rowSpan: 2 },
    eyebrow,
    title,
    subtitle,
  };
}

function markdownBlock(
  id: string,
  src: string,
  row: number,
): PageBlockV1 {
  return {
    id,
    kind: "markdown",
    placement: { column: 1, row, columnSpan: 12, rowSpan: 1 },
    src,
    readHeight: "content",
  };
}

/** Live article page — heading, callout, live row(s), full-width markdown below. */
export function createCourseStudioLiveArticlePage(
  options: CourseStudioLiveArticleTemplateOptions,
): PageV1 {
  const markdownRow =
    options.markdown.row ?? COURSE_STUDIO_MARKDOWN_ROW_AFTER_LIVE_STRIP;

  return parsePageV1({
    version: 1,
    id: options.pageId,
    title: options.title,
    meta:
      options.includeTelemetryMeta === false
        ? COURSE_STUDIO_PROSE_PAGE_META
        : COURSE_STUDIO_LIVE_PAGE_META,
    grid: { ...COURSE_STUDIO_DEFAULT_GRID },
    blocks: [
      headingBlock(
        `heading-${options.pageId}`,
        options.eyebrow,
        options.headingTitle,
        options.subtitle,
      ),
      {
        id: `callout-${options.pageId}`,
        kind: options.callout.kind,
        placement: { column: 1, row: 3, columnSpan: 12, rowSpan: 2 },
        title: options.callout.title,
        body: options.callout.body,
        icon: options.callout.icon ?? "Info",
      },
      ...options.liveBlocks,
      markdownBlock(options.markdown.id, options.markdown.src, markdownRow),
    ],
  });
}

/** Prose-only topic — full-width markdown (engineering / reference). */
export function createCourseStudioProseOnlyPage(
  options: CourseStudioProseOnlyTemplateOptions,
): PageV1 {
  const blocks: PageBlockV1[] = [];
  let markdownRow = COURSE_STUDIO_MARKDOWN_ROW_AFTER_CALLOUT;

  if (options.eyebrow != null && options.headingTitle != null) {
    blocks.push(
      headingBlock(
        `heading-${options.pageId}`,
        options.eyebrow,
        options.headingTitle,
        options.subtitle ?? "",
      ),
    );
    markdownRow = COURSE_STUDIO_MARKDOWN_ROW_AFTER_CALLOUT;
  }

  blocks.push(
    markdownBlock(options.markdown.id, options.markdown.src, markdownRow),
  );

  return parsePageV1({
    version: 1,
    id: options.pageId,
    title: options.title,
    meta: COURSE_STUDIO_PROSE_PAGE_META,
    grid: { ...COURSE_STUDIO_DEFAULT_GRID },
    blocks,
  });
}
