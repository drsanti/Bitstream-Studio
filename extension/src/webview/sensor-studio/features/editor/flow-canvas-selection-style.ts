import type { FlowCanvasPreferences } from "../../persistence/flow-canvas-preferences";

export type FlowCanvasSelectionStyleVars = {
  "--studio-flow-selection-ring-color": string;
  "--studio-flow-selection-ring-opacity": string;
  "--studio-flow-selection-ring-width": string;
  "--studio-flow-marquee-color": string;
  "--studio-flow-marquee-opacity": string;
};

function hexToRgbTriplet(hex: string, fallback: string): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (m == null) {
    return fallback;
  }
  const n = Number.parseInt(m[1]!, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `${r} ${g} ${b}`;
}

export function buildFlowCanvasSelectionStyleVars(
  prefs: FlowCanvasPreferences,
): FlowCanvasSelectionStyleVars {
  return {
    "--studio-flow-selection-ring-color": hexToRgbTriplet(
      prefs.nodeSelectionRingHex,
      "50 250 250",
    ),
    "--studio-flow-selection-ring-opacity": String(prefs.nodeSelectionRingOpacity),
    "--studio-flow-selection-ring-width": `${prefs.nodeSelectionRingWidthPx}px`,
    "--studio-flow-marquee-color": hexToRgbTriplet(
      prefs.marqueeSelectionHex,
      "59 130 246",
    ),
    "--studio-flow-marquee-opacity": String(prefs.marqueeSelectionOpacity),
  };
}

export function flowCanvasSelectionChromeClassNames(
  prefs: FlowCanvasPreferences,
): string {
  const classes: string[] = [];
  if (!prefs.showNodeSelectionRing) {
    classes.push("studio-flow-canvas--hide-node-selection");
  }
  if (prefs.showMarqueeSelectionRect) {
    classes.push("studio-flow-canvas--show-marquee-selection");
  }
  return classes.join(" ");
}
