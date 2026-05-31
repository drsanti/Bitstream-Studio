import { useEffect } from "react";
import {
  handleFlowKeyboardShortcut,
  type FlowKeyboardShortcutContext,
} from "./flow-keyboard-shortcuts";

/** Window-level Sensor Studio flow keyboard shortcuts. */
export function useFlowKeyboardShortcuts(ctx: FlowKeyboardShortcutContext): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (handleFlowKeyboardShortcut(event, ctx)) {
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [ctx]);
}
