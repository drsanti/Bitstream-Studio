import { useEffect, useMemo, useState } from "react";
import {
  markdownSyntaxHighlightHtml,
  type MarkdownSyntaxHighlightOptions,
} from "./markdownSyntaxHighlightHtml";

const HIGHLIGHT_DEBOUNCE_MS = 120;

export function useDebouncedMarkdownSyntaxHtml(
  text: string,
  options?: MarkdownSyntaxHighlightOptions,
): string {
  const [debouncedText, setDebouncedText] = useState(text);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedText(text), HIGHLIGHT_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [text]);

  return useMemo(
    () => markdownSyntaxHighlightHtml(debouncedText, options),
    [debouncedText, options],
  );
}
