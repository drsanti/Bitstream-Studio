export type TextRange = {
  start: number;
  end: number;
};

export type TextEditResult = {
  text: string;
  selection: TextRange;
};

export function lineRangeAt(text: string, index: number): TextRange {
  const start = text.lastIndexOf("\n", Math.max(0, index - 1)) + 1;
  const nextBreak = text.indexOf("\n", index);
  const end = nextBreak === -1 ? text.length : nextBreak;
  return { start, end };
}

export function wrapRange(
  text: string,
  range: TextRange,
  before: string,
  after: string,
  placeholder = "text",
): TextEditResult {
  const selected = text.slice(range.start, range.end);
  const inner = selected.length > 0 ? selected : placeholder;
  const next = `${text.slice(0, range.start)}${before}${inner}${after}${text.slice(range.end)}`;
  const start = range.start + before.length;
  const end = start + inner.length;
  return { text: next, selection: { start, end } };
}

export function insertSnippet(
  text: string,
  range: TextRange,
  snippet: string,
  selectionOffset?: { start: number; end: number },
): TextEditResult {
  const next = `${text.slice(0, range.start)}${snippet}${text.slice(range.end)}`;
  if (selectionOffset != null) {
    const base = range.start;
    return {
      text: next,
      selection: {
        start: base + selectionOffset.start,
        end: base + selectionOffset.end,
      },
    };
  }
  const cursor = range.start + snippet.length;
  return { text: next, selection: { start: cursor, end: cursor } };
}

export function prefixLines(
  text: string,
  range: TextRange,
  prefix: string,
): TextEditResult {
  const blockStart = lineRangeAt(text, range.start).start;
  const blockEnd = lineRangeAt(text, Math.max(range.end - 1, range.start)).end;
  const block = text.slice(blockStart, blockEnd);
  const lines = block.split("\n");
  const prefixed = lines.map((line) => `${prefix}${line}`).join("\n");
  const next = `${text.slice(0, blockStart)}${prefixed}${text.slice(blockEnd)}`;
  const delta = prefix.length * lines.length;
  return {
    text: next,
    selection: {
      start: range.start + prefix.length,
      end: range.end + delta,
    },
  };
}

export function setLineHeading(
  text: string,
  range: TextRange,
  level: 1 | 2 | 3 | 4,
): TextEditResult {
  const line = lineRangeAt(text, range.start);
  const lineText = text.slice(line.start, line.end);
  const stripped = lineText.replace(/^#{1,6}\s+/, "");
  const prefix = `${"#".repeat(level)} `;
  const nextLine = `${prefix}${stripped}`;
  const next = `${text.slice(0, line.start)}${nextLine}${text.slice(line.end)}`;
  const delta = nextLine.length - lineText.length;
  return {
    text: next,
    selection: {
      start: Math.max(line.start, range.start + delta),
      end: Math.max(line.start, range.end + delta),
    },
  };
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return 0;
  }
  return trimmed.split(/\s+/).length;
}

export function cursorLineColumn(text: string, index: number): { line: number; column: number } {
  const before = text.slice(0, index);
  const lines = before.split("\n");
  const line = lines.length;
  const column = (lines.at(-1)?.length ?? 0) + 1;
  return { line, column };
}

export type FindQueryOptions = {
  caseSensitive: boolean;
  useRegex: boolean;
};

function compileFindPattern(query: string, options: FindQueryOptions): RegExp | null {
  if (query.length === 0) {
    return null;
  }
  try {
    if (options.useRegex) {
      return new RegExp(query, options.caseSensitive ? "g" : "gi");
    }
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(escaped, options.caseSensitive ? "g" : "gi");
  } catch {
    return null;
  }
}

function findNextRegex(text: string, pattern: RegExp, fromIndex: number): number {
  pattern.lastIndex = Math.max(0, fromIndex);
  const hit = pattern.exec(text);
  if (hit != null && hit.index >= 0) {
    return hit.index;
  }
  pattern.lastIndex = 0;
  const wrap = pattern.exec(text);
  return wrap?.index ?? -1;
}

export function findNext(
  text: string,
  query: string,
  fromIndex: number,
  options: FindQueryOptions | boolean,
): number {
  const resolved: FindQueryOptions =
    typeof options === "boolean" ? { caseSensitive: options, useRegex: false } : options;

  const pattern = compileFindPattern(query, resolved);
  if (pattern == null) {
    return -1;
  }

  if (resolved.useRegex || !resolved.caseSensitive) {
    return findNextRegex(text, pattern, fromIndex);
  }

  const start = Math.max(0, fromIndex);
  const hit = text.indexOf(query, start);
  if (hit !== -1) {
    return hit;
  }
  return text.indexOf(query, 0);
}

export function findMatchLength(
  text: string,
  query: string,
  fromIndex: number,
  options: FindQueryOptions,
): number {
  const pattern = compileFindPattern(query, options);
  if (pattern == null) {
    return query.length;
  }
  pattern.lastIndex = Math.max(0, fromIndex);
  const hit = pattern.exec(text);
  return hit?.[0].length ?? query.length;
}

export function replaceAllMatches(
  text: string,
  query: string,
  replacement: string,
  options: FindQueryOptions,
): string {
  const pattern = compileFindPattern(query, options);
  if (pattern == null) {
    return text;
  }
  return text.replace(pattern, replacement);
}

export function findPrevious(
  text: string,
  query: string,
  beforeIndex: number,
  options: FindQueryOptions | boolean,
): number {
  const resolved: FindQueryOptions =
    typeof options === "boolean" ? { caseSensitive: options, useRegex: false } : options;

  if (query.length === 0) {
    return -1;
  }

  const upper = Math.max(0, beforeIndex);
  let last = -1;
  let cursor = 0;

  while (cursor < text.length) {
    const hit = findNext(text, query, cursor, resolved);
    if (hit === -1 || hit >= upper) {
      break;
    }
    last = hit;
    cursor = hit + Math.max(1, findMatchLength(text, query, hit, resolved));
  }

  if (last !== -1) {
    return last;
  }

  let wrapLast = -1;
  cursor = 0;
  while (cursor < text.length) {
    const hit = findNext(text, query, cursor, resolved);
    if (hit === -1) {
      break;
    }
    wrapLast = hit;
    cursor = hit + Math.max(1, findMatchLength(text, query, hit, resolved));
  }

  return wrapLast;
}

export function replaceRange(text: string, range: TextRange, replacement: string): TextEditResult {
  const next = `${text.slice(0, range.start)}${replacement}${text.slice(range.end)}`;
  const cursor = range.start + replacement.length;
  return { text: next, selection: { start: cursor, end: cursor } };
}
