import { useCallback, useEffect, useState } from "react";

/**
 * Expand the modal shell to fill the webview (its visual parent) without toggling VS Code
 * window fullscreen (F11 / workbench full screen).
 */
export function useModalFullscreenFill(open: boolean) {
  const [fillViewport, setFillViewport] = useState(false);

  useEffect(() => {
    if (!open) {
      setFillViewport(false);
    }
  }, [open]);

  const toggleFillParent = useCallback(() => {
    setFillViewport((v) => !v);
  }, []);

  const exitFillParent = useCallback(() => {
    setFillViewport(false);
  }, []);

  return {
    fillViewport,
    setFillViewport,
    toggleFillParent,
    exitFillParent,
  };
}
