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

import { SimulationHost } from "./SimulationHost.js";

/**
 * Root host when a simulation id is active in {@link useSimulationHubStore}.
 * Eager import — lazy chunks duplicated React and broke R3F hooks (#321).
 */
export function SimulationHub()
{
  return <SimulationHost />;
}
