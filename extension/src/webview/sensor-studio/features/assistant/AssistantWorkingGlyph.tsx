import { Bot } from "lucide-react";
import { gsap } from "gsap";
import { useEffect, useRef } from "react";

export type AssistantWorkingGlyphProps = {
  className?: string;
  iconClassName?: string;
};

/** Robot-style assistant icon with a subtle GSAP scale + rotation pulse. */
export function AssistantWorkingGlyph(props: AssistantWorkingGlyphProps) {
  const { className = "", iconClassName = "h-4 w-4 text-cyan-400/85" } = props;
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (el == null) {
      return;
    }
    gsap.set(el, { transformOrigin: "50% 50%" });
    const tween = gsap.fromTo(
      el,
      { scale: 1, rotation: -5 },
      {
        scale: 1.1,
        rotation: 5,
        duration: 0.9,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      },
    );
    return () => {
      tween.kill();
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: "transform" });
    };
  }, []);

  return (
    <span ref={rootRef} className={`inline-flex shrink-0 ${className}`.trim()} aria-hidden>
      <Bot className={iconClassName} strokeWidth={2} />
    </span>
  );
}
