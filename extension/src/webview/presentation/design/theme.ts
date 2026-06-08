/**
 * Presentation theme — light and dark CSS variable maps.
 * Applied on `.presentation-root[data-presentation-theme="dark|light"]`.
 */
import chroma from "chroma-js";
import { BASE, presentationTokens } from "./tokens";

export type PresentationThemeMode = "dark" | "light";

type CSSVarMap = Record<string, string>;

function buildAxisVars(prefix: string, ramp: (typeof presentationTokens.axis.x)): CSSVarMap {
  return {
    [prefix]: ramp.base,
    [`${prefix}-bg`]: ramp.bg,
    [`${prefix}-tint`]: ramp.tint,
    [`${prefix}-border`]: ramp.border,
    [`${prefix}-glow`]: ramp.glow,
    [`${prefix}-grad-from`]: ramp.gradStart,
    [`${prefix}-grad-to`]: ramp.gradEnd,
  };
}

export const presentationDarkTheme: CSSVarMap = {
  "--surface-bg": "#0b0f1a",
  "--surface-panel": "#111827",
  "--surface-card": "#1e293b",
  "--surface-border": "#334155",
  "--surface-hover": "#263044",
  "--text-primary": "#f1f5f9",
  "--text-secondary": "#94a3b8",
  "--text-muted": "#64748b",
  "--text-inverse": "#0b0f1a",
  "--axis-x": BASE.axisX,
  "--axis-y": BASE.axisY,
  "--axis-z": BASE.axisZ,
  ...buildAxisVars("--axis-x", presentationTokens.axis.x),
  ...buildAxisVars("--axis-y", presentationTokens.axis.y),
  ...buildAxisVars("--axis-z", presentationTokens.axis.z),
  "--accent-cyan": BASE.cyan,
  "--accent-amber": BASE.amber,
  "--accent-purple": BASE.purple,
  "--accent-green": BASE.green,
  "--accent-red": BASE.red,
  "--accent-cyan-bg": chroma(BASE.cyan).alpha(0.1).css(),
  "--accent-amber-bg": chroma(BASE.amber).alpha(0.12).css(),
  "--accent-purple-bg": chroma(BASE.purple).alpha(0.1).css(),
  "--accent-green-bg": chroma(BASE.green).alpha(0.1).css(),
  "--accent-red-bg": chroma(BASE.red).alpha(0.1).css(),
  "--status-live": BASE.green,
  "--status-disconnected": "#475569",
  "--status-connecting": BASE.amber,
  "--status-sim": BASE.purple,
  "--scene-bg": "#080c14",
};

export const presentationLightTheme: CSSVarMap = {
  "--surface-bg": "#f8fafc",
  "--surface-panel": "#ffffff",
  "--surface-card": "#f1f5f9",
  "--surface-border": "#e2e8f0",
  "--surface-hover": "#e8edf4",
  "--text-primary": "#0f172a",
  "--text-secondary": "#475569",
  "--text-muted": "#94a3b8",
  "--text-inverse": "#f8fafc",
  "--axis-x": chroma(BASE.axisX).darken(0.3).hex(),
  "--axis-y": chroma(BASE.axisY).darken(0.5).hex(),
  "--axis-z": chroma(BASE.axisZ).darken(0.3).hex(),
  ...buildAxisVars("--axis-x", {
    ...presentationTokens.axis.x,
    base: chroma(BASE.axisX).darken(0.3).hex(),
    bg: chroma(BASE.axisX).alpha(0.06).css(),
    tint: chroma(BASE.axisX).alpha(0.12).css(),
    border: chroma(BASE.axisX).alpha(0.3).css(),
    glow: chroma(BASE.axisX).alpha(0.15).css(),
    gradStart: chroma(BASE.axisX).alpha(0.25).css(),
    gradEnd: chroma(BASE.axisX).alpha(0).css(),
    hover: chroma(BASE.axisX).darken(0.8).hex(),
    light: BASE.axisX,
  }),
  ...buildAxisVars("--axis-y", {
    ...presentationTokens.axis.y,
    base: chroma(BASE.axisY).darken(0.5).hex(),
    bg: chroma(BASE.axisY).alpha(0.06).css(),
    tint: chroma(BASE.axisY).alpha(0.12).css(),
    border: chroma(BASE.axisY).alpha(0.3).css(),
    glow: chroma(BASE.axisY).alpha(0.15).css(),
    gradStart: chroma(BASE.axisY).alpha(0.25).css(),
    gradEnd: chroma(BASE.axisY).alpha(0).css(),
    hover: chroma(BASE.axisY).darken(0.8).hex(),
    light: BASE.axisY,
  }),
  ...buildAxisVars("--axis-z", {
    ...presentationTokens.axis.z,
    base: chroma(BASE.axisZ).darken(0.3).hex(),
    bg: chroma(BASE.axisZ).alpha(0.06).css(),
    tint: chroma(BASE.axisZ).alpha(0.12).css(),
    border: chroma(BASE.axisZ).alpha(0.3).css(),
    glow: chroma(BASE.axisZ).alpha(0.15).css(),
    gradStart: chroma(BASE.axisZ).alpha(0.25).css(),
    gradEnd: chroma(BASE.axisZ).alpha(0).css(),
    hover: chroma(BASE.axisZ).darken(0.8).hex(),
    light: BASE.axisZ,
  }),
  "--accent-cyan": chroma(BASE.cyan).darken(0.2).hex(),
  "--accent-amber": chroma(BASE.amber).darken(0.4).hex(),
  "--accent-purple": chroma(BASE.purple).darken(0.2).hex(),
  "--accent-green": chroma(BASE.green).darken(0.3).hex(),
  "--accent-red": chroma(BASE.red).darken(0.2).hex(),
  "--accent-cyan-bg": chroma(BASE.cyan).alpha(0.07).css(),
  "--accent-amber-bg": chroma(BASE.amber).alpha(0.09).css(),
  "--accent-purple-bg": chroma(BASE.purple).alpha(0.07).css(),
  "--accent-green-bg": chroma(BASE.green).alpha(0.07).css(),
  "--accent-red-bg": chroma(BASE.red).alpha(0.07).css(),
  "--status-live": chroma(BASE.green).darken(0.3).hex(),
  "--status-disconnected": "#94a3b8",
  "--status-connecting": chroma(BASE.amber).darken(0.4).hex(),
  "--status-sim": chroma(BASE.purple).darken(0.2).hex(),
  "--scene-bg": "#e8edf4",
};

export function presentationThemeVars(mode: PresentationThemeMode): CSSVarMap {
  return mode === "dark" ? presentationDarkTheme : presentationLightTheme;
}
