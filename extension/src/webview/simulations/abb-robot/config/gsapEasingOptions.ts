/*******************************************************************************
 * File Name : gsapEasingOptions.ts
 *
 * Description : GSAP easing ids for ABB joint motion.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

export type GsapEasingOption = {
  id: string;
  label: string;
};

export const GSAP_EASING_OPTIONS: readonly GsapEasingOption[] = [
  { id: "power2.out", label: "Power2 Out" },
  { id: "power2.in", label: "Power2 In" },
  { id: "power2.inOut", label: "Power2 InOut" },
  { id: "power3.out", label: "Power3 Out" },
  { id: "linear", label: "Linear" },
  { id: "ease", label: "Ease" },
  { id: "easeInOut", label: "Ease InOut" },
  { id: "back.out", label: "Back Out" },
  { id: "elastic.out", label: "Elastic Out" },
  { id: "bounce.out", label: "Bounce Out" },
] as const;

export const DEFAULT_GSAP_EASING = "power2.out";
