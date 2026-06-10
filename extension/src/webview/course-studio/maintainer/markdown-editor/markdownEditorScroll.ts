import type { RefObject } from "react";
import type { TextRange } from "./markdownEditorSelection";

export function offsetAtLine(text: string, line: number): number {
  if (line <= 1) {
    return 0;
  }
  const lines = text.split("\n");
  let offset = 0;
  for (let i = 0; i < line - 1 && i < lines.length; i++) {
    offset += lines[i].length + 1;
  }
  return offset;
}

export function scrollEditorToLine(
  text: string,
  line: number,
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  scrollContainerRef: RefObject<HTMLElement | null>,
): TextRange {
  const offset = offsetAtLine(text, line);
  const range: TextRange = { start: offset, end: offset };

  const textarea = textareaRef.current;
  const container = scrollContainerRef.current;
  if (textarea != null) {
    textarea.focus();
    textarea.setSelectionRange(range.start, range.end);
  }

  if (container != null && textarea != null) {
    const style = getComputedStyle(textarea);
    const lineHeight =
      Number.parseFloat(style.lineHeight) ||
      Number.parseFloat(style.fontSize) * 1.625;
    const paddingTop = Number.parseFloat(style.paddingTop) || 0;
    const targetTop = paddingTop + Math.max(0, line - 2) * lineHeight;
    container.scrollTop = Math.max(0, targetTop - container.clientHeight * 0.25);
  }

  return range;
}
