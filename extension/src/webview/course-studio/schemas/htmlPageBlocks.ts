import type { PageBlockV1 } from "./page.v1";
import type { CourseEmbedShellHeight } from "./embedBlocks";
import {
  markdownShellHeightForRead,
  resolveMarkdownReadHeight,
  type MarkdownReadHeightMode,
} from "./markdownReadHeight";

/** Scripts on by default — isolated iframe, no parent access. */
export const HTML_PAGE_SANDBOX_DEFAULT = "allow-scripts";

export const HTML_PAGE_SANDBOX_SAME_ORIGIN = "allow-scripts allow-same-origin";

export function wrapHtmlDocumentIfNeeded(html: string): string {
  const trimmed = html.trim();
  if (trimmed.length === 0) {
    return "";
  }
  if (/<!doctype\s+html/i.test(trimmed) || /<html[\s>]/i.test(trimmed)) {
    return trimmed;
  }
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
${trimmed}
</body>
</html>`;
}

export function resolveHtmlPageSandboxAttr(options?: { sandboxSameOrigin?: boolean }): string {
  return options?.sandboxSameOrigin === true
    ? HTML_PAGE_SANDBOX_SAME_ORIGIN
    : HTML_PAGE_SANDBOX_DEFAULT;
}

export function resolveHtmlPageReadHeight(block: {
  readHeight?: MarkdownReadHeightMode;
}): MarkdownReadHeightMode {
  return resolveMarkdownReadHeight(block);
}

export function htmlPageShellHeightForRead(block: {
  readHeight?: MarkdownReadHeightMode;
}): CourseEmbedShellHeight {
  return markdownShellHeightForRead(resolveHtmlPageReadHeight(block));
}

export function htmlPageUsesReadContentHeight(block: PageBlockV1): boolean {
  if (block.kind !== "html-page") {
    return false;
  }
  return htmlPageShellHeightForRead(block) === "content";
}

/** Read-mode fixed height in px. Auto mode measures document height inside the iframe. */
export function htmlPageReadContentHeightPx(
  block: Extract<PageBlockV1, { kind: "html-page" }>,
): number | undefined {
  return block.readHeightPx ?? undefined;
}
