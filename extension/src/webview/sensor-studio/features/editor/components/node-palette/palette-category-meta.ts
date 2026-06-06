import type { NodeCatalogEntry } from "../../../../core/config/config-types";

export const PALETTE_CATEGORY_ORDER: NodeCatalogEntry["category"][] = [
  "sensor",
  "input",
  "audio",
  "transform",
  "logic",
  "scene",
  "output",
  "utility",
  "generator",
];

export const PALETTE_CATEGORY_LABEL: Record<NodeCatalogEntry["category"], string> = {
  sensor: "Sensors",
  input: "Input",
  audio: "Audio",
  transform: "Transform",
  logic: "Logic",
  scene: "Scene",
  output: "Output",
  utility: "Utility",
  generator: "Generator",
};
