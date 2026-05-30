import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import chroma from "chroma-js";
import { GlobalConfig } from "../../../GlobalConfig";

/**
 * Fixed top-center badge when {@link GlobalConfig.IS_DEV_MODE} is true.
 * `pointer-events-none` so it does not block interaction with the canvas or UI.
 * Text color animates between white and black via GSAP + chroma-js.
 */
export function DevModeBadge() {
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!GlobalConfig.IS_DEV_MODE || !textRef.current) {
      return;
    }

    const el = textRef.current;

    const ctx = gsap.context(() => {
      const tweenState = { t: 0 };
      gsap.to(tweenState, {
        t: 1,
        duration: 2.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        onUpdate: () => {
          const mixed = chroma.mix("#ffffff", "#000000", tweenState.t, "lrgb");
          el.style.color = mixed.hex();
        },
      });
    });

    return () => {
      ctx.revert();
    };
  }, []);

  if (!GlobalConfig.IS_DEV_MODE) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-3 z-9999 inline-flex -translate-x-1/2 select-none items-center justify-center rounded-full border border-green-500/30 bg-green-500/25 px-2 py-[4px] shadow-md shadow-black/50 backdrop-blur-sm"
      role="status"
      aria-label="Development mode"
    >
      <span
        ref={textRef}
        className="font-mono text-[10px] font-semibold uppercase leading-none tracking-widest"
        style={{ color: "#ffffff" }}
      >
        DEV MODE
      </span>
    </div>
  );
}
