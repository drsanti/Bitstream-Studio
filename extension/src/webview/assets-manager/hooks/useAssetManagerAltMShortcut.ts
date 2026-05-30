import { useEffect } from "react";
import { useOpenAssetManager } from "./useOpenAssetManager.js";

/**
 * **Alt+M** toggles the Asset Manager panel (same input guard as Bitstream Assistant **Alt+A**).
 * Register once from the Bitstream shell (`BitstreamAppWrapper`).
 */
export function useAssetManagerAltMShortcut(): void {
  const { toggleAssetManager } = useOpenAssetManager();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
        return;
      }
      if (e.repeat) {
        return;
      }
      if (e.code !== "KeyM") {
        return;
      }
      const t = e.target as HTMLElement | null;
      if (
        t != null &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          (typeof t.isContentEditable === "boolean" && t.isContentEditable))
      ) {
        return;
      }
      e.preventDefault();
      toggleAssetManager();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleAssetManager]);
}
