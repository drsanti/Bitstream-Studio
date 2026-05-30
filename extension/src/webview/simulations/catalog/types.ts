/*******************************************************************************
 * File Name : types.ts
 *
 * Description : Catalog metadata types for Digital Twin simulations (no app logic).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import type { SimulationId } from "./simulationIds.js";

export type SimulationAccent = "sky" | "emerald" | "violet";

export type SimulationMeta = {
  id: SimulationId;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  accent: SimulationAccent;
  icon: LucideIcon;
  /** Relative model path under asset roots (see ASSETS_LOCATION_SYSTEM.md). */
  modelPath: string;
};

export type SimulationAppModule = {
  default: ComponentType<SimulationAppProps>;
};

export type SimulationAppProps = {
  onBack: () => void;
};
