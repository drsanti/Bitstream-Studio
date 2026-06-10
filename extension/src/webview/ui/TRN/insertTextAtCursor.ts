export type TextSelectionRange = {
  start: number;
  end: number;
};

export type InsertTextAtCursorResult = {
  text: string;
  selection: TextSelectionRange;
};

export function readTextControlSelection(
  element: HTMLInputElement | HTMLTextAreaElement | null,
  fallbackLength: number,
): TextSelectionRange {
  if (element == null) {
    return { start: fallbackLength, end: fallbackLength };
  }
  return {
    start: element.selectionStart ?? fallbackLength,
    end: element.selectionEnd ?? fallbackLength,
  };
}

export function insertTextAtCursor(
  text: string,
  range: TextSelectionRange,
  insertion: string,
): InsertTextAtCursorResult {
  const next = `${text.slice(0, range.start)}${insertion}${text.slice(range.end)}`;
  const cursor = range.start + insertion.length;
  return {
    text: next,
    selection: { start: cursor, end: cursor },
  };
}

export function applyTextControlSelection(
  element: HTMLInputElement | HTMLTextAreaElement,
  selection: TextSelectionRange,
): void {
  element.focus();
  element.setSelectionRange(selection.start, selection.end);
}
