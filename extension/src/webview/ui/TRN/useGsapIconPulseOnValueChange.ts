import type { ReactNode, RefObject } from "react";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import type { SensorTelemetryIconPulseAnimationPreset } from "../../bitstream-app/config/sensorTelemetryUiConfig.js";
import {
  type TrnIconPulseIntensityPreset,
  resolveTrnIconPulseTimeline,
} from "./trnIconPulsePresets.js";

/** Achromatic color along `pulseHue`: gray ↔ peak only (no hue sweep). */
function cssColorToNeutralHslAtPulseHue(cssColor: string, pulseHue: number): string {
  const Lpct = parseCssRgbLightnessPercent(cssColor);
  if (Lpct == null) {
    return `hsl(${pulseHue}, 0%, 65%)`;
  }
  return `hsl(${pulseHue}, 0%, ${Lpct}%)`;
}

function parseCssRgbLightnessPercent(cssColor: string): number | null {
  const s = cssColor.trim();
  const m = s.match(
    /rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/,
  );
  if (m == null) {
    return null;
  }
  const r = Math.min(255, Number(m[1])) / 255;
  const g = Math.min(255, Number(m[2])) / 255;
  const b = Math.min(255, Number(m[3])) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  return Math.round(l * 1000) / 10;
}

export function displayValueStableKey(displayValue: ReactNode): string {
  if (typeof displayValue === "string" || typeof displayValue === "number") {
    return String(displayValue);
  }
  if (displayValue == null || displayValue === false) {
    return "";
  }
  return "\uE000";
}

export type TrnIconPulseStyle = {
  throttleMs: number;
  intensityPreset: TrnIconPulseIntensityPreset;
  peakColorHex: string;
  animationPreset: SensorTelemetryIconPulseAnimationPreset;
  /** When false, only scale/rotation pulse; no peak color tween on the icon. */
  colorAnimationEnabled: boolean;
};

/** @deprecated Use {@link TrnIconPulseStyle}. */
export type TRNParameterIconPulseStyle = TrnIconPulseStyle;

/**
 * GSAP scale / rotation (and optional color) pulse when `pulseKeySource` changes.
 * Does not restart while a pulse is running; respects throttle and reduced motion.
 */
export function useGsapIconPulseOnValueChange(
  iconElRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  icon: ReactNode | undefined,
  pulseKeySource: ReactNode,
  /** When `iconSlotStyle.color` is set (e.g. gauge hue), never strip it — tooltip triggers use `text-inherit` and would turn the icon white. */
  iconRestColor: string | undefined,
  pulseStyle: TrnIconPulseStyle,
): void {
  const key = displayValueStableKey(pulseKeySource);
  const iconPresent = icon != null;
  const prevRef = useRef<string | null>(null);
  const lastPulseAtRef = useRef(0);
  const iconRestColorRef = useRef(iconRestColor);
  iconRestColorRef.current = iconRestColor;

  const applyIconColorRest = (node: HTMLDivElement) => {
    const c = iconRestColorRef.current;
    if (c != null && c !== "") {
      node.style.color = c;
    } else {
      node.style.removeProperty("color");
    }
  };

  useLayoutEffect(() => {
    const stopIconTween = () => {
      const node = iconElRef.current;
      if (node != null) {
        gsap.killTweensOf(node);
        const svg = node.querySelector("svg");
        if (svg != null) {
          gsap.killTweensOf(svg);
          svg.style.removeProperty("color");
        }
        gsap.set(node, { scale: 1, rotation: 0 });
        applyIconColorRest(node);
      }
    };

    if (!enabled || !iconPresent) {
      stopIconTween();
    }

    return () => {
      stopIconTween();
    };
  }, [enabled, iconPresent, iconElRef]);

  useLayoutEffect(() => {
    if (!enabled || !iconPresent) {
      return;
    }

    const el = iconElRef.current;
    if (el == null) {
      return;
    }

    const svg = el.querySelector<SVGSVGElement>("svg");

    if (prevRef.current === null) {
      prevRef.current = key;
      return;
    }
    if (prevRef.current === key) {
      return;
    }

    // Do not stack or restart the pulse while the previous one is still running.
    if (gsap.isTweening(el) || (svg != null && gsap.isTweening(svg))) {
      prevRef.current = key;
      return;
    }

    prevRef.current = key;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const now = Date.now();
    if (now - lastPulseAtRef.current < pulseStyle.throttleMs) {
      return;
    }
    lastPulseAtRef.current = now;

    runPulseTimeline(el, svg, pulseStyle, applyIconColorRest);
  }, [enabled, iconPresent, key, iconElRef, pulseStyle]);
}

function runPulseTimeline(
  el: HTMLDivElement,
  svg: SVGSVGElement | null,
  pulseStyle: TrnIconPulseStyle,
  applyIconColorRest: (node: HTMLDivElement) => void,
): void {
  const t = resolveTrnIconPulseTimeline(
    pulseStyle.intensityPreset,
    pulseStyle.peakColorHex,
    pulseStyle.animationPreset,
  );
  const doColor = pulseStyle.colorAnimationEnabled;
  const colorTarget: HTMLElement | SVGElement = svg ?? el;

  gsap.killTweensOf(el);
  if (doColor) {
    gsap.killTweensOf(colorTarget);
  }

  let neutralHsl = "";
  if (doColor) {
    const fromColor = getComputedStyle(colorTarget).color;
    neutralHsl = cssColorToNeutralHslAtPulseHue(fromColor, t.pulseHue);
    gsap.set(colorTarget, { color: neutralHsl });
  }
  gsap.set(el, { scale: 1, rotation: 0 });

  const restoreAfterPulse = () => {
    gsap.set(el, { scale: 1, rotation: 0 });
    if (doColor) {
      if (svg != null) {
        svg.style.removeProperty("color");
      } else {
        applyIconColorRest(el);
      }
    }
    applyIconColorRest(el);
  };

  const tl = gsap.timeline({ onComplete: restoreAfterPulse });

  if (svg != null) {
    tl.fromTo(
      el,
      { scale: 1, rotation: 0 },
      {
        scale: t.peakScale,
        rotation: t.peakRotation,
        duration: t.d1,
        ease: t.peakEase,
        overwrite: "auto",
      },
      0,
    );
    if (doColor) {
      tl.fromTo(
        svg,
        { color: neutralHsl },
        {
          color: t.peakColorCss,
          duration: t.d1,
          ease: t.peakEase,
          overwrite: "auto",
        },
        0,
      );
    }
    tl.to(el, {
      rotation: t.midRotation,
      duration: t.d2,
      ease: t.midEase,
    }).to(el, {
      scale: 1,
      rotation: 0,
      duration: t.d3,
      ease: t.returnEase,
    });
    if (doColor) {
      tl.to(
        svg,
        {
          color: neutralHsl,
          duration: t.d3,
          ease: t.returnEase,
        },
        "<",
      );
    }
  } else if (doColor) {
    tl.fromTo(
      el,
      { scale: 1, rotation: 0, color: neutralHsl },
      {
        scale: t.peakScale,
        rotation: t.peakRotation,
        color: t.peakColorCss,
        duration: t.d1,
        ease: t.peakEase,
        overwrite: "auto",
      },
    )
      .to(el, {
        rotation: t.midRotation,
        duration: t.d2,
        ease: t.midEase,
      })
      .to(el, {
        scale: 1,
        rotation: 0,
        color: neutralHsl,
        duration: t.d3,
        ease: t.returnEase,
      });
  } else {
    tl.fromTo(
      el,
      { scale: 1, rotation: 0 },
      {
        scale: t.peakScale,
        rotation: t.peakRotation,
        duration: t.d1,
        ease: t.peakEase,
        overwrite: "auto",
      },
    )
      .to(el, {
        rotation: t.midRotation,
        duration: t.d2,
        ease: t.midEase,
      })
      .to(el, {
        scale: 1,
        rotation: 0,
        duration: t.d3,
        ease: t.returnEase,
      });
  }
}
