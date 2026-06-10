import { useCallback, useRef } from "react";

const MAX_HISTORY = 120;

export function useMarkdownEditorHistory(initial: string) {
  const stackRef = useRef<string[]>([initial]);
  const indexRef = useRef(0);
  const skipPushRef = useRef(false);

  const push = useCallback((next: string) => {
    if (skipPushRef.current) {
      skipPushRef.current = false;
      return;
    }
    const stack = stackRef.current.slice(0, indexRef.current + 1);
    if (stack.at(-1) === next) {
      return;
    }
    stack.push(next);
    if (stack.length > MAX_HISTORY) {
      stack.shift();
    }
    stackRef.current = stack;
    indexRef.current = stack.length - 1;
  }, []);

  const applyFromHistory = useCallback((index: number): string | null => {
    const stack = stackRef.current;
    if (index < 0 || index >= stack.length) {
      return null;
    }
    indexRef.current = index;
    skipPushRef.current = true;
    return stack[index] ?? null;
  }, []);

  const undo = useCallback((): string | null => {
    return applyFromHistory(indexRef.current - 1);
  }, [applyFromHistory]);

  const redo = useCallback((): string | null => {
    return applyFromHistory(indexRef.current + 1);
  }, [applyFromHistory]);

  const canUndo = useCallback(() => indexRef.current > 0, []);
  const canRedo = useCallback(() => indexRef.current < stackRef.current.length - 1, []);

  const reset = useCallback((next: string) => {
    stackRef.current = [next];
    indexRef.current = 0;
    skipPushRef.current = false;
  }, []);

  return { push, undo, redo, canUndo, canRedo, reset };
}
