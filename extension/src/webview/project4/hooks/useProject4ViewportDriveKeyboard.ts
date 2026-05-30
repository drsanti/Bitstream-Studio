import { useEffect } from "react";
import type { Project4MoveDirection } from "../lib/mcu-http";

const MOVE_KEYS: Record<string, Project4MoveDirection> = {
  w: "W",
  s: "S",
  a: "A",
  d: "D",
  q: "WA",
  e: "WD",
  z: "SA",
  c: "SD",
  " ": "STOP",
};

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) {
    return false;
  }
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }
  return el.isContentEditable;
}

/** Prefers composed path (shadow DOM / portals) then activeElement — avoids stealing keys from focused fields. */
function isTypingInteraction(ev: KeyboardEvent): boolean {
  for (const n of ev.composedPath()) {
    if (isTypingTarget(n)) {
      return true;
    }
  }
  return isTypingTarget(document.activeElement);
}

export type UseProject4ViewportDriveKeyboardOptions = {
  enabled: boolean;
  onMove: (dir: Project4MoveDirection) => void;
};

/** WASD cardinals; QEZC diamond for WA/WD/SA/SD; Space = STOP. Skips when focus is in form fields. */
export function useProject4ViewportDriveKeyboard(options: UseProject4ViewportDriveKeyboardOptions): void {
  useEffect(() => {
    if (!options.enabled) {
      return;
    }

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.repeat || ev.ctrlKey || ev.metaKey || ev.altKey) {
        return;
      }
      if (isTypingInteraction(ev)) {
        return;
      }
      const key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key === " " ? " " : "";
      const dir = MOVE_KEYS[key];
      if (dir == null) {
        return;
      }
      ev.preventDefault();
      options.onMove(dir);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [options.enabled, options.onMove]);
}
