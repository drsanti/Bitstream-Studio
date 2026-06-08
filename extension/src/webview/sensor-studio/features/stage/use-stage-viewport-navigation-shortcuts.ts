import { useEffect } from "react";
import type { StudioViewportGizmoMode } from "../../core/viewport/studio-viewport-gizmo-mode";
import type { StudioViewportViewSnapId } from "../../core/viewport/studio-viewport-view-snaps";
import { useStudioWorkbenchFocusStore } from "../../state/studio-workbench-focus.store";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }
  return target.isContentEditable;
}

function numpadSnapFromCode(code: string): StudioViewportViewSnapId | null {
  switch (code) {
    case "Numpad1":
      return "front";
    case "Numpad3":
      return "right";
    case "Numpad7":
      return "top";
    case "Numpad9":
      return "back";
    default:
      return null;
  }
}

export function useStageViewportNavigationShortcuts(params: {
  enabled: boolean;
  onToggleProjection: () => void;
  onSnapView: (snap: StudioViewportViewSnapId) => void;
  onFrameSelection: () => void;
  onResetCamera: () => void;
  /** SE2 — G/R/S gizmo modes when a procedural mesh is selected. */
  gizmoEnabled?: boolean;
  onSetGizmoMode?: (mode: StudioViewportGizmoMode) => void;
  /** SE4 — cancel armed primitive placement. */
  spawnPending?: boolean;
  onCancelSpawnPending?: () => void;
  /** Delete wired mesh / part-transform behind Stage selection (Edit mode). */
  deleteSelectionEnabled?: boolean;
  onDeleteSelection?: () => void;
}): void {
  const {
    enabled,
    onToggleProjection,
    onSnapView,
    onFrameSelection,
    onResetCamera,
    gizmoEnabled = false,
    onSetGizmoMode,
    spawnPending = false,
    onCancelSpawnPending,
    deleteSelectionEnabled = false,
    onDeleteSelection,
  } = params;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (useStudioWorkbenchFocusStore.getState().activeEditorType !== "stage") {
        return;
      }
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.code === "Numpad5") {
        event.preventDefault();
        event.stopPropagation();
        onToggleProjection();
        return;
      }

      const snap = numpadSnapFromCode(event.code);
      if (snap != null) {
        event.preventDefault();
        event.stopPropagation();
        onSnapView(snap);
        return;
      }

      if (event.code === "NumpadDecimal") {
        event.preventDefault();
        event.stopPropagation();
        onFrameSelection();
        return;
      }

      if (event.code === "Home") {
        event.preventDefault();
        event.stopPropagation();
        onResetCamera();
        return;
      }

      if (event.code === "Escape" && spawnPending && onCancelSpawnPending != null) {
        event.preventDefault();
        event.stopPropagation();
        onCancelSpawnPending();
        return;
      }

      if (
        (event.code === "Delete" || event.code === "Backspace") &&
        deleteSelectionEnabled &&
        onDeleteSelection != null &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        event.stopPropagation();
        onDeleteSelection();
        return;
      }

      if (gizmoEnabled && onSetGizmoMode != null && !event.ctrlKey && !event.metaKey) {
        const key = event.key.toLowerCase();
        if (key === "g") {
          event.preventDefault();
          event.stopPropagation();
          onSetGizmoMode("translate");
          return;
        }
        if (key === "r") {
          event.preventDefault();
          event.stopPropagation();
          onSetGizmoMode("rotate");
          return;
        }
        if (key === "s") {
          event.preventDefault();
          event.stopPropagation();
          onSetGizmoMode("scale");
        }
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [
    enabled,
    gizmoEnabled,
    deleteSelectionEnabled,
    onCancelSpawnPending,
    onDeleteSelection,
    onFrameSelection,
    onResetCamera,
    onSetGizmoMode,
    onSnapView,
    onToggleProjection,
    spawnPending,
  ]);
}
