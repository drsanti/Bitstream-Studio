export type MarkdownHeadingEntry = {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  line: number;
  offset: number;
};

export function parseMarkdownHeadings(text: string): MarkdownHeadingEntry[] {
  const headings: MarkdownHeadingEntry[] = [];
  const lines = text.split("\n");
  let offset = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const match = line.match(/^(\s{0,3})(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (match != null) {
      const level = match[2].length as MarkdownHeadingEntry["level"];
      headings.push({
        level,
        title: match[3].trim(),
        line: index + 1,
        offset,
      });
    }
    offset += line.length + 1;
  }
  return headings;
}

/** Nearest heading at or above the cursor line (1-based). */
export function resolveActiveMarkdownHeadingLine(
  headings: MarkdownHeadingEntry[],
  cursorLine: number,
): number | null {
  if (headings.length === 0 || cursorLine < 1) {
    return null;
  }
  let active: MarkdownHeadingEntry | null = null;
  for (const heading of headings) {
    if (heading.line <= cursorLine) {
      active = heading;
      continue;
    }
    break;
  }
  return active?.line ?? null;
}
