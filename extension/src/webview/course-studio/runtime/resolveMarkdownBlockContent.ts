import { loadCourseMarkdown } from "../content/markdownRegistry";
import { isRemoteMarkdownUrl } from "../content/remoteMarkdownUrl";
import type { PageBlockV1 } from "../schemas/page.v1";

export function resolveMarkdownBlockContent(block: Extract<PageBlockV1, { kind: "markdown" }>): {
  markdown: string;
  src?: string;
  url?: string;
  missing?: boolean;
  remote?: boolean;
} {
  if (block.url != null && isRemoteMarkdownUrl(block.url)) {
    return {
      markdown: block.markdown ?? "",
      url: block.url,
      remote: true,
    };
  }

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
