import type { FindQueryOptions } from "./markdownEditorSelection";
import { findAllMatchRanges, type MarkdownFindHighlight } from "./markdownEditorFindHighlight";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightInlineEscaped(escaped: string): string {
  let out = escaped;

  out = out.replace(
    /(`[^`]+`)/g,
    '<span class="course-md-hl-inline-code">$1</span>',
  );
  out = out.replace(
    /(\$\$[^$]+\$\$|\$[^$\n]+\$)/g,
    '<span class="course-md-hl-math">$1</span>',
  );
  out = out.replace(
    /(\*\*[^*]+\*\*|\*[^*\n]+\*|~~[^~]+~~)/g,
    '<span class="course-md-hl-emphasis">$1</span>',
  );
  out = out.replace(
    /(\[[^\]]+\]\([^)]+\))/g,
    '<span class="course-md-hl-link">$1</span>',
  );
  out = out.replace(
    /(!\[[^\]]*\]\([^)]+\))/g,
    '<span class="course-md-hl-link">$1</span>',
  );

  return out;
}

function highlightInline(line: string): string {
  return highlightInlineEscaped(escapeHtml(line));
}

function wrapFindInPlainLine(
  plain: string,
  lineStart: number,
  ranges: Array<{ start: number; end: number }>,
  activeStart: number,
): string {
  const overlapping = ranges
    .filter((range) => range.end > lineStart && range.start < lineStart + plain.length)
    .map((range) => ({
      start: Math.max(0, range.start - lineStart),
      end: Math.min(plain.length, range.end - lineStart),
    }))
    .sort((a, b) => a.start - b.start);

  if (overlapping.length === 0) {
    return highlightInline(plain);
  }

  let out = "";
  let cursor = 0;
  for (const range of overlapping) {
    if (range.start > cursor) {
      out += highlightInline(plain.slice(cursor, range.start));
    }
    const isActive = range.start + lineStart === activeStart;
    const klass = isActive
      ? "course-md-hl-find course-md-hl-find--active"
      : "course-md-hl-find";
    out += `<span class="${klass}">${escapeHtml(plain.slice(range.start, range.end))}</span>`;
    cursor = range.end;
  }
  out += highlightInline(plain.slice(cursor));
  return out;
}

function highlightLine(
  line: string,
  lineStart: number,
  inFence: { open: boolean },
  findRanges: Array<{ start: number; end: number }>,
  activeStart: number,
): string {
  const fenceMatch = line.match(/^(\s*)(```+|~~~+)/);
  if (fenceMatch != null) {
    inFence.open = !inFence.open;
    return `<span class="course-md-hl-fence">${escapeHtml(line)}</span>`;
  }

  if (inFence.open) {
    if (findRanges.length === 0) {
      return `<span class="course-md-hl-fence-body">${escapeHtml(line)}</span>`;
    }
    return `<span class="course-md-hl-fence-body">${wrapFindInPlainLine(line, lineStart, findRanges, activeStart)}</span>`;
  }

  const headingMatch = line.match(/^(\s{0,3}#{1,6}\s+)(.*)$/);
  if (headingMatch != null) {
    return `<span class="course-md-hl-heading-mark">${escapeHtml(headingMatch[1])}</span>${wrapFindInPlainLine(headingMatch[2], lineStart + headingMatch[1].length, findRanges, activeStart)}`;
  }

  const quoteMatch = line.match(/^(\s*>\s?)(.*)$/);
  if (quoteMatch != null) {
    return `<span class="course-md-hl-quote-mark">${escapeHtml(quoteMatch[1])}</span>${wrapFindInPlainLine(quoteMatch[2], lineStart + quoteMatch[1].length, findRanges, activeStart)}`;
  }

  const listMatch = line.match(/^(\s*(?:[-*+]|\d+\.)\s+(?:\[[ xX]\]\s+)?)(.*)$/);
  if (listMatch != null) {
    return `<span class="course-md-hl-list-mark">${escapeHtml(listMatch[1])}</span>${wrapFindInPlainLine(listMatch[2], lineStart + listMatch[1].length, findRanges, activeStart)}`;
  }

  if (/^(\s*)(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
    return `<span class="course-md-hl-hr">${escapeHtml(line)}</span>`;
  }

  return wrapFindInPlainLine(line, lineStart, findRanges, activeStart);
}

export type MarkdownSyntaxHighlightOptions = {
  find?: MarkdownFindHighlight;
};

/** Lightweight line-based markdown syntax colors for the editor backdrop. */
export function markdownSyntaxHighlightHtml(
  text: string,
  options?: MarkdownSyntaxHighlightOptions,
): string {
  const find = options?.find;
  const findRanges =
    find != null && find.query.length > 0
      ? findAllMatchRanges(text, find.query, find.options)
      : [];

  const inFence = { open: false };
  const lines = text.split("\n");
  let lineStart = 0;
  const body = lines
    .map((line) => {
      const html = highlightLine(
        line,
        lineStart,
        inFence,
        findRanges,
        find?.activeStart ?? -1,
      );
      lineStart += line.length + 1;
      return html;
    })
    .join("\n");

  return text.endsWith("\n") ? `${body}\n` : body;
}

export function buildMarkdownFindHighlight(
  query: string,
  options: FindQueryOptions,
  activeStart: number,
): MarkdownFindHighlight | undefined {
  if (query.trim().length === 0) {
    return undefined;
  }
  return { query, options, activeStart };
}
