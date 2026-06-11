import { parsePageV1, type PageV1 } from "../schemas/page.v1";
import { COURSE_STUDIO_DEFAULT_PAGE_THEME_META } from "../schemas/courseStudioGlobalDocumentTheme";
import { loadBlankCoursePage } from "../content/loadBlankPage";

/** Starter page JSON for a new topic or subtopic outline node. */
export function createTopicPageTemplate(options: {
  pageId: string;
  title: string;
}): PageV1 {
  const blank = loadBlankCoursePage();
  return parsePageV1({
    ...blank,
    id: options.pageId,
    title: options.title,
    meta: {
      ...blank.meta,
      ...COURSE_STUDIO_DEFAULT_PAGE_THEME_META,
    },
    blocks: [
      {
        id: "heading-1",
        kind: "heading",
        placement: { column: 1, row: 1, columnSpan: 12, rowSpan: 2 },
        eyebrow: "Topic",
        title: options.title,
        subtitle: "Edit this page in the Page Editor.",
      },
    ],
  });
}

export function coursePageSourcePathForId(pageId: string): string {
  return `src/webview/course-studio/content/${pageId}.page.v1.json`;
}
