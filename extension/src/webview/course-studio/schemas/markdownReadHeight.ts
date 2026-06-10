import { z } from "zod";

/** How a markdown block sizes itself in Course Studio Read mode. */
export const markdownReadHeightSchema = z.enum(["content", "grid"]);

export type MarkdownReadHeightMode = z.infer<typeof markdownReadHeightSchema>;

export const MARKDOWN_READ_HEIGHT_MODES = markdownReadHeightSchema.options;

/** Default: grow to full article height in Read (no inner scroll). */
export const DEFAULT_MARKDOWN_READ_HEIGHT: MarkdownReadHeightMode = "content";

export function resolveMarkdownReadHeight(block: {
  readHeight?: MarkdownReadHeightMode;
}): MarkdownReadHeightMode {
  const value = block.readHeight;
  if (value != null && MARKDOWN_READ_HEIGHT_MODES.includes(value)) {
    return value;
  }
  return DEFAULT_MARKDOWN_READ_HEIGHT;
}

export function markdownShellHeightForRead(
  readHeight: MarkdownReadHeightMode,
): "fill" | "content" {
  return readHeight === "content" ? "content" : "fill";
}
