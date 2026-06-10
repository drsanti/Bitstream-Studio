import { lineRangeAt, type TextEditResult, type TextRange } from "./markdownEditorSelection";

const BULLET_RE = /^(\s*)([-*+]|\d+\.)\s+(?:\[[ xX]\]\s+)?/;
const BLOCKQUOTE_RE = /^(\s*>\s?)/;

export function continueMarkdownBlockOnEnter(
  text: string,
  cursor: number,
): TextEditResult | null {
  const lineBounds = lineRangeAt(text, cursor);
  const line = text.slice(lineBounds.start, lineBounds.end);
  const atLineEnd = cursor >= lineBounds.end;

  if (!atLineEnd && cursor < lineBounds.end) {
    return null;
  }

  const trimmed = line.trimEnd();
  if (trimmed.length === 0) {
    return null;
  }

  const bulletMatch = line.match(BULLET_RE);
  if (bulletMatch != null) {
    const marker = bulletMatch[2];
    const isTask = /^\s*[-*+]\s+\[[ xX]\]\s+/.test(line);
    const isEmptyItem =
      (isTask && /^\s*[-*+]\s+\[[ xX]\]\s*$/.test(trimmed)) ||
      (!isTask && new RegExp(`^\\s*${marker.replace(".", "\\.")}\\s*$`).test(trimmed));

    if (isEmptyItem) {
      const stripNewline = lineBounds.end < text.length ? 1 : 0;
      const nextLine = `${text.slice(0, lineBounds.start)}${text.slice(lineBounds.end + stripNewline)}`;
      return { text: nextLine, selection: { start: lineBounds.start, end: lineBounds.start } };
    }

    let nextPrefix = `${bulletMatch[1]}${marker} `;
    if (isTask) {
      nextPrefix = `${bulletMatch[1]}- [ ] `;
    }
    if (/^\d+\.$/.test(marker)) {
      const num = Number.parseInt(marker, 10) + 1;
      nextPrefix = `${bulletMatch[1]}${num}. `;
    }
    const insert = `\n${nextPrefix}`;
    const next = `${text.slice(0, cursor)}${insert}${text.slice(cursor)}`;
    const start = cursor + insert.length;
    return { text: next, selection: { start, end: start } };
  }

  const quoteMatch = line.match(BLOCKQUOTE_RE);
  if (quoteMatch != null) {
    const isEmptyQuote = /^\s*>\s?$/.test(trimmed);
    if (isEmptyQuote) {
      const stripNewline = lineBounds.end < text.length ? 1 : 0;
      const nextLine = `${text.slice(0, lineBounds.start)}${text.slice(lineBounds.end + stripNewline)}`;
      return { text: nextLine, selection: { start: lineBounds.start, end: lineBounds.start } };
    }
    const insert = `\n${quoteMatch[1]}`;
    const next = `${text.slice(0, cursor)}${insert}${text.slice(cursor)}`;
    const start = cursor + insert.length;
    return { text: next, selection: { start, end: start } };
  }

  return null;
}

function tableCellStartOffset(lineStart: number, line: string, cellIndex: number): number {
  const cellParts = line.split("|");
  let offset = lineStart;
  for (let i = 0; i < cellIndex; i += 1) {
    offset += (cellParts[i]?.length ?? 0) + 1;
  }
  return offset;
}

export function handleMarkdownTableTab(
  text: string,
  cursor: number,
  shiftKey: boolean,
): TextRange | null {
  const lineBounds = lineRangeAt(text, cursor);
  const line = text.slice(lineBounds.start, lineBounds.end);
  if (!/^\s*\|.*\|\s*$/.test(line)) {
    return null;
  }

  const before = line.slice(0, cursor - lineBounds.start);
  const pipeCountBefore = (before.match(/\|/g) ?? []).length;
  const cellParts = line.split("|");
  const lastCellIndex = cellParts.length - 2;

  const targetCellIndex = shiftKey ? pipeCountBefore - 1 : pipeCountBefore + 1;
  if (targetCellIndex < 1 || targetCellIndex > lastCellIndex) {
    return null;
  }

  const nextStart = tableCellStartOffset(lineBounds.start, line, targetCellIndex);
  return { start: nextStart, end: nextStart };
}
