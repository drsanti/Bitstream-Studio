import type { StyleTokenV1 } from "../schemas/diagram.v1";

export const DIAGRAM_STYLE_TOKEN_OPTIONS: { value: StyleTokenV1; label: string }[] = [
  { value: "card", label: "Card" },
  { value: "plain", label: "Plain" },
  { value: "accent-amber", label: "Accent amber" },
  { value: "accent-cyan", label: "Accent cyan" },
  { value: "axis-x", label: "Axis X" },
  { value: "axis-y", label: "Axis Y" },
  { value: "axis-z", label: "Axis Z" },
  { value: "muted", label: "Muted" },
];
