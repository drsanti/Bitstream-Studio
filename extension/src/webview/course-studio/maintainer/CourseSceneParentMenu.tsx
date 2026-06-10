import { useCallback, useEffect, useMemo, useRef } from "react";import { createPortal } from "react-dom";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import type { SceneV1 } from "../schemas/scene.v1";
import { findDiagram3dNode } from "../runtime/diagram/diagram3dNodeMutations";
import {
  canParentScene3dSelectionToActive,
  type Scene3dParentMode,
} from "../runtime/scene/scene3dHierarchyOps";
import { sceneV1ToDiagramV1 } from "../runtime/scene/sceneDiagramBridge";

const MENU_ITEM_CLASS =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] font-medium text-zinc-200 transition-colors hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-40";

function clampMenuPosition(clientX: number, clientY: number, menuWidth: number, menuHeight: number) {
  const pad = 8;
  const maxLeft = Math.max(pad, window.innerWidth - menuWidth - pad);
  const maxTop = Math.max(pad, window.innerHeight - menuHeight - pad);
  return {
    left: Math.min(Math.max(pad, clientX), maxLeft),
    top: Math.min(Math.max(pad, clientY), maxTop),
  };
}

function activeParentLabel(scene: SceneV1, activeNodeId: string | null): string {
  if (activeNodeId == null) {
    return "none";
  }
  const node = findDiagram3dNode(sceneV1ToDiagramV1(scene), activeNodeId);
  if (node == null) {
    return activeNodeId;
  }
  return node.type === "group3d" ? `${activeNodeId} (group)` : `${activeNodeId} (object)`;
}

export function CourseSceneParentMenu({
  scene,
  clientX,
  clientY,
  selectedNodeIds,
  activeNodeId,
  onParentToActive,
  onClose,
}: {
  scene: SceneV1;
  clientX: number;
  clientY: number;
  selectedNodeIds: readonly string[];
  activeNodeId: string | null;
  onParentToActive: (mode: Scene3dParentMode) => void;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const canParentToActive = useMemo(
    () => canParentScene3dSelectionToActive(scene, selectedNodeIds, activeNodeId),
    [activeNodeId, scene, selectedNodeIds],
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
      if (isEditableTarget(event.target)) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "o" && canParentToActive) {
        event.preventDefault();
        onParentToActive("object");
        onClose();
        return;
      }
      if (key === "t" && canParentToActive) {
        event.preventDefault();
        onParentToActive("keepTransform");
        onClose();
      }
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [canParentToActive, onClose, onParentToActive]);

  const pos = clampMenuPosition(clientX, clientY, 280, 120);

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
      className="course-scene-parent-menu fixed z-[200] min-w-[260px] rounded-lg border border-[var(--surface-border)] bg-[var(--surface-panel)] p-1.5 shadow-xl"
      style={{ left: pos.left, top: pos.top }}
      role="menu"
      aria-label="Set Parent To"
    >
      <div className="border-b border-zinc-800/80 px-2 pb-1.5 pt-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Set Parent To</p>
        <TRNHintText className="text-[10px]!">
          Active parent: {activeParentLabel(scene, activeNodeId)} · {selectedNodeIds.length} selected
        </TRNHintText>
      </div>

      <button
        type="button"
        className={MENU_ITEM_CLASS}
        disabled={!canParentToActive}
        onClick={() => pick(() => onParentToActive("object"))}
      >
        <span>
          <span className="underline">O</span>bject
        </span>
      </button>

      <button
        type="button"
        className={MENU_ITEM_CLASS}
        disabled={!canParentToActive}
        onClick={() => pick(() => onParentToActive("keepTransform"))}
      >
        <span>
          <span className="underline">O</span>bject (<span className="underline">K</span>eep{" "}
          <span className="underline">T</span>ransform)
        </span>
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
