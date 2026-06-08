import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { usePresentationPresenterStore } from "../store/usePresentationPresenterStore";
import { LaserPointerOverlay } from "./LaserPointerOverlay";

export function SlideViewport({ children }: { children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const zoom = usePresentationPresenterStore((s) => s.zoom);
  const panX = usePresentationPresenterStore((s) => s.panX);
  const panY = usePresentationPresenterStore((s) => s.panY);
  const laserEnabled = usePresentationPresenterStore((s) => s.laserEnabled);
  const setPointerNorm = usePresentationPresenterStore((s) => s.setPointerNorm);

  const syncPointerFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const el = viewportRef.current;
      if (!el) {
        return;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }
      setPointerNorm({
        x: (clientX - rect.left) / rect.width,
        y: (clientY - rect.top) / rect.height,
      });
    },
    [setPointerNorm],
  );

  useEffect(() => {
    const el = viewportRef.current;
    if (!laserEnabled || !el) {
      return;
    }

    const onMove = (e: PointerEvent) => syncPointerFromClient(e.clientX, e.clientY);
    const onLeave = () => setPointerNorm(null);

    el.addEventListener("pointermove", onMove, { capture: true });
    el.addEventListener("pointerleave", onLeave);

    return () => {
      el.removeEventListener("pointermove", onMove, { capture: true });
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [laserEnabled, setPointerNorm, syncPointerFromClient]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) {
      return;
    }

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        return;
      }
      e.preventDefault();
      const { zoom: currentZoom, setZoom: applyZoom } = usePresentationPresenterStore.getState();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      applyZoom(currentZoom + delta);
    };

    el.addEventListener("wheel", onWheel, { passive: false, capture: true });

    return () => {
      el.removeEventListener("wheel", onWheel, { capture: true });
    };
  }, []);

  return (
    <div
      ref={viewportRef}
      className={`presentation-slide-viewport${laserEnabled ? " presentation-slide-viewport--laser" : ""}`}
    >
      <div
        className="presentation-slide-viewport__transform"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
        }}
      >
        {children}
      </div>
      <LaserPointerOverlay />
    </div>
  );
}
