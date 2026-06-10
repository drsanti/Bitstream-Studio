import { useEffect, type RefObject } from "react";
import type { Diagram3dTransformGizmoMode } from "../runtime/diagram/diagram3dGizmoHelpers";
import {
  isEditableKeyboardTarget,
  readDiagram3dProjectionToggleFromKeyboardEvent,
  readDiagram3dViewSnapFromKeyboardEvent,
} from "../runtime/diagram/diagram3dViewSnapShortcuts";
import type { StudioViewportViewSnapId } from "../../sensor-studio/core/viewport/studio-viewport-view-snaps";

export function useCourseDiagram3dViewportShortcuts(options: {
  enabled: boolean;
  viewportRef: RefObject<HTMLElement | null>;
  selectedNodeId: string | null;
  onSetGizmoMode: (mode: Diagram3dTransformGizmoMode) => void;
  onViewSnap: (snap: StudioViewportViewSnapId) => void;
  onToggleProjection?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onOpenAddMenu?: (anchor: { clientX: number; clientY: number }) => void;
  addMenuOpen?: boolean;
  parentMenuOpen?: boolean;
  clearParentMenuOpen?: boolean;
  onCloseAddMenu?: () => void;
  onCloseParentMenu?: () => void;
  onCloseClearParentMenu?: () => void;
}): void {
  const {
    enabled,
    viewportRef,
    selectedNodeId,
    onSetGizmoMode,
    onViewSnap,
    onToggleProjection,
    onDuplicate,
    onDelete,
    onOpenAddMenu,
    addMenuOpen = false,
    parentMenuOpen = false,
    clearParentMenuOpen = false,
    onCloseAddMenu,
    onCloseParentMenu,
    onCloseClearParentMenu,
  } = options;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableKeyboardTarget(event.target)) {
        return;
      }

      const viewport = viewportRef.current;
      const viewportFocused =
        viewport != null &&
        (document.activeElement === viewport || viewport.contains(document.activeElement));
      if (!viewportFocused) {
        return;
      }

      if (clearParentMenuOpen && event.key === "Escape" && onCloseClearParentMenu != null) {
        event.preventDefault();
        event.stopImmediatePropagation();
        onCloseClearParentMenu();
        return;
      }

      if (parentMenuOpen && event.key === "Escape" && onCloseParentMenu != null) {
        event.preventDefault();
        event.stopImmediatePropagation();
        onCloseParentMenu();
        return;
      }

      if (addMenuOpen && event.key === "Escape" && onCloseAddMenu != null) {
        event.preventDefault();
        event.stopImmediatePropagation();
        onCloseAddMenu();
        return;
      }

      if (
        event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        event.key.toLowerCase() === "a" &&
        onOpenAddMenu != null
      ) {
        const rect = viewportRef.current?.getBoundingClientRect();
        if (rect == null) {
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        onOpenAddMenu({
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2,
        });
        return;
      }

      const viewSnap = readDiagram3dViewSnapFromKeyboardEvent(event);
      if (viewSnap != null) {
        event.preventDefault();
        event.stopImmediatePropagation();
        onViewSnap(viewSnap);
        return;
      }

      if (
        readDiagram3dProjectionToggleFromKeyboardEvent(event) &&
        onToggleProjection != null
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        onToggleProjection();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        if (selectedNodeId == null || onDuplicate == null) {
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        onDuplicate();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (
          selectedNodeId == null ||
          onDelete == null ||
          event.ctrlKey ||
          event.metaKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        onDelete();
        return;
      }

      if (selectedNodeId == null) {
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "g") {
        event.preventDefault();
        onSetGizmoMode("translate");
      } else if (key === "r") {
        event.preventDefault();
        onSetGizmoMode("rotate");
      } else if (key === "s") {
        event.preventDefault();
        onSetGizmoMode("scale");
      }
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [
    addMenuOpen,
    clearParentMenuOpen,
    enabled,
    onCloseAddMenu,
    onCloseClearParentMenu,
    onCloseParentMenu,
    onDelete,
    onDuplicate,
    onOpenAddMenu,
    onSetGizmoMode,
    onToggleProjection,
    onViewSnap,
    parentMenuOpen,
    selectedNodeId,
    viewportRef,
  ]);
}
