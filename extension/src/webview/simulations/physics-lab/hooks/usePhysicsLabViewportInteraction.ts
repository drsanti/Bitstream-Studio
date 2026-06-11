import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { PhysicsLabBoxSelectProjector } from "../core/physicsLabBoxSelectProjector.js";
import {
  mergePhysicsLabBoxSelection,
  normalizePhysicsLabViewportScreenRect,
  physicsLabMarqueeIsDrag,
  shouldStartPhysicsLabViewportMarquee,
  type PhysicsLabViewportScreenRect,
} from "../core/physicsLabBoxSelection.js";
import { usePhysicsLabStore } from "../store/physicsLabStore.js";

type ViewportMarqueeState = {
  start: { x: number; y: number };
  current: { x: number; y: number };
  additive: boolean;
};

function isViewportChromeTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  return target.closest("[data-physics-lab-chrome]") != null;
}

export function usePhysicsLabViewportInteraction() {
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const boxSelectProjectorRef = useRef<PhysicsLabBoxSelectProjector | null>(null);
  const pointerHitObjectRef = useRef(false);
  const pendingMarqueeRef = useRef<{ start: { x: number; y: number }; additive: boolean } | null>(
    null,
  );
  const marqueeRef = useRef<ViewportMarqueeState | null>(null);
  const [marquee, setMarquee] = useState<ViewportMarqueeState | null>(null);

  const setSelection = usePhysicsLabStore((s) => s.setSelection);
  const clearSelection = usePhysicsLabStore((s) => s.clearSelection);

  const cancelViewportMarquee = useCallback(() => {
    pendingMarqueeRef.current = null;
    marqueeRef.current = null;
    setMarquee(null);
  }, []);

  useEffect(() => {
    marqueeRef.current = marquee;
  }, [marquee]);

  const markObjectHit = useCallback(() => {
    pointerHitObjectRef.current = true;
    cancelViewportMarquee();
  }, [cancelViewportMarquee]);

  const onRegisterBoxSelectProjector = useCallback((projector: PhysicsLabBoxSelectProjector | null) => {
    boxSelectProjectorRef.current = projector;
  }, []);

  const readLocalPoint = useCallback((event: ReactPointerEvent | PointerEvent) => {
    const root = canvasAreaRef.current;
    if (root == null) {
      return { x: 0, y: 0 };
    }
    const rect = root.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }, []);

  const onCanvasPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || isViewportChromeTarget(event.target)) {
        return;
      }
      if (!shouldStartPhysicsLabViewportMarquee(event.nativeEvent)) {
        return;
      }
      pointerHitObjectRef.current = false;
      pendingMarqueeRef.current = {
        start: readLocalPoint(event),
        additive: event.shiftKey,
      };
    },
    [readLocalPoint],
  );

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const pending = pendingMarqueeRef.current;
      if (pending == null) {
        return;
      }
      const current = readLocalPoint(event);
      const rect = normalizePhysicsLabViewportScreenRect(pending.start, current);
      if (!physicsLabMarqueeIsDrag(rect)) {
        return;
      }
      const next: ViewportMarqueeState = {
        start: pending.start,
        current,
        additive: pending.additive,
      };
      marqueeRef.current = next;
      setMarquee(next);
    };

    const onPointerUp = (event: PointerEvent) => {
      const pending = pendingMarqueeRef.current;
      const activeMarquee = marqueeRef.current;
      pendingMarqueeRef.current = null;

      if (activeMarquee != null) {
        const rect = normalizePhysicsLabViewportScreenRect(
          activeMarquee.start,
          readLocalPoint(event),
        );
        cancelViewportMarquee();
        if (physicsLabMarqueeIsDrag(rect)) {
          const hits = boxSelectProjectorRef.current?.(rect) ?? [];
          const current = usePhysicsLabStore.getState().selectedIds;
          const merged = mergePhysicsLabBoxSelection(current, hits, activeMarquee.additive);
          setSelection(merged.selectedIds, merged.activeId);
        }
        return;
      }

      if (pending != null && !pointerHitObjectRef.current) {
        clearSelection();
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [cancelViewportMarquee, clearSelection, readLocalPoint, setSelection]);

  const marqueeBox: PhysicsLabViewportScreenRect | null =
    marquee != null
      ? normalizePhysicsLabViewportScreenRect(marquee.start, marquee.current)
      : null;

  return {
    canvasAreaRef,
    onCanvasPointerDown,
    onRegisterBoxSelectProjector,
    markObjectHit,
    marqueeBox,
  };
}
