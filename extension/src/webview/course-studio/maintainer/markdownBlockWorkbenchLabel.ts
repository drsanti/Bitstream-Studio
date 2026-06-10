import type { PageBlockV1 } from "../schemas/page.v1";

const MARKDOWN_HEADING_RE = /^#{1,6}\s+(.+)$/m;

export type MarkdownPageBlock = Extract<PageBlockV1, { kind: "markdown" }>;

export function listMarkdownPageBlocks(blocks: readonly PageBlockV1[]): MarkdownPageBlock[] {
  return blocks.filter((block): block is MarkdownPageBlock => block.kind === "markdown");
}

/** Short label for Markdown workbench empty-state picker rows. */
export function markdownBlockWorkbenchLabel(block: MarkdownPageBlock): string {
  if (block.src != null && block.src.trim().length > 0) {
    const segments = block.src.split(/[/\\]/);
    return segments[segments.length - 1] ?? block.src;
  }

  if (block.url != null && block.url.trim().length > 0) {
    try {
      const parsed = new URL(block.url);
      const path = parsed.pathname === "/" ? "" : parsed.pathname;
      return `${parsed.hostname}${path}`;
    } catch {
      return block.url;
    }
  }

  const markdown = block.markdown ?? "";
  const headingMatch = MARKDOWN_HEADING_RE.exec(markdown);
  if (headingMatch?.[1] != null && headingMatch[1].trim().length > 0) {
    return headingMatch[1].trim();
  }

  const firstLine = markdown.split(/\r?\n/).find((line) => line.trim().length > 0);
  if (firstLine != null) {
    const trimmed = firstLine.trim();
    if (trimmed.length <= 48) {
      return trimmed;
    }
    return `${trimmed.slice(0, 45)}…`;
  }

  return `Markdown (row ${block.placement.row})`;
}
