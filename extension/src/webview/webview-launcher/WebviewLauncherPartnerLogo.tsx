import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import tesaLogoUrl from "../assets/images/tesa-logo.png";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** ~⅓ of the original wobble (was ±20° and scale 1.2). */
const ROT_SWING_DEG = 7;
const SCALE_PEAK = 1.067;

/**
 * TESA logo: quick fade-in, then a gentle wobble (scale ~100–107%, rotate ±7°).
 */
export function WebviewLauncherPartnerLogo() {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (el == null) {
      return;
    }

    gsap.set(el, { transformOrigin: "50% 50%", visibility: "visible" });

    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, scale: 1, rotation: 0 });
      return;
    }

    gsap.set(el, {
      opacity: 0,
      scale: 0.97,
      rotation: -ROT_SWING_DEG,
    });

    const entrance = gsap.timeline();
    entrance.to(el, {
      opacity: 1,
      scale: 1,
      rotation: -ROT_SWING_DEG,
      duration: 0.65,
      ease: "power2.out",
    });

    const alive = gsap.timeline({ repeat: -1, delay: 0.7 });
    alive
      .to(el, {
        scale: SCALE_PEAK,
        rotation: 0,
        duration: 1.6,
        ease: "sine.inOut",
      })
      .to(el, {
        scale: 1,
        rotation: ROT_SWING_DEG,
        duration: 1.6,
        ease: "sine.inOut",
      })
      .to(el, {
        scale: SCALE_PEAK,
        rotation: 0,
        duration: 1.6,
        ease: "sine.inOut",
      })
      .to(el, {
        scale: 1,
        rotation: -ROT_SWING_DEG,
        duration: 1.6,
        ease: "sine.inOut",
      });

    return () => {
      entrance.kill();
      alive.kill();
      gsap.killTweensOf(el);
      gsap.set(el, { opacity: 1, scale: 1, rotation: 0, visibility: "visible" });
    };
  }, []);

  return (
    <img
      ref={imgRef}
      src={tesaLogoUrl}
      alt="Thai Embedded Systems Association (TESA)"
      className="webview-launcher-hero__partner-logo h-auto w-full max-w-[11.25rem] object-contain will-change-[transform,opacity] sm:max-w-[12.75rem]"
      width={384}
      height={384}
      decoding="async"
    />
  );
}
