import { gsap } from "gsap";

const LAUNCHER_ANIMATED_SELECTOR =
  ".webview-launcher-hero__logo, .webview-launcher-hero__partner-logo";

/** Stop GSAP tweens when leaving the launcher so nothing leaks across app switches. */
export function killWebviewLauncherLogoAnimations(): void {
  if (typeof document === "undefined") {
    return;
  }
  gsap.killTweensOf(LAUNCHER_ANIMATED_SELECTOR);
  document.querySelectorAll<HTMLElement>(LAUNCHER_ANIMATED_SELECTOR).forEach((el) => {
    gsap.set(el, {
      clearProps: "transform,filter,opacity,visibility,x,xPercent,autoAlpha",
      opacity: 1,
      visibility: "visible",
      scale: 1,
      rotation: 0,
    });
  });
}
