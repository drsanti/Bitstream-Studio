import type { AnimationLabCatalogHints } from "./animation-lab-catalog-hints.js";

function humanizeClipName(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return raw;
  }
  const base = trimmed.includes("|") ? (trimmed.split("|").pop() ?? trimmed) : trimmed;
  const spaced = base.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim();
  if (spaced.length === 0) {
    return trimmed;
  }
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function resolveAnimationLabClipDisplayName(
  clipName: string,
  hints: AnimationLabCatalogHints | null | undefined,
): string {
  const label = hints?.clipLabels?.[clipName];
  if (typeof label === "string" && label.trim().length > 0) {
    return label.trim();
  }
  return humanizeClipName(clipName);
}
