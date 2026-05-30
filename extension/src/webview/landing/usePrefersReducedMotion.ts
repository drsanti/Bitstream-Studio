/*******************************************************************************
 * File Name : usePrefersReducedMotion.ts
 *
 * Description : Hook for prefers-reduced-motion media query (landing 3D fallback).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect, useState } from "react";

/**
 * True when the user prefers reduced motion (OS / browser accessibility setting).
 */
export function usePrefersReducedMotion(): boolean
{
  const [reduced, setReduced] = useState(() =>
  {
    if (typeof window === "undefined")
    {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() =>
  {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () =>
    {
      setReduced(media.matches);
    };
    media.addEventListener("change", onChange);
    return () =>
    {
      media.removeEventListener("change", onChange);
    };
  }, []);

  return reduced;
}
