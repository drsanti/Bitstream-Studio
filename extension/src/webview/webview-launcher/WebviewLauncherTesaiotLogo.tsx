import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import tesaiotLogoUrl from "../assets/images/tesaiot-logo.png";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * TESAIoT wordmark: fade-in grow, then opacity/scale breathe (50–100%).
 * Avoids `autoAlpha` and CSS `filter` tweens — both can make the PNG vanish in Chrome.
 */
export function WebviewLauncherTesaiotLogo() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img == null) {
      return;
    }

    gsap.set(img, {
      transformOrigin: "50% 50%",
      visibility: "visible",
    });

    if (prefersReducedMotion()) {
      gsap.set(img, { opacity: 1, scale: 1 });
      return;
    }

    gsap.set(img, {
      opacity: 0,
      scale: 0.92,
    });

    const entrance = gsap.timeline({ delay: 0.2 });
    entrance.to(img, {
      opacity: 1,
      scale: 1,
      duration: 0.85,
      ease: "power2.out",
    });

    const breathe = gsap.timeline({ repeat: -1, delay: 1.05 });
    breathe
      .to(img, {
        opacity: 0.5,
        scale: 1,
        duration: 2.2,
        ease: "sine.inOut",
      })
      .to(img, {
        opacity: 1,
        scale: 1.05,
        duration: 2.2,
        ease: "sine.inOut",
      });

    return () => {
      entrance.kill();
      breathe.kill();
      gsap.killTweensOf(img);
      gsap.set(img, { opacity: 1, scale: 1, visibility: "visible" });
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="webview-launcher-hero__logo-wrap relative inline-flex w-full max-w-[min(31vw,10.667rem)] justify-center sm:max-w-[10.667rem]"
    >
      <img
        ref={imgRef}
        src={tesaiotLogoUrl}
        alt="TESAIoT"
        className="webview-launcher-hero__logo relative z-1 h-auto w-full object-contain will-change-[transform,opacity]"
        width={171}
        height={43}
        decoding="async"
      />
    </div>
  );
}
