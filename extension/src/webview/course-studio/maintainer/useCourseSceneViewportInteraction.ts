import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Diagram3dBoxSelectProjector } from "../runtime/diagram/Diagram3dBoxSelectBridge";
import { roundDiagram3dPosition } from "../runtime/diagram/diagram3dPositionSnap";
import {
  buildScene3dMultiPivotTransformPatches,
  captureScene3dMultiGizmoSnapshot,
  type Scene3dMultiGizmoSnapshot,
} from "../runtime/scene/scene3dMultiGizmoTransform";
import type { Matrix4 } from "three";
import {
  mergeScene3dViewportBoxSelection,
  normalizeScene3dViewportScreenRect,
  scene3dViewportMarqueeIsDrag,
  shouldStartScene3dViewportMarquee,
  type Scene3dViewportScreenRect,
} from "../runtime/scene/scene3dViewportBoxSelection";
import { EMPTY_SCENE_NODE_SELECTION } from "../runtime/scene/courseSceneSelection";
import { useCourseSceneEditorStore } from "./useCourseSceneEditorStore";

type ViewportMarqueeState = {
  start: { x: number; y: number };
  current: { x: number; y: number };
  additive: boolean;
};

type PendingViewportMarqueeState = {
  start: { x: number; y: number };
  additive: boolean;
};

function isViewportChromeTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  return (
    target.closest(".course-scene-object-rail") != null ||
    target.closest('[role="toolbar"][aria-label="3D design viewport"]') != null
  );
}

function readSceneEditorInteractionState(documentId: string): {
  selectedNodeIds: string[];
  activeNodeId: string | null;
  scene: ReturnType<typeof useCourseSceneEditorStore.getState>["drafts"][string];
} {
  const state = useCourseSceneEditorStore.getState();
  return {
    selectedNodeIds: state.selectedNodeIdLists[documentId] ?? EMPTY_SCENE_NODE_SELECTION,
    activeNodeId: state.activeNodeIds[documentId] ?? null,
    scene: state.drafts[documentId],
  };
}

export function useCourseSceneViewportInteraction({
  documentId,
  clearSceneSelection,
}: {
  documentId: string;
  clearSceneSelection: () => void;
}) {
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const multiGizmoSnapshotRef = useRef<Scene3dMultiGizmoSnapshot | null>(null);
  const boxSelectProjectorRef = useRef<Diagram3dBoxSelectProjector | null>(null);
  const pointerHitObjectRef = useRef(false);
  const pendingMarqueeRef = useRef<PendingViewportMarqueeState | null>(null);
  const marqueeRef = useRef<ViewportMarqueeState | null>(null);
  const [marquee, setMarquee] = useState<ViewportMarqueeState | null>(null);

  const cancelViewportMarquee = useCallback(() => {
    pendingMarqueeRef.current = null;
    marqueeRef.current = null;
    setMarquee(null);
  }, []);

  useEffect(() => {
    marqueeRef.current = marquee;
  }, [marquee]);

  const patchNode = useCourseSceneEditorStore((s) => s.patchNode);
  const patchNodes = useCourseSceneEditorStore((s) => s.patchNodes);
  const pushSceneUndoSnapshot = useCourseSceneEditorStore((s) => s.pushSceneUndoSnapshot);
  const setSceneSelection = useCourseSceneEditorStore((s) => s.setSceneSelection);

  const markPointerHitObject = useCallback(() => {
    pointerHitObjectRef.current = true;
    cancelViewportMarquee();
  }, [cancelViewportMarquee]);

  const onGizmoPointerDown = markPointerHitObject;

  const onRegisterBoxSelectProjector = useCallback((projector: Diagram3dBoxSelectProjector | null) => {
    boxSelectProjectorRef.current = projector;
  }, []);

  const onGizmoDragStart = useCallback(() => {
    markPointerHitObject();
  }, [markPointerHitObject]);

  const onMultiGizmoDragStart = useCallback(() => {
    markPointerHitObject();
    const { selectedNodeIds: selection, scene: draft } = readSceneEditorInteractionState(documentId);
    if (draft == null || selection.length <= 1) {
      multiGizmoSnapshotRef.current = null;
      return;
    }
    pushSceneUndoSnapshot(documentId);
    multiGizmoSnapshotRef.current = captureScene3dMultiGizmoSnapshot(draft, selection);
  }, [documentId, markPointerHitObject, pushSceneUndoSnapshot]);

  const onMultiGizmoCommit = useCallback(
    (pivotStartWorld: Matrix4, pivotEndWorld: Matrix4) => {
      const { selectedNodeIds: selection, scene: draft } = readSceneEditorInteractionState(documentId);
      const snapshot = multiGizmoSnapshotRef.current;
      if (draft == null || snapshot == null || selection.length <= 1) {
        multiGizmoSnapshotRef.current = null;
        return;
      }
      const patches = buildScene3dMultiPivotTransformPatches(
        draft,
        snapshot,
        pivotStartWorld,
        pivotEndWorld,
        selection,
      );
      patchNodes(documentId, patches, { recordUndo: false });
      multiGizmoSnapshotRef.current = null;
    },
    [documentId, patchNodes],
  );

  const onNodePositionCommit = useCallback(
    (nodeId: string, position: [number, number, number]) => {
      const [x, y, z] = roundDiagram3dPosition(position);
      patchNode(
        documentId,
        nodeId,
        { positionX: x, positionY: y, positionZ: z },
        { recordUndo: true },
      );
    },
    [documentId, patchNode],
  );

  const onNodeRotationCommit = useCallback(
    (nodeId: string, eulerDegrees: [number, number, number]) => {
      patchNode(documentId, nodeId, { rotation: eulerDegrees }, { recordUndo: true });
    },
    [documentId, patchNode],
  );

  const onNodeScaleCommit = useCallback(
    (nodeId: string, scale: [number, number, number]) => {
      patchNode(
        documentId,
        nodeId,
        { scaleX: scale[0], scaleY: scale[1], scaleZ: scale[2] },
        { recordUndo: true },
      );
    },
    [documentId, patchNode],
  );

  const commitMarqueeSelection = useCallback(
    (state: ViewportMarqueeState) => {
      const rect: Scene3dViewportScreenRect = normalizeScene3dViewportScreenRect(
        state.start,
        state.current,
      );
      if (scene3dViewportMarqueeIsDrag(rect)) {
        const projector = boxSelectProjectorRef.current;
        if (projector != null) {
          const hits = projector(rect);
          const { selectedNodeIds: currentSelection } = readSceneEditorInteractionState(documentId);
          const merged = mergeScene3dViewportBoxSelection(
            currentSelection,
            hits,
            state.additive,
          );
          setSceneSelection(documentId, merged.selected, merged.active);
        }
      }
    },
    [documentId, setSceneSelection],
  );

  useEffect(() => {
    const onPointerUp = () => {
      const currentMarquee = marqueeRef.current;
      const pendingMarquee = pendingMarqueeRef.current;
      pendingMarqueeRef.current = null;
      cancelViewportMarquee();
      if (currentMarquee != null) {
        const rect = normalizeScene3dViewportScreenRect(
          currentMarquee.start,
          currentMarquee.current,
        );
        if (scene3dViewportMarqueeIsDrag(rect)) {
          commitMarqueeSelection(currentMarquee);
        } else if (!pointerHitObjectRef.current) {
          clearSceneSelection();
        }
      } else if (pendingMarquee != null && !pointerHitObjectRef.current) {
        clearSceneSelection();
      }
    };
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [cancelViewportMarquee, clearSceneSelection, commitMarqueeSelection]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvasAreaRef.current?.getBoundingClientRect();
      if (bounds == null) {
        return;
      }
      const local = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };

      const currentMarquee = marqueeRef.current;
      if (currentMarquee != null) {
        setMarquee({
          ...currentMarquee,
          current: local,
        });
        return;
      }

      const pending = pendingMarqueeRef.current;
      if (pending == null || pointerHitObjectRef.current) {
        return;
      }

      const rect = normalizeScene3dViewportScreenRect(pending.start, local);
      if (!scene3dViewportMarqueeIsDrag(rect)) {
        return;
      }

      pendingMarqueeRef.current = null;
      const next: ViewportMarqueeState = {
        start: pending.start,
        current: local,
        additive: pending.additive,
      };
      marqueeRef.current = next;
      setMarquee(next);
    };
    window.addEventListener("pointermove", onPointerMove);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  const onCanvasPointerDownCapture = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || isViewportChromeTarget(event.target)) {
      return;
    }
    if (!shouldStartScene3dViewportMarquee(event.nativeEvent)) {
      return;
    }
    pointerHitObjectRef.current = false;
    const bounds = canvasAreaRef.current?.getBoundingClientRect();
    if (bounds == null) {
      return;
    }
    const local = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
    cancelViewportMarquee();
    pendingMarqueeRef.current = {
      start: local,
      additive: event.shiftKey,
    };
  }, [cancelViewportMarquee]);

  const marqueeBox =
    marquee != null
      ? normalizeScene3dViewportScreenRect(marquee.start, marquee.current)
      : null;

  return {
    canvasAreaRef,
    marqueeBox,
    onCanvasPointerDownCapture,
    onNodePointerDown: markPointerHitObject,
    onGizmoPointerDown,
    onGizmoDragStart,
    onMultiGizmoDragStart,
    onMultiGizmoCommit,
    onRegisterBoxSelectProjector,
    onNodePositionCommit,
    onNodeRotationCommit,
    onNodeScaleCommit,
  };
}
