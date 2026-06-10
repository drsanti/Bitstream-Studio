import type { PageBlockV1 } from "../schemas/page.v1";
import { resolveHtmlPageSourceMode } from "./htmlPageBlockSource";

export function listHtmlPageBlocks(blocks: readonly PageBlockV1[]): Extract<PageBlockV1, { kind: "html-page" }>[] {
  return blocks.filter((block): block is Extract<PageBlockV1, { kind: "html-page" }> => block.kind === "html-page");
}

export function htmlPageBlockWorkbenchLabel(block: Extract<PageBlockV1, { kind: "html-page" }>): string {
  const mode = resolveHtmlPageSourceMode(block);
  if (mode === "url" && block.url != null) {
    try {
      const path = new URL(block.url).pathname.split("/").filter(Boolean).pop();
      if (path != null && path.length > 0) {
        return path;
      }
    } catch {
      /* ignore */
    }
    return block.url;
  }
  return block.id;
}
