/**
 * Presentation design tokens — axis colors and typography scale.
 */
import chroma from "chroma-js";

const BASE = {
  axisX: "#F87171",
  axisY: "#34D399",
  axisZ: "#60A5FA",
  cyan: "#06B6D4",
  amber: "#FBBF24",
  purple: "#A78BFA",
  green: "#22C55E",
  red: "#EF4444",
};

function axisRamp(hex: string) {
  return {
    base: hex,
    bg: chroma(hex).alpha(0.08).css(),
    tint: chroma(hex).alpha(0.18).css(),
    border: chroma(hex).alpha(0.35).css(),
    glow: chroma(hex).alpha(0.25).css(),
    hover: chroma(hex).darken(0.35).hex(),
    light: chroma(hex).brighten(0.4).hex(),
    gradStart: chroma(hex).alpha(0.35).css(),
    gradEnd: chroma(hex).alpha(0.0).css(),
  };
}

export const presentationTokens = {
  axis: {
    x: axisRamp(BASE.axisX),
    y: axisRamp(BASE.axisY),
    z: axisRamp(BASE.axisZ),
  },
} as const;

export { BASE };
