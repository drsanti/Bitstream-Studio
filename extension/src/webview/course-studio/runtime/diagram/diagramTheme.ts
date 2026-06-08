import type { StyleTokenV1 } from "../../schemas/diagram.v1";

const STYLE_FILL: Record<StyleTokenV1, string> = {
  card: "var(--surface-card)",
  plain: "transparent",
  "accent-amber": "var(--accent-amber-bg)",
  "accent-cyan": "var(--accent-cyan-bg)",
  "axis-x": "var(--axis-x)",
  "axis-y": "var(--axis-y)",
  "axis-z": "var(--axis-z)",
  muted: "var(--text-muted)",
};

const STYLE_STROKE: Record<StyleTokenV1, string> = {
  card: "var(--surface-border)",
  plain: "var(--surface-border)",
  "accent-amber": "var(--accent-amber)",
  "accent-cyan": "var(--accent-cyan)",
  "axis-x": "var(--axis-x)",
  "axis-y": "var(--axis-y)",
  "axis-z": "var(--axis-z)",
  muted: "var(--text-muted)",
};

const STYLE_TEXT: Record<StyleTokenV1, string> = {
  card: "var(--text-primary)",
  plain: "var(--text-primary)",
  "accent-amber": "var(--accent-amber)",
  "accent-cyan": "var(--accent-cyan)",
  "axis-x": "var(--axis-x)",
  "axis-y": "var(--axis-y)",
  "axis-z": "var(--axis-z)",
  muted: "var(--text-muted)",
};

export function diagramFill(token: StyleTokenV1 | undefined, fallback = "var(--surface-card)"): string {
  return token ? STYLE_FILL[token] : fallback;
}

export function diagramStroke(
  token: StyleTokenV1 | undefined,
  fallback = "var(--surface-border)",
): string {
  return token ? STYLE_STROKE[token] : fallback;
}

export function diagramTextFill(
  token: StyleTokenV1 | undefined,
  fallback = "var(--text-secondary)",
): string {
  return token ? STYLE_TEXT[token] : fallback;
}
