/*******************************************************************************
 * File Name : WebGLRouteTransitionSplash.tsx
 *
 * Description : Full-screen placeholder while waiting for WebGL teardown gap.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

export type WebGLRouteTransitionSplashProps = {
  label?: string;
};

/**
 * Shown between landing and simulation routes while the prior Canvas disposes.
 */
export function WebGLRouteTransitionSplash({
  label = "Loading…",
}: WebGLRouteTransitionSplashProps)
{
  return (
    <div className="fixed inset-0 z-400 flex items-center justify-center bg-zinc-950 text-sm text-zinc-400">
      {label}
    </div>
  );
}
