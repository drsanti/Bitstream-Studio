import { useQuickActionStore } from "@ternion/t3d/ui";

let lastToggleMs = 0;

/** Debounced toggle so host keybinding + capture cannot flip open/closed twice. */
export function toggleQuickActionPalette(): void {
  const now = Date.now();
  if (now - lastToggleMs < 80) {
    return;
  }
  lastToggleMs = now;
  useQuickActionStore.getState().toggle();
}
