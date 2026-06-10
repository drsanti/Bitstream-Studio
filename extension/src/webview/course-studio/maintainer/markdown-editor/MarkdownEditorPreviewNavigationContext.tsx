import { createContext, useContext } from "react";

export const MarkdownEditorPreviewNavigationContext = createContext<
  ((line: number) => void) | null
>(null);

export function useMarkdownEditorPreviewNavigation(): ((line: number) => void) | null {
  return useContext(MarkdownEditorPreviewNavigationContext);
}
