import type { FindQueryOptions } from "./markdownEditorSelection";
import type { TextRange } from "./markdownEditorSelection";

export type MarkdownFindHighlight = {
  query: string;
  options: FindQueryOptions;
  activeStart: number;
};

export function findAllMatchRanges(
  text: string,
  query: string,
  options: FindQueryOptions,
): TextRange[] {
  if (query.length === 0) {
    return [];
  }
  try {
    const pattern = options.useRegex
      ? new RegExp(query, options.caseSensitive ? "g" : "gi")
      : new RegExp(
          query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          options.caseSensitive ? "g" : "gi",
        );
    const ranges: TextRange[] = [];
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) != null) {
      ranges.push({ start: match.index, end: match.index + match[0].length });
      if (match[0].length === 0) {
        pattern.lastIndex += 1;
      }
    }
    return ranges;
  } catch {
    return [];
  }
}
