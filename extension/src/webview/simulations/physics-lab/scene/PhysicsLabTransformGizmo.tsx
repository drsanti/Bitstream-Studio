"use no memo";

import { TransformControls } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { Group } from "three";
import type { TransformControls as TransformControlsImpl } from "three-stdlib";
import { physicsLabBodyById, usePhysicsLabStore } from "../store/physicsLabStore.js";
import {
  physicsLabDegToRad,
  physicsLabRadToDeg,
  roundPhysicsLabPosition,
  type PhysicsLabGizmoMode,
} from "../utils/physicsLabMath.js";
import { setPhysicsLabOrbitEnabled } from "./physicsLabOrbitControlsRef.js";

type PhysicsLabTransformGizmoProps = {
  onObjectPointerDown: () => void;
};

export function PhysicsLabTransformGizmo({ onObjectPointerDown }: PhysicsLabTransformGizmoProps) {
  const workbenchMode = usePhysicsLabStore((s) => s.workbenchMode);
  const authoringMode = usePhysicsLabStore((s) => s.authoringMode);
  const gizmoMode = usePhysicsLabStore((s) => s.gizmoMode);
  const activeId = usePhysicsLabStore((s) => s.activeId);
  const bodies = usePhysicsLabStore((s) => s.bodies);
  const pushUndoSnapshot = usePhysicsLabStore((s) => s.pushUndoSnapshot);
  const updateBodyTransform = usePhysicsLabStore((s) => s.updateBodyTransform);

  const targetRef = useRef<Group | null>(null);
  const [attachTarget, setAttachTarget] = useState<Group | null>(null);
  const controlsRef = useRef<TransformControlsImpl | null>(null);
  const modeRef = useRef<PhysicsLabGizmoMode>(gizmoMode);
  const draggingRef = useRef(false);
  modeRef.current = gizmoMode;

  const activeBody = activeId != null ? physicsLabBodyById(bodies, activeId) : undefined;

  useEffect(() => {
    const target = targetRef.current;
    if (target == null || activeBody == null) {
      return;
    }
    target.position.set(...activeBody.position);
    const rot = activeBody.rotationDeg ?? [0, 0, 0];
    target.rotation.set(...physicsLabDegToRad(rot));
  }, [activeBody]);

  useEffect(() => {
    const gizmo = controlsRef.current;
    if (gizmo == null) {
      return;
    }

    const onDraggingChanged = (event: { value: boolean }) => {
      draggingRef.current = event.value;
      setPhysicsLabOrbitEnabled(!event.value);
      if (event.value) {
        pushUndoSnapshot();
      }
    };

    const onMouseDown = () => {
      onObjectPointerDown();
      setPhysicsLabOrbitEnabled(false);
    };

    const onMouseUp = () => {
      setPhysicsLabOrbitEnabled(true);
      const target = targetRef.current;
      const id = activeId;
      if (target == null || id == null) {
        return;
      }
      if (modeRef.current === "translate") {
        updateBodyTransform(id, {
          position: roundPhysicsLabPosition([target.position.x, target.position.y, target.position.z]),
        });
        return;
      }
      if (modeRef.current === "rotate") {
        updateBodyTransform(id, {
          rotationDeg: physicsLabRadToDeg(target.rotation),
        });
      }
    };

    gizmo.addEventListener("dragging-changed", onDraggingChanged);
    gizmo.addEventListener("mouseDown", onMouseDown);
    gizmo.addEventListener("mouseUp", onMouseUp);

    return () => {
      gizmo.removeEventListener("dragging-changed", onDraggingChanged);
      gizmo.removeEventListener("mouseDown", onMouseDown);
      gizmo.removeEventListener("mouseUp", onMouseUp);
      setPhysicsLabOrbitEnabled(true);
    };
  }, [activeId, onObjectPointerDown, pushUndoSnapshot, updateBodyTransform]);

  useEffect(() => {
    const gizmo = controlsRef.current;
    if (gizmo != null) {
      gizmo.mode = gizmoMode;
    }
  }, [gizmoMode, activeBody]);

  if (
    workbenchMode !== "edit" ||
    authoringMode !== "object" ||
    activeBody == null
  ) {
    return null;
  }

  return (
    <>
      <group
        ref={(node) => {
          targetRef.current = node;
          setAttachTarget(node);
        }}
      />
      {attachTarget != null ? (
        <TransformControls ref={controlsRef} object={attachTarget} mode={gizmoMode} size={0.75} />
      ) : null}
    </>
  );
}
