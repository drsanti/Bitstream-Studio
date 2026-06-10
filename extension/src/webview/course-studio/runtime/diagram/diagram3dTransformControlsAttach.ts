import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { Object3D } from "three";

/** Resolve a ref to an R3F-managed Object3D before mounting drei TransformControls. */
export function useDiagram3dTransformControlsAttachTarget<T extends Object3D>(
  targetRef: RefObject<T | null>,
): T | null {
  const [attachTarget, setAttachTarget] = useState<T | null>(() => targetRef.current);

  useLayoutEffect(() => {
    const next = targetRef.current;
    setAttachTarget((current) => (current === next ? current : next));
  });

  return attachTarget;
}

/** Callback ref that keeps a mutable ref and mirrored attach state in sync. */
export function useDiagram3dTransformControlsObjectRef<T extends Object3D>(): {
  objectRef: RefObject<T | null>;
  attachTarget: T | null;
  setObjectRef: (node: T | null) => void;
} {
  const objectRef = useRef<T | null>(null);
  const [attachTarget, setAttachTarget] = useState<T | null>(null);

  const setObjectRef = useCallback((node: T | null) => {
    objectRef.current = node;
    setAttachTarget((current) => (current === node ? current : node));
  }, []);

  return { objectRef, attachTarget, setObjectRef };
}
