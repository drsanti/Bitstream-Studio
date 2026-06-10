import type { RefObject } from "react";
import { useLayoutEffect } from "react";
import { gsap } from "gsap";
import type { CourseTitleIconAnimation } from "../schemas/courseTitleIconAnimation";
import { resolveCourseTitleIconAnimation } from "../schemas/courseTitleIconAnimation";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function resolveRestColorHex(
  colorTarget: HTMLElement | SVGElement,
  restColor: string | undefined,
): string {
  if (restColor != null && /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(restColor)) {
    return restColor;
  }
  return getComputedStyle(colorTarget).color;
}

function restoreIconNode(el: HTMLDivElement, restColor: string | undefined): void {
  gsap.killTweensOf(el);
  gsap.set(el, { clearProps: "transform" });
  const svg = el.querySelector<SVGSVGElement>("svg");
  if (svg != null) {
    gsap.killTweensOf(svg);
    svg.style.removeProperty("color");
  }
  if (restColor != null && restColor.length > 0) {
    const target = svg ?? el;
    target.style.color = restColor;
  }
}

function runColorCycleTimeline(
  colorTarget: HTMLElement | SVGElement,
  cycle: string[],
  segmentDuration: number,
  ease: string,
  repeat: number,
): void {
  if (cycle.length < 2) {
    return;
  }
  const resolvedEase = ease === "none" ? "none" : ease;
  gsap.set(colorTarget, { color: cycle[0] });
  const tl = gsap.timeline({ repeat });
  for (let index = 1; index < cycle.length; index += 1) {
    tl.to(colorTarget, {
      color: cycle[index],
      duration: segmentDuration,
      ease: resolvedEase,
    });
  }
  tl.to(colorTarget, {
    color: cycle[0],
    duration: segmentDuration,
    ease: resolvedEase,
  });
}

/**
 * Looping GSAP motion / color animation for Course Studio prefix icons.
 * Respects prefers-reduced-motion.
 */
export function useCourseTitleIconGsapAnimation(
  wrapperRef: RefObject<HTMLDivElement | null>,
  animation: CourseTitleIconAnimation | undefined,
  restColor: string | undefined,
): void {
  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (el == null) {
      return;
    }

    const cleanup = () => {
      restoreIconNode(el, restColor);
    };

    if (prefersReducedMotion()) {
      cleanup();
      return cleanup;
    }

    const resolved = resolveCourseTitleIconAnimation(animation, restColor);
    if (resolved == null) {
      cleanup();
      return cleanup;
    }

    gsap.set(el, { transformOrigin: "50% 50%", x: 0, y: 0, scale: 1, rotation: 0 });
    const svg = el.querySelector<SVGSVGElement>("svg");
    const colorTarget = svg ?? el;
    const ease = resolved.ease === "none" ? "none" : resolved.ease;
    const tweenBase = {
      duration: resolved.duration,
      ease,
      repeat: resolved.repeat,
      yoyo: resolved.yoyo,
    };

    if (resolved.motion != null) {
      const toVars: gsap.TweenVars = { ...tweenBase };
      if (resolved.motion.x != null) {
        toVars.x = resolved.motion.x;
      }
      if (resolved.motion.y != null) {
        toVars.y = resolved.motion.y;
      }
      if (resolved.motion.scale != null) {
        toVars.scale = resolved.motion.scale;
      }
      if (resolved.motion.rotation != null) {
        toVars.rotation = resolved.motion.rotation;
      }
      gsap.to(el, toVars);
    }

    if (resolved.color?.cycle != null && resolved.color.cycle.length >= 2) {
      runColorCycleTimeline(
        colorTarget,
        resolved.color.cycle,
        resolved.duration,
        ease,
        resolved.repeat,
      );
    } else if (resolved.color?.yoyoTo != null) {
      const fromColor = resolveRestColorHex(colorTarget, restColor);
      gsap.fromTo(
        colorTarget,
        { color: fromColor },
        { color: resolved.color.yoyoTo, ...tweenBase },
      );
    }

    return cleanup;
  }, [animation, restColor, wrapperRef]);
}
