/*******************************************************************************
 * File Name : simulationCatalog.ts
 *
 * Description : Simulation metadata and lazy app loaders (wiring only).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Bot, Car, Cpu } from "lucide-react";
import type { SimulationAppModule, SimulationMeta } from "./types.js";
import type { SimulationId } from "./simulationIds.js";

export const SIMULATION_CATALOG: readonly SimulationMeta[] = [
  {
    id: "e84-rotation",
    title: "PSoC E84 Rotation Simulation",
    subtitle: "Edge AI · rotation · MQTT",
    description:
      "Oscillating PSoC E84 model with per-axis limits, speeds, and optional MQTT rotation publish.",
    tags: ["E84", "Rotation", "MQTT", "GLB"],
    accent: "sky",
    icon: Cpu,
    modelPath: "models/psoc-e84-ai/psoc-e84-ai.glb",
  },
  {
    id: "abb-robot",
    title: "ABB Robot Arm Simulation",
    subtitle: "Six-axis · GSAP · MQTT",
    description:
      "ABB arm joint control with smooth motion and robot/actuators MQTT topics.",
    tags: ["ABB", "Robot arm", "MQTT", "GSAP"],
    accent: "emerald",
    icon: Bot,
    modelPath: "models/abb-robot-arm/abb-robot-arm.glb",
  },
  {
    id: "vehicle-physics",
    title: "Vehicle Camera Physics Simulation",
    subtitle: "Jolt · drive · camera feed",
    description:
      "Four-wheel vehicle physics, driving camera, and configuration panels (Jolt migration in progress).",
    tags: ["Physics", "Vehicle", "Camera", "Jolt"],
    accent: "violet",
    icon: Car,
    modelPath: "models/car-cam-physics/car-cam-physics.glb",
  },
] as const;

/**
 * Lookup catalog entry by id.
 */
export function getSimulationMeta(id: SimulationId): SimulationMeta | undefined
{
  return SIMULATION_CATALOG.find((entry) => entry.id === id);
}

/**
 * Lazy-load the simulation app module (code-split per sim).
 */
export function loadSimulationApp(
  id: SimulationId,
): Promise<SimulationAppModule>
{
  switch (id)
  {
    case "e84-rotation":
      return import("../e84-rotation/index.js") as Promise<SimulationAppModule>;
    case "abb-robot":
      return import("../abb-robot/index.js") as Promise<SimulationAppModule>;
    case "vehicle-physics":
      return import("../vehicle-physics/index.js") as Promise<SimulationAppModule>;
    default:
    {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}
