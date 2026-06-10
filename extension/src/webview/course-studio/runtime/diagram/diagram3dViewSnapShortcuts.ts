import type { StudioViewportViewSnapId } from "../../../sensor-studio/core/viewport/studio-viewport-view-snaps";

const VIEW_SNAP_KEY_CODES: Record<string, StudioViewportViewSnapId> = {
  Numpad1: "front",
  Digit1: "front",
  Numpad3: "right",
  Digit3: "right",
  Numpad7: "top",
  Digit7: "top",
  Numpad9: "back",
  Digit9: "back",
};

/** Blender-style view snaps — numpad or top-row number row (1 front · 3 right · 7 top · 9 back). */
export function readDiagram3dViewSnapFromKeyboardEvent(
  event: KeyboardEvent,
): StudioViewportViewSnapId | null {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return null;
  }
  return VIEW_SNAP_KEY_CODES[event.code] ?? null;
}

const PROJECTION_TOGGLE_KEY_CODES = new Set(["Numpad5", "Digit5"]);

/** Blender-style perspective / orthographic toggle — numpad 5 or top-row 5. */
export function readDiagram3dProjectionToggleFromKeyboardEvent(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
    return false;
  }
  return PROJECTION_TOGGLE_KEY_CODES.has(event.code);
}
export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }
  return target.isContentEditable;
}
