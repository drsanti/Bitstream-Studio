import { TransformControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { Group, Matrix4 } from "three";
import type { TransformControls as TransformControlsImpl } from "three-stdlib";
import {
  captureScene3dMultiGizmoSnapshot,
  computeScene3dMultiPivotPreviewWorldMatrices,
  type Scene3dMultiGizmoSnapshot,
} from "../scene/scene3dMultiGizmoTransform";
import {
  computeScene3dSelectionPivotWorldMatrix,
  readObjectWorldMatrix,
} from "../scene/scene3dSelectionPivot";
import { sceneV1ToDiagramV1 } from "../scene/sceneDiagramBridge";
import type { SceneV1 } from "../../schemas/scene.v1";
import type { Diagram3dTransformGizmoMode } from "./diagram3dGizmoHelpers";
import { useCourseDiagram3dViewportPrefs } from "../../maintainer/useCourseDiagram3dViewportPrefs";
import {
  useDiagram3dGizmoInteraction,
  useDiagram3dMultiGizmoPreviewRef,
} from "./diagram3dMultiGizmoPreviewContext";
import { useDiagram3dTransformControlsObjectRef } from "./diagram3dTransformControlsAttach";
import { useDiagram3dViewportControls } from "./diagram3dViewportControlsContext";

function deferClearMultiGizmoPreview(
  previewRef: RefObject<Record<string, Matrix4> | null> | null,
): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (previewRef != null) {
        previewRef.current = null;
      }
    });
  });
}

export function Diagram3dMultiSelectionGizmo({
  scene,
  selectionIds,
  activeNodeId,
  gizmoMode,
  rotateAllowed,
  onPointerDown,
  onDragStart,
  onCommit,
}: {
  scene: SceneV1;
  selectionIds: readonly string[];
  activeNodeId: string | null;
  gizmoMode: Diagram3dTransformGizmoMode;
  rotateAllowed: boolean;
  onPointerDown?: () => void;
  onDragStart?: () => void;
  onCommit?: (pivotStartWorld: Matrix4, pivotEndWorld: Matrix4) => void;
}) {
  const { objectRef: pivotRef, attachTarget: pivotObject, setObjectRef: setPivotRef } =
    useDiagram3dTransformControlsObjectRef<Group>();
  const controlsRef = useRef<TransformControlsImpl | null>(null);
  const [controlsInstance, setControlsInstance] = useState<TransformControlsImpl | null>(null);
  const bindControlsRef = useCallback((instance: TransformControlsImpl | null) => {
    controlsRef.current = instance;
    setControlsInstance(instance);
  }, []);
  const draggingRef = useRef(false);
  const draggedRef = useRef(false);
  const pivotStartRef = useRef<Matrix4 | null>(null);
  const snapshotRef = useRef<Scene3dMultiGizmoSnapshot | null>(null);

  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const selectionIdsRef = useRef(selectionIds);
  selectionIdsRef.current = selectionIds;
  const activeNodeIdRef = useRef(activeNodeId);
  activeNodeIdRef.current = activeNodeId;
  const onPointerDownRef = useRef(onPointerDown);
  onPointerDownRef.current = onPointerDown;
  const onDragStartRef = useRef(onDragStart);
  onDragStartRef.current = onDragStart;
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  const previewRef = useDiagram3dMultiGizmoPreviewRef();
  const gizmoInteraction = useDiagram3dGizmoInteraction();
  const viewportControls = useDiagram3dViewportControls();
  const gizmoSize = useCourseDiagram3dViewportPrefs((s) => s.gizmoSize);
  const invalidate = useThree((state) => state.invalidate);

  const setOrbitEnabled = (enabled: boolean) => {
    viewportControls?.setOrbitEnabled(enabled);
  };

  const beginGizmoInteraction = () => {
    draggingRef.current = true;
    gizmoInteraction?.setMultiGizmoDragging(true);
    const currentScene = sceneRef.current;
    const currentSelection = selectionIdsRef.current;
    onDragStartRef.current?.();
    snapshotRef.current = captureScene3dMultiGizmoSnapshot(currentScene, currentSelection);
    if (pivotRef.current != null) {
      pivotStartRef.current = readObjectWorldMatrix(pivotRef.current);
    }
  };

  const cancelGizmoInteraction = () => {
    draggingRef.current = false;
    draggedRef.current = false;
    pivotStartRef.current = null;
    snapshotRef.current = null;
    gizmoInteraction?.setMultiGizmoDragging(false);
    if (previewRef != null) {
      previewRef.current = null;
    }
    invalidate();
  };

  const endGizmoInteraction = () => {
    if (
      draggedRef.current &&
      pivotRef.current != null &&
      pivotStartRef.current != null &&
      onCommitRef.current != null
    ) {
      onCommitRef.current(pivotStartRef.current, readObjectWorldMatrix(pivotRef.current));
    }
    cancelGizmoInteraction();
    deferClearMultiGizmoPreview(previewRef);
    invalidate();
  };

  useFrame(() => {
    const pivot = pivotRef.current;
    if (pivot == null || draggingRef.current) {
      return;
    }
    const diagram = sceneV1ToDiagramV1(sceneRef.current);
    const matrix = computeScene3dSelectionPivotWorldMatrix(
      diagram,
      selectionIdsRef.current,
      activeNodeIdRef.current,
    );
    if (matrix == null) {
      return;
    }
    matrix.decompose(pivot.position, pivot.quaternion, pivot.scale);
    pivot.updateMatrix();
  });

  useFrame(() => {
    if (
      !draggingRef.current ||
      pivotRef.current == null ||
      pivotStartRef.current == null ||
      snapshotRef.current == null ||
      previewRef == null
    ) {
      return;
    }
    const pivotEnd = readObjectWorldMatrix(pivotRef.current);
    previewRef.current = computeScene3dMultiPivotPreviewWorldMatrices(
      snapshotRef.current,
      pivotStartRef.current,
      pivotEnd,
      selectionIdsRef.current,
    );
    invalidate();
  }, -1);

  useEffect(() => {
    const controls = controlsInstance;
    if (controls == null || pivotObject == null) {
      return;
    }

    const onDraggingChanged = (event: { value: boolean }) => {
      setOrbitEnabled(!event.value);
      if (event.value) {
        draggedRef.current = true;
        if (!draggingRef.current) {
          beginGizmoInteraction();
        }
        return;
      }
      endGizmoInteraction();
    };

    const onMouseDown = () => {
      onPointerDownRef.current?.();
      setOrbitEnabled(false);
    };

    const onMouseUp = () => {
      setOrbitEnabled(true);
      if (draggingRef.current && !draggedRef.current) {
        cancelGizmoInteraction();
      }
    };

    controls.addEventListener("dragging-changed", onDraggingChanged);
    controls.addEventListener("mouseDown", onMouseDown);
    controls.addEventListener("mouseUp", onMouseUp);

    return () => {
      controls.removeEventListener("dragging-changed", onDraggingChanged);
      controls.removeEventListener("mouseDown", onMouseDown);
      controls.removeEventListener("mouseUp", onMouseUp);
      cancelGizmoInteraction();
      setOrbitEnabled(true);
    };
  }, [controlsInstance, gizmoInteraction, invalidate, pivotObject, previewRef]);

  useEffect(() => {
    cancelGizmoInteraction();
  }, [selectionIds.join("|")]);

  useEffect(() => {
    const controls = controlsInstance;
    if (controls != null) {
      controls.mode = gizmoMode;
    }
  }, [controlsInstance, gizmoMode]);

  if (gizmoMode === "rotate" && !rotateAllowed) {
    return null;
  }

  return (
    <>
      <group ref={setPivotRef} />
      {pivotObject != null ? (
        <TransformControls
          ref={bindControlsRef}
          object={pivotObject}
          mode={gizmoMode}
          size={gizmoSize}
        />
      ) : null}
    </>
  );
}
