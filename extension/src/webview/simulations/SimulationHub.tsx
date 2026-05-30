/*******************************************************************************
 * File Name : SimulationHub.tsx
 *
 * Description : Lazy-loads and mounts the active Digital Twin simulation app.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { lazy, Suspense } from "react";

const LazySimulationHost = lazy(async () =>
{
  const { SimulationHost } = await import("./SimulationHost.js");
  return { default: SimulationHost };
});

/**
 * Root host when a simulation id is active in {@link useSimulationHubStore}.
 */
export function SimulationHub()
{
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-400 flex items-center justify-center bg-zinc-950 text-sm text-zinc-400">
          Loading simulation…
        </div>
      }
    >
      <LazySimulationHost />
    </Suspense>
  );
}
