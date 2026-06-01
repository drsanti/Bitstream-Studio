import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  readAnimationLabInspectorPanelWidthPx,
  persistAnimationLabInspectorPanelWidthPx,
} from "./animation-lab-persistence.js";

export const ANIMATION_LAB_INSPECTOR_PANEL_DEFAULT_WIDTH_PX = 320;
export const ANIMATION_LAB_INSPECTOR_PANEL_MIN_WIDTH_PX = 280;
export const ANIMATION_LAB_INSPECTOR_PANEL_MAX_WIDTH_PX = 560;

function clampInspectorWidth(px: number): number {
  const max = Math.min(
    ANIMATION_LAB_INSPECTOR_PANEL_MAX_WIDTH_PX,
    typeof window !== "undefined" ? Math.floor(window.innerWidth * 0.45) : ANIMATION_LAB_INSPECTOR_PANEL_MAX_WIDTH_PX,
  );
  return Math.min(max, Math.max(ANIMATION_LAB_INSPECTOR_PANEL_MIN_WIDTH_PX, Math.round(px)));
}

export function useAnimationLabInspectorPanelWidth(): {
  widthPx: number;
  onResizePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  resetWidth: () => void;
  nudgeWidth: (deltaPx: number) => void;
} {
  const [widthPx, setWidthPx] = useState(() =>
    clampInspectorWidth(readAnimationLabInspectorPanelWidthPx()),
  );
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const applyWidth = useCallback((next: number) => {
    const clamped = clampInspectorWidth(next);
    setWidthPx(clamped);
    persistAnimationLabInspectorPanelWidthPx(clamped);
  }, []);

  const resetWidth = useCallback(() => {
    applyWidth(ANIMATION_LAB_INSPECTOR_PANEL_DEFAULT_WIDTH_PX);
  }, [applyWidth]);

  useEffect(() => {
    const onPointerMove = (evt: PointerEvent) => {
      if (dragRef.current == null) {
        return;
      }
      const delta = evt.clientX - dragRef.current.startX;
      applyWidth(dragRef.current.startWidth - delta);
    };
    const onPointerUp = (evt: PointerEvent) => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [applyWidth]);

  const nudgeWidth = useCallback(
    (deltaPx: number) => {
      applyWidth(widthPx + deltaPx);
    },
    [applyWidth, widthPx],
  );

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }
      dragRef.current = { startX: event.clientX, startWidth: widthPx };
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [widthPx],
  );

  return { widthPx, onResizePointerDown, resetWidth, nudgeWidth };
}
