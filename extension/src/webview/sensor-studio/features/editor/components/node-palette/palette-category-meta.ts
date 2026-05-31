import type { NodeCatalogEntry } from "../../../../core/config/config-types";

export const PALETTE_CATEGORY_ORDER: NodeCatalogEntry["category"][] = [
  "sensor",
  "input",
  "transform",
  "logic",
  "output",
  "utility",
  "generator",
];

export const PALETTE_CATEGORY_LABEL: Record<NodeCatalogEntry["category"], string> = {
  sensor: "Sensors",
  input: "Input",
  transform: "Transform",
  logic: "Logic",
  output: "Output",
  utility: "Utility",
  generator: "Generator",
};
