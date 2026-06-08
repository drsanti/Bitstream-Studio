import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const DEFAULT_TWEEN_MS = 280;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Smooth numeric display updates for live metric blocks (GSAP tween).
 * Respects prefers-reduced-motion — snaps instantly when enabled.
 */
export function useCourseDisplayTween(
  target: number,
  options?: { durationMs?: number },
): number {
  const durationMs = options?.durationMs ?? DEFAULT_TWEEN_MS;
  const [display, setDisplay] = useState(target);
  const valueRef = useRef({ v: target });

  useLayoutEffect(() => {
    valueRef.current.v = target;
    if (prefersReducedMotion()) {
      setDisplay(target);
      return;
    }
    gsap.killTweensOf(valueRef.current);
    gsap.to(valueRef.current, {
      v: target,
      duration: durationMs / 1000,
      ease: "power2.out",
      onUpdate: () => setDisplay(valueRef.current.v),
    });
  }, [target, durationMs]);

  return display;
}
