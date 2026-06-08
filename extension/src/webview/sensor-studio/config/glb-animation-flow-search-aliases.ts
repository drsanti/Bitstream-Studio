/** Extra palette / Shift+A search terms for GLB animation flow nodes. */
export const GLB_ANIMATION_FLOW_SEARCH_ALIASES: Readonly<Record<string, readonly string[]>> = {
  "animation-clip": ["clip", "glb", "action", "walk", "mixer", "weight", "loop"],
  "animation-merge": ["merge", "combine", "layer", "clips", "glb"],
  "animation-mix": ["mix", "weight", "weighted", "combine", "layer", "glb"],
  "animation-blend": ["blend", "crossfade", "factor", "mix", "glb"],
  "glb-animation-bundle": ["bundle", "clips", "multi", "sequence", "solo"],
};

/** Catalog ids grouped under Shift+A **Animation** (not Scene). */
export const GLB_ANIMATION_FLOW_SHIFT_A_NODE_IDS: ReadonlySet<string> = new Set([
  "animation-clip",
  "animation-merge",
  "animation-mix",
  "animation-blend",
  "glb-animation-bundle",
]);
