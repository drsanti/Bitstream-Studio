import { loadCourseMarkdown } from "../content/markdownRegistry";
import type { PageBlockV1 } from "../schemas/page.v1";

export function resolveMarkdownBlockContent(block: Extract<PageBlockV1, { kind: "markdown" }>): {
  markdown: string;
  src?: string;
  missing?: boolean;
} {
  if (block.src != null) {
    const loaded = loadCourseMarkdown(block.src);
    if (loaded == null) {
      return {
        markdown: block.markdown ?? "",
        src: block.src,
        missing: true,
      };
    }
    return { markdown: loaded, src: block.src };
  }
  return { markdown: block.markdown ?? "" };
}
