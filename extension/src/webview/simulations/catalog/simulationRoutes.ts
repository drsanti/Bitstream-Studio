/*******************************************************************************
 * File Name : simulationRoutes.ts
 *
 * Description : Dev URL helpers for ?sim= simulation routing.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { isViteDevMode } from "../../utils/isViteDevMode.js";
import { isSimulationId } from "./simulationIds.js";
import type { SimulationId } from "./simulationIds.js";

/**
 * Read active simulation from the current URL (?sim=e84-rotation).
 */
export function readSimulationIdFromUrl(): SimulationId | null
{
  if (typeof window === "undefined")
  {
    return null;
  }
  try
  {
    const params = new URLSearchParams(window.location.search);
    const sim = params.get("sim");
    return isSimulationId(sim) ? sim : null;
  }
  catch
  {
    return null;
  }
}

/** Persist ?sim= and skip landing on next dev load. */
export function commitSimulationUrl(id: SimulationId): void
{
  if (typeof window === "undefined" || !isViteDevMode())
  {
    return;
  }
  try
  {
    const url = new URL(window.location.href);
    url.searchParams.set("sim", id);
    url.searchParams.delete("landing");
    window.history.replaceState({}, "", url);
  }
  catch
  {
    // ignore
  }
}

/** Clear ?sim= when leaving a simulation. */
export function clearSimulationUrl(): void
{
  if (typeof window === "undefined" || !isViteDevMode())
  {
    return;
  }
  try
  {
    const url = new URL(window.location.href);
    url.searchParams.delete("sim");
    window.history.replaceState({}, "", url);
  }
  catch
  {
    // ignore
  }
}
