import { useCallback, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import type { SceneV1 } from "../schemas/scene.v1";
import { findDiagram3dNodeParentId } from "../runtime/diagram/diagram3dNodeMutations";
import {
  canClearScene3dSelectionParent,
  type Scene3dClearParentMode,
} from "../runtime/scene/scene3dHierarchyOps";
import { sceneV1ToDiagramV1 } from "../runtime/scene/sceneDiagramBridge";

const MENU_ITEM_CLASS =
  "flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-[11px] font-medium text-zinc-200 transition-colors hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-40";

const SHORTCUT_LABEL_CLASS = "shrink-0 text-[10px] text-zinc-500";

function clampMenuPosition(clientX: number, clientY: number, menuWidth: number, menuHeight: number) {
  const pad = 8;
  const maxLeft = Math.max(pad, window.innerWidth - menuWidth - pad);
  const maxTop = Math.max(pad, window.innerHeight - menuHeight - pad);
  return {
    left: Math.min(Math.max(pad, clientX), maxLeft),
    top: Math.min(Math.max(pad, clientY), maxTop),
  };
}

function countSelectedWithParent(scene: SceneV1, selectedNodeIds: readonly string[]): number {
  const diagram = sceneV1ToDiagramV1(scene);
  return selectedNodeIds.filter((nodeId) => {
    const parentId = findDiagram3dNodeParentId(diagram, nodeId);
    return typeof parentId === "string";
  }).length;
}

export function CourseSceneClearParentMenu({
  scene,
  clientX,
  clientY,
  selectedNodeIds,
  onClearParent,
  onClose,
}: {
  scene: SceneV1;
  clientX: number;
  clientY: number;
  selectedNodeIds: readonly string[];
  onClearParent: (mode: Scene3dClearParentMode) => void;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const canClear = useMemo(
    () => canClearScene3dSelectionParent(scene, selectedNodeIds),
    [scene, selectedNodeIds],
  );

  const parentedCount = useMemo(
    () => countSelectedWithParent(scene, selectedNodeIds),
    [scene, selectedNodeIds],
  );

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current?.contains(event.target as Node)) {
        return;
      }
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (isEditableTarget(event.target) || !canClear) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "c") {
        event.preventDefault();
        onClearParent("clear");
        onClose();
        return;
      }
      if (key === "k") {
        event.preventDefault();
        onClearParent("keepTransform");
        onClose();
        return;
      }
      if (key === "i") {
        event.preventDefault();
        onClearParent("clearInverse");
        onClose();
      }
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [canClear, onClearParent, onClose]);

  const pos = clampMenuPosition(clientX, clientY, 300, 180);

  const pick = useCallback(
    (action: () => void) => {
      action();
      onClose();
    },
    [onClose],
  );

  return createPortal(
    <div
      ref={containerRef}
      className="course-scene-clear-parent-menu fixed z-[200] min-w-[280px] rounded-lg border border-[var(--surface-border)] bg-[var(--surface-panel)] p-1.5 shadow-xl"
      style={{ left: pos.left, top: pos.top }}
      role="menu"
      aria-label="Clear Parent"
    >
      <div className="border-b border-zinc-800/80 px-2 pb-1.5 pt-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Clear Parent</p>
        <TRNHintText className="text-[10px]!">
          {parentedCount} of {selectedNodeIds.length} selected have a parent
        </TRNHintText>
      </div>

      <button
        type="button"
        className={MENU_ITEM_CLASS}
        disabled={!canClear}
        onClick={() => pick(() => onClearParent("clear"))}
      >
        <span>
          <span className="underline">C</span>lear Parent
        </span>
        <span className={SHORTCUT_LABEL_CLASS}>Alt P</span>
      </button>

      <button
        type="button"
        className={MENU_ITEM_CLASS}
        disabled={!canClear}
        onClick={() => pick(() => onClearParent("keepTransform"))}
      >
        <span>
          Clear and <span className="underline">K</span>eep Transformation
        </span>
        <span className={SHORTCUT_LABEL_CLASS}>Alt P</span>
      </button>

      <button
        type="button"
        className={MENU_ITEM_CLASS}
        disabled={!canClear}
        onClick={() => pick(() => onClearParent("clearInverse"))}
      >
        <span>
          Clear Parent <span className="underline">I</span>nverse
        </span>
        <span className={SHORTCUT_LABEL_CLASS}>Alt P</span>
      </button>
    </div>,
    document.body,
  );
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}
