/*******************************************************************************
 * File Name : simulationIds.ts
 *
 * Description : Stable simulation identifiers for catalog and URL routing.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

export const SIMULATION_IDS = [
  "e84-rotation",
  "abb-robot",
  "vehicle-physics",
  "physics-lab",
] as const;

export type SimulationId = (typeof SIMULATION_IDS)[number];

/**
 * Returns true when value is a known simulation id.
 */
export function isSimulationId(value: string | null | undefined): value is SimulationId
{
  if (value == null || value === "")
  {
    return false;
  }
  return (SIMULATION_IDS as readonly string[]).includes(value);
}
