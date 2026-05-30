/*******************************************************************************
 * File Name : SimulationHost.tsx
 *
 * Description : Resolves active sim module and renders its default export.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Suspense, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { getSimulationMeta, loadSimulationApp } from "./catalog/simulationCatalog.js";
import type { SimulationAppProps } from "./catalog/types.js";
import { useSimulationHubStore } from "./simulationHub.store.js";
import { returnToWorkspaceLanding } from "../landing/bitstreamLandingActions.js";

/**
 * Loads the active simulation app component once per id change.
 */
export function SimulationHost()
{
  const activeId = useSimulationHubStore((s) => s.activeSimulationId);

  const [AppComponent, setAppComponent] = useState<ComponentType<SimulationAppProps> | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  const meta = useMemo(
    () => (activeId != null ? getSimulationMeta(activeId) : undefined),
    [activeId],
  );

  useEffect(() =>
  {
    if (activeId == null)
    {
      setAppComponent(null);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setAppComponent(null);
    setLoadError(null);

    void loadSimulationApp(activeId)
      .then((mod) =>
      {
        if (!cancelled)
        {
          setAppComponent(() => mod.default);
        }
      })
      .catch((err: unknown) =>
      {
        if (!cancelled)
        {
          const message = err instanceof Error ? err.message : String(err);
          setLoadError(message);
        }
      });

    return () =>
    {
      cancelled = true;
    };
  }, [activeId]);

  const handleBack = () =>
  {
    returnToWorkspaceLanding();
  };

  if (activeId == null)
  {
    return null;
  }

  if (loadError != null)
  {
    return (
      <div className="fixed inset-0 z-400 flex flex-col items-center justify-center gap-3 bg-zinc-950 p-6 text-center">
        <p className="text-sm font-medium text-red-300">Failed to load simulation</p>
        <p className="max-w-md text-xs text-zinc-500">{loadError}</p>
        <button
          type="button"
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200"
          onClick={handleBack}
        >
          Back to landing
        </button>
      </div>
    );
  }

  if (AppComponent == null)
  {
    return (
      <div className="fixed inset-0 z-400 flex items-center justify-center bg-zinc-950 text-sm text-zinc-400">
        Loading {meta?.title ?? activeId}…
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-400 flex items-center justify-center bg-zinc-950 text-sm text-zinc-400">
          Starting scene…
        </div>
      }
    >
      <AppComponent onBack={handleBack} />
    </Suspense>
  );
}
