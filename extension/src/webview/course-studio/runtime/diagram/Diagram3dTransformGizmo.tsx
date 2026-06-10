import { TransformControls } from "@react-three/drei";
import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { Group } from "three";
import type { TransformControls as TransformControlsImpl } from "three-stdlib";
import type { Diagram3dTransformGizmoMode } from "./diagram3dGizmoHelpers";
import {
  readEulerDegreesFromObject3D,
  readScaleFromObject3D,
} from "./diagram3dGizmoHelpers";
import { useDiagram3dGizmoInteraction } from "./diagram3dMultiGizmoPreviewContext";
import { useDiagram3dViewportControls } from "./diagram3dViewportControlsContext";
import { useDiagram3dTransformControlsAttachTarget } from "./diagram3dTransformControlsAttach";
import { useCourseDiagram3dViewportPrefs } from "../../maintainer/useCourseDiagram3dViewportPrefs";
import { roundDiagram3dPosition } from "./diagram3dPositionSnap";

export function Diagram3dTransformGizmo({
  targetRef,
  mode,
  onPointerDown,
  onDragStart,
  onPositionCommit,
  onRotationCommit,
  onScaleCommit,
}: {
  targetRef: RefObject<Group | null>;
  mode: Diagram3dTransformGizmoMode;
  onPointerDown?: () => void;
  onDragStart?: () => void;
  onPositionCommit?: (position: [number, number, number]) => void;
  onRotationCommit?: (eulerDegrees: [number, number, number]) => void;
  onScaleCommit?: (scale: [number, number, number]) => void;
}) {
  const controlsRef = useRef<TransformControlsImpl>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const viewportControls = useDiagram3dViewportControls();
  const gizmoInteraction = useDiagram3dGizmoInteraction();
  const gizmoSize = useCourseDiagram3dViewportPrefs((s) => s.gizmoSize);
  const attachTarget = useDiagram3dTransformControlsAttachTarget(targetRef);

  const setOrbitEnabled = useCallback(
    (enabled: boolean) => {
      viewportControls?.setOrbitEnabled(enabled);
    },
    [viewportControls],
  );

  useEffect(() => {
    const gizmo = controlsRef.current;
    if (gizmo == null || attachTarget == null) {
      return;
    }

    const onDraggingChanged = (event: { value: boolean }) => {
      gizmoInteraction?.setSingleGizmoDragging(event.value);
      setOrbitEnabled(!event.value);
      if (event.value) {
        onDragStart?.();
      }
    };

    const onMouseDown = () => {
      onPointerDown?.();
      setOrbitEnabled(false);
    };

    const onMouseUp = () => {
      setOrbitEnabled(true);
      const target = targetRef.current;
      if (target == null) {
        return;
      }
      const currentMode = modeRef.current;
      if (currentMode === "translate" && onPositionCommit != null) {
        onPositionCommit(
          roundDiagram3dPosition([target.position.x, target.position.y, target.position.z]),
        );
        return;
      }
      if (currentMode === "rotate" && onRotationCommit != null) {
        onRotationCommit(readEulerDegreesFromObject3D(target));
        return;
      }
      if (currentMode === "scale" && onScaleCommit != null) {
        onScaleCommit(readScaleFromObject3D(target));
      }
    };

    gizmo.addEventListener("dragging-changed", onDraggingChanged);
    gizmo.addEventListener("mouseDown", onMouseDown);
    gizmo.addEventListener("mouseUp", onMouseUp);

    return () => {
      gizmo.removeEventListener("dragging-changed", onDraggingChanged);
      gizmo.removeEventListener("mouseDown", onMouseDown);
      gizmo.removeEventListener("mouseUp", onMouseUp);
      gizmoInteraction?.setSingleGizmoDragging(false);
      setOrbitEnabled(true);
    };
  }, [
    attachTarget,
    gizmoInteraction,
    onDragStart,
    onPointerDown,
    onPositionCommit,
    onRotationCommit,
    onScaleCommit,
    setOrbitEnabled,
    targetRef,
  ]);

  useEffect(() => {
    const gizmo = controlsRef.current;
    if (gizmo != null) {
      gizmo.mode = mode;
    }
  }, [attachTarget, mode]);

  if (attachTarget == null) {
    return null;
  }

  return (
    <TransformControls ref={controlsRef} object={attachTarget} mode={mode} size={gizmoSize} />
  );
}
